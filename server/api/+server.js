import { defineEventHandler, readBody } from 'h3';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

const dbPath = './mydatabase.db';
const db = new sqlite3.Database(dbPath);

export default defineEventHandler(async (event) => {
  const { method } = event.node.req;
  event.node.res.setHeader('Access-Control-Allow-Origin', '*');
  event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 요청 처리
  if (method === 'OPTIONS') {
    event.node.res.statusCode = 200;
    return 'OK';
  }

  if (method === 'GET') {
    const user_id = event.node.req.headers.user_id; // 사용자 ID 가져오기
  
    if (!user_id) {
      return { status: 'error', message: '사용자 인증이 필요합니다.' };
    }
  
    return new Promise((resolve) => {
      // 사용자 ID로 카테고리 조회
      db.all("SELECT * FROM categories WHERE user_id = ?", [user_id], (err, categories) => {
        if (err) {
          console.error("카테고리 조회 오류:", err.message);
          resolve({ status: 'error', message: '카테고리 조회 실패' });
        } else {
          const categoryIds = categories.map((cat) => cat.id);
          if (categoryIds.length === 0) {
            // 카테고리가 없으면 빈 배열 반환
            resolve({ status: 'success', categories: [] });
            return;
          }
  
          // 카테고리 ID로 태스크 조회
          db.all(
            "SELECT * FROM tasks WHERE category_id IN (" + categoryIds.map(() => '?').join(',') + ") AND user_id = ?",
            [...categoryIds, user_id],
            (taskErr, tasks) => {
              if (taskErr) {
                console.error("태스크 조회 오류:", taskErr.message);
                resolve({ status: 'error', message: '태스크 조회 실패' });
              } else {
                const categoriesWithTasks = categories.map((cat) => ({
                  ...cat,
                  tasks: tasks.filter((task) => task.category_id === cat.id),
                }));
                resolve({ status: 'success', categories: categoriesWithTasks });
              }
            }
          );
        }
      });
    });
  }
  
  
  const body = await readBody(event);

  switch (method) {
    case 'POST':
      // OAuth 콜백 처리
      if (body.action === 'oauth') {
        const { code } = body;
        try {
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: '77251841608-nddq8a02fp8o9fu2ugk1kebuh3klcvvt.apps.googleusercontent.com',
              client_secret: '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',
              code,
              redirect_uri: 'http://localhost:3000/callback',
              grant_type: 'authorization_code',
            }),
          });
          
          const tokenData = await tokenResponse.json();
          const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenData.access_token}`);
          const userData = await userInfoResponse.json();
      
          if (userData.email) {
            return { status: 'success', accountVerified: true, email: userData.email };
          } else {
            return { status: 'error', message: '사용자 정보를 가져오는 데 실패했습니다.' };
          }
        } catch (error) {
          console.error('OAuth 처리 오류:', error);
          return { status: 'error', message: 'OAuth 인증 중 오류가 발생했습니다.' };
        }
      }

      // 회원가입 처리
      if (body.action === 'register') {
        const { id, password } = body;

        return new Promise((resolve) => {
          db.get("SELECT * FROM users WHERE name = ?", [id], async (err, row) => {
            if (err) {
              console.error("회원가입 오류:", err.message);
              return resolve({ status: 'error', message: '서버 오류' });
            }

            if (row) {
              console.log("이미 존재하는 아이디:", id);
              return resolve({ status: 'error', message: '이미 존재하는 아이디입니다.' });
            }

            try {
              const passwordHash = await bcrypt.hash(password, 10);
              db.run("INSERT INTO users (name, pw) VALUES (?, ?)", [id, passwordHash], (insertErr) => {
                if (insertErr) {
                  console.error("회원가입 오류:", insertErr.message);
                  return resolve({ status: 'error', message: '회원가입 실패' });
                }
                console.log("회원가입 완료:", id);
                return resolve({ status: 'success', message: '회원가입 성공' });
              });
            } catch (hashErr) {
              console.error("비밀번호 해싱 오류:", hashErr.message);
              return resolve({ status: 'error', message: '비밀번호 처리 중 오류가 발생했습니다.' });
            }
          });
        });
      }

      // 로그인 처리
      if (body.action === 'login') {
        const { id, pw } = body;

        return new Promise((resolve) => {
          db.get("SELECT * FROM users WHERE name = ?", [id], async (err, row) => {
            if (err) {
              console.error("데이터베이스 오류:", err.message);
              return resolve({ status: 'error', message: '서버 오류가 발생했습니다.' });
            }

            if (!row) {
              return resolve({ status: 'error', message: '존재하지 않는 아이디입니다.' });
            }

            const isMatch = await bcrypt.compare(pw, row.pw);
            return isMatch
              ? resolve({ status: 'success', message: '로그인 성공' })
              : resolve({ status: 'error', message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
          });
        });
      }

      // 카테고리 추가 처리
      if (body.add) {
        const { add, user_id } = body;
        const newCategoryId = new Date().getTime();
        return new Promise((resolve) => {
          db.run("INSERT INTO categories (id, text, user_id) VALUES (?, ?, ?)", [newCategoryId, add, user_id], (err) => {
            if (err) {
              console.error("카테고리 추가 오류:", err.message);
              resolve({ status: 'error', message: '카테고리 추가 실패' });
            } else {
              resolve({ status: 'success', message: '카테고리가 추가되었습니다.' });
            }
          });
        });
      }
      break;

      case 'PUT':
        if (body.addTask) {
          const { content, year, month, day, categoryId ,user_id} = body;
          if (!content || !year || !month || !day || !categoryId || !user_id) {
            return { status: 'error', message: '필수 값이 누락되었습니다.' };
          }
          if(isNaN(month) || isNaN(day)){
            return { status: 'error', message: '숫자로 써주세요.' };
          }
          if(month > 12 || day >31){
            return { status: 'error', message: '올바른 날짜를 입력해 주세요.' };
          }
      
          const newTaskId = new Date().getTime();
          return new Promise((resolve) => {
            db.run(
              "INSERT INTO tasks (id, category_id, content, year, month, day, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [newTaskId, categoryId, content, year, month, day, user_id],
              (err) => {
                if (err) {
                  console.error("태스크 추가 오류:", err.message);
                  resolve({ status: 'error', message: '태스크 추가 실패' });
                } else {
                  resolve({ status: 'success', message: '태스크가 추가되었습니다.', taskId: newTaskId });
                }
              }
            );
          });
        }
        break;      

    case 'DELETE':
      if (body.categoryId) {
        const { categoryId } = body;
        return new Promise((resolve) => {
          db.run("DELETE FROM categories WHERE id = ?", [categoryId], (err) => {
            if (err) {
              console.error("카테고리 삭제 오류:", err.message);
              return resolve({ status: 'error', message: '카테고리 삭제 실패' });
            }
            db.run("DELETE FROM tasks WHERE category_id = ?", [categoryId], (taskErr) => {
              if (taskErr) {
                console.error("카테고리 관련 태스크 삭제 오류:", taskErr.message);
                return resolve({ status: 'error', message: '카테고리 관련 태스크 삭제 실패' });
              }
              console.log('카테고리 및 관련 태스크 삭제:', categoryId);
              resolve({ status: 'success', message: '카테고리 및 관련 태스크가 삭제되었습니다.' });
            });
          });
        });
      } 
      if (body.taskId) {
        const { taskId } = body;
        return new Promise((resolve) => {
          db.run("DELETE FROM tasks WHERE id = ?", [taskId], (err) => {
            if (err) {
              console.error("태스크 삭제 오류:", err.message);
              return resolve({ status: 'error', message: '태스크 삭제 실패' });
            }
            console.log('태스크 삭제 성공:', taskId);
            resolve({ status: 'success', message: '태스크가 삭제되었습니다.' });
          });
        });
      }
      break;

    default:
      return { status: 'error', message: '허용되지 않은 메서드입니다.' };
  }
});