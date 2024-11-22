import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('./mydatabase.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 사용자 테이블 생성
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, pw TEXT)");

    // 카테고리 테이블 생성 (user_id 추가)
    db.run("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, text TEXT, user_id TEXT)");

    // 태스크 테이블 생성 (user_id 추가)
    db.run("CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY, category_id INTEGER, content TEXT, year INTEGER, month INTEGER, day INTEGER, user_id TEXT)");

        // 모든 사용자 데이터 조회
        db.all("SELECT * FROM users", (err, rows) => {
            if (err) {
                console.error("데이터 조회 오류:", err.message);
            } else {
                console.log("데이터베이스에 저장된 사용자 데이터:", rows);
            }

            // 카테고리 데이터 조회
            db.all("SELECT * FROM categories", (err, rows) => {
                if (err) {
                    console.error("카테고리 데이터 조회 오류:", err.message);
                } else {
                    console.log("데이터베이스에 저장된 카테고리 데이터:", rows);
                }
            });

            // 태스크 데이터 조회
            db.all("SELECT * FROM tasks", (err, rows) => {
                if (err) {
                    console.error("태스크 데이터 조회 오류:", err.message);
                } else {
                    console.log("데이터베이스에 저장된 태스크 데이터:", rows);
                }
            });

            // 데이터 조회 후 데이터베이스 닫기
            db.close((closeErr) => {
                if (closeErr) {
                    console.error("데이터베이스 닫기 오류:", closeErr.message);
                } else {
                    console.log("데이터베이스 초기화 완료 및 닫기 성공");
                }
            });
        });
});
