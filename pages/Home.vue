<template>
  <button class="username" @click="toggleLogout">{{ userId }}님 환영합니다></button>
  <button v-if="logout" class="logoutclass" @click="logoutb">로그아웃</button>
  <div class="todo"><span>My</span>ToDo</div>

  <div class="mid">
    <!-- 페이지 내 아무것도 없으면 출력 -->
    <strong v-if="showtext && !texthiddenPermanently">
      아직 아무것도 적지 않았습니다.<br>카테고리를 작성해주세요.
    </strong>

    <!-- 카테고리 추가 버튼 -->
    <div class="start-container">
      <button class="startbutton" @click="checkButton2">New categorie<span>+</span></button>
    </div>

    <!-- 카테고리 작성 박스 -->
    <transition name="fade">
      <div v-if="showRectangle" class="rectangle">
        <!-- 뒤로가기 버튼 -->
        <button class="back" @click="checkbackbutton">➔</button>

        <!-- 카테고리 입력 -->
        <input type="text" v-model="add" placeholder="카테고리 작성" :disabled="isAddFixed" />

        <!-- 확인 버튼 -->
        <button class="check" @click="checkcheckbutton">확인</button>
      </div>
    </transition>

    <!-- 카테고리 리스트 -->
    <div v-if="categories.length > 0" class="categories-container">
      <div v-for="(category, index) in categories" :key="category.id" class="category-wrapper">
        <!-- 카테고리 박스 -->
        <div class="addbox" :class="{ expanded: category.isExpanded }">

          <!--카테고리 삭제 버튼-->
          <button class="delete" @click="deletebutton(index)">del</button>

          <!--카테고리 제목-->
          <div class="supertitle" style="font-weight: bolder">
            {{ category.text }}
          </div>

          <!-- Task 추가 버튼 -->
          <button class="AWB" @click="addwork(index)">New Task<span>+</span></button>

          <div v-if="category.isExpanded">
            <!-- Task 박스 및 내용 표시 -->
            <template v-if="category.tasks && category.tasks.length > 0">
              <div class="tasks-container">
                <div v-for="(task) in category.tasks" :key="task.id" class="taskbox">

                  <!-- 태스크 완료 버튼 -->
                  <button class="endbox" @click="endTask(task.id)":style="{ backgroundColor: task.isCompleted ? '#7EB6FF' : 'white' }"></button>

                  <!-- 태스크 내용과 마감일 -->
                  <div class="task-details">
                    <div class="task-content">
                      {{ task.content }} - {{ task.year }}/{{ task.month }}/{{ task.day }}
                    </div>
                    <span class="task-status" :class="{ red: compareDates(task) === '기간이 지났습니다.' }">
                      {{ compareDates(task) }}
                    </span>
                  </div>

                  <!-- 태스크 삭제 버튼 -->
                  <button class="delbox" @click="delTask(index, task.id)">X</button>
                </div>
              </div>
            </template>
            <!-- Task 내용 없으면 출력 -->
            <template v-else>
              <div class="nothingtext">아직 내용을 작성하지 않았습니다.</div>
            </template>
          </div>

          <!-- 확장 버튼 -->
          <button class="extend-btn" @click="toggleExpand(index)">▼</button>
        </div>

        <!-- Task 추가 박스 -->
        <div v-if="category.showaddbox" class="addboxbox">
          <button @click="no(index)" class="nobox">➔</button>
          <input type="text" placeholder="내용 작성:" v-model="content" class="addworkrectangle">
          <div class="timeout-container">
            <input type="text" placeholder="연도" v-model="currentYear" class="timeout" disabled>
            <input type="text" placeholder="월" v-model="currentMonth" class="timeout">
            <input type="text" placeholder="일" v-model="currentDay" class="timeout">
          </div>
          <button class="allow" @click="allowbutton(index)">확인</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// 상태 변수들
const categories = ref([]);
const showRectangle = ref(false);
const showtext = ref(true);
const texthiddenPermanently = ref(false);
const add = ref('');
const isAddFixed = ref(false);
const content = ref('');
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref('');
const currentDay = ref('');
const userId = ref('');
const logout = ref(false);
const router = useRouter();

// 데이터베이스에서 카테고리와 태스크 불러오기
const loadCategoriesFromDatabase = async () => {
  const user_id = localStorage.getItem('user_id');

  try {
    const response = await fetch(`/api/+server`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'user_id': user_id,
      },
    });

    const data = await response.json();
    if (data.status === 'success') {
      categories.value = data.categories.map((category) => ({
        ...category,
        showaddbox: false, // 태스크 추가 박스 초기화
        tasks: category.tasks || [], // 태스크 초기화
      }));

      // 상태 업데이트
      showtext.value = categories.value.length === 0;
      texthiddenPermanently.value = categories.value.length > 0;
    } else {
      console.error('카테고리 불러오기 실패:', data.message);
    }
  } catch (error) {
    console.error('데이터베이스 불러오기 오류:', error);
  }
};



// 페이지가 로드될 때 데이터베이스에서 데이터 불러오기
onMounted(() => {
  userId.value = localStorage.getItem('user_id') || '게스트';
  loadCategoriesFromDatabase();
});

// Task 며칠 남았는지 계산
const compareDates = (task) => {
  const currentDate = new Date();
  const taskDate = new Date(task.year, task.month - 1, task.day);
  const timeDiff = taskDate - currentDate;
  const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return dayDiff > 0 ? `${dayDiff}일 남았습니다.` : '기간이 지났습니다.';
};

// 카테고리 추가 버튼
const checkButton2 = () => {
  showRectangle.value = true;
  isAddFixed.value = false;
  add.value = '';
};

// 카테고리 추가 박스 뒤로가기 버튼
const checkbackbutton = () => {
  showRectangle.value = false;
  showtext.value = categories.value.length === 0;
};

// Task 추가 버튼
const addwork = (index) => {
  categories.value[index].showaddbox = !categories.value[index].showaddbox;
  categories.value[index].isExpanded = true; 
};

// Task 추가 상자 뒤로가기 버튼
const no = (index) => {
  categories.value[index].showaddbox = false;
};

// 카테고리 크기 유지
const toggleExpand = (index) => {
  console.log('아이디 버튼 눌림.')
  categories.value[index].isExpanded = !categories.value[index].isExpanded;
  categories.value[index].showaddbox = false;
};

//토글로 로그아웃 상태 처리
const toggleLogout = () => {
  logout.value = !logout.value; 
};

//로그아웃 처리
const logoutb = () => {
  console.log('로그아웃 실행'); 

  localStorage.removeItem('user_id')

  router.push('/');
};

// 카테고리 추가 함수
const checkcheckbutton = async () => {
  const user_id = localStorage.getItem('user_id');

  if (add.value === '') {
    alert('카테고리를 작성해주세요');
    return;
  }

  try {
    const response = await fetch('/api/+server', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ add: add.value, user_id }), 
    });

    const data = await response.json();
    if (data.status === 'success') {
      loadCategoriesFromDatabase(); // 데이터 새로고침
      add.value = '';
      showRectangle.value = false;
      showtext.value = false;
      texthiddenPermanently.value = true;
    } else {
      console.error('카테고리 추가 실패:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};


// 카테고리 삭제 함수
const deletebutton = async (index) => {
  const categoryId = categories.value[index].id;

  try {
    const response = await fetch('/api/+server', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryId }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      loadCategoriesFromDatabase(); // 데이터 새로고침
      console.log('카테고리 삭제 성공');
    } 
    else {
      console.error('카테고리 삭제 실패:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Task 추가 함수
const allowbutton = async (index) => {
  const user_id = localStorage.getItem('user_id');
  const categoryId = categories.value[index]?.id;

  // 유효성 검사
  if (!content.value || !currentMonth.value || !currentDay.value) {
    alert('모든 필드를 작성해주세요');
    return;
  }
  if (!categoryId) {
    console.error('카테고리 ID가 유효하지 않습니다.');
    alert('카테고리를 찾을 수 없습니다.');
    return;
  }

  try {
    // 서버로 태스크 추가 요청
    const response = await fetch('/api/+server', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.value,
        year: currentYear.value,
        month: currentMonth.value,
        day: currentDay.value,
        categoryId,
        user_id,
        addTask: true,
      }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      const newTask = {
        id: data.taskId, 
        content: content.value,
        year: currentYear.value,
        month: currentMonth.value,
        day: currentDay.value,
      };
      categories.value[index].tasks.push(newTask);

      // 상태 초기화
      content.value = '';
      currentMonth.value = '';
      currentDay.value = '';
      categories.value[index].showaddbox = false; 
    } else {
      console.error('태스크 추가 실패:', data.message);
    }
  } catch (error) {
    console.error('태스크 추가 중 오류 발생:', error);
  }
};


//Task 삭제 함수
const delTask = async (categoryIndex, taskId) => {
  try {
    const response = await fetch('/api/+server', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    const data = await response.json();
    if (data.status === 'success') {
      // 해당 카테고리에서 태스크를 삭제
      categories.value[categoryIndex].tasks = categories.value[categoryIndex].tasks.filter(
        (task) => task.id !== taskId
      );
      console.log('Task 삭제 성공');
    } else {
      console.error('Task 삭제 실패:', data.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};


// Task 완성 함수
const endTask = async (taskId) => {
  let categoryIndex = null;
  let taskIndex = null;

  // 태스크의 카테고리와 인덱스 찾기
  categories.value.forEach((category, cIndex) => {
    const tIndex = category.tasks.findIndex((task) => task.id === taskId);
    if (tIndex !== -1) {
      categoryIndex = cIndex;
      taskIndex = tIndex;
    }
  });

  if (categoryIndex === null || taskIndex === null) {
    console.error('태스크를 찾을 수 없습니다.');
    return;
  }

  // 태스크 완료 상태 업데이트
  categories.value[categoryIndex].tasks[taskIndex].isCompleted = true;

  // 일정 시간 후 태스크 삭제
  setTimeout(async () => {
    try {
      const response = await fetch('/api/+server', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        categories.value[categoryIndex].tasks.splice(taskIndex, 1); // 태스크 삭제
        console.log('Task 삭제 성공');
      } else {
        console.error('Task 삭제 실패:', data.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, 5000); // 5초 후 삭제
};


</script>


<style scoped>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  min-height: 100vh; 
  overflow-x: hidden;
}

.mid {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.start-container {
  display: flex;
  align-items: center;
  position: absolute; 
  top: 50px;
  left: 10px; 
  gap: 10px; 
  z-index: 2;
}

div.mid strong {
  margin: auto;
  margin-top: 20px;
  font-size: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.startbutton {
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 60px;
  border: none;
  border-radius: 30px;
  background: linear-gradient(135deg, #f3f4ff, #f9fafe);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  font-weight: bold;
  color: #8a8abb;
  cursor: pointer;
  text-align: center;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  transition: all 0.3s ease;
}


.startbutton:hover {
  background: linear-gradient(135deg, #e8e9ff, #f4f5ff); 
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15); 
  transform: translateX(-50%) scale(1.05);
}

.startbutton span {
  color: #6a6abb; 
  margin-left: 5px; 
}

.rectangle {
  position: absolute; 
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%); 
  width: 300px;
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f4f5ff, #f4f5ff);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  z-index: 10;
}

.rectangle input {
  width: 90%;
  height: 100px;
  margin: 50px 0;
  padding: 15px;
  font-size: 17px;
  color: black;
  background: #ffffff; 
  border: none; 
  border-radius: 25px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s ease;
}

.rectangle input:focus {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); 
  background: #f9fafe;
}

.back {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6a6abb;
}

.check {
  width: 90%;
  height: 50px;
  margin-top: 10px;
  background: linear-gradient(135deg, #f3f4ff, #f9fafe); 
  border: none;
  border-radius: 25px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  color: #6a6abb;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.check:hover {
  background: linear-gradient(135deg, #e8e9ff, #f4f5ff); 
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
}

.categories-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}

.category-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap :20px;
  
}

.addbox {
  position: relative;
  background: linear-gradient(135deg, #b6bbfb, #f0f0ff, #ffffff);
  width: 700px;
  height: 100px;
  display: flex;
  flex-direction: column; 
  justify-content: space-between; 
  align-items: flex-start;
  text-align: left;
  font-size: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 15px;
  line-height: 1.5;
  transition: height 0.5s ease, box-shadow 0.3s ease, transform 0.3s ease;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  margin-bottom: 20px;
  padding: 20px;
  cursor: pointer;
}

.addbox:hover {
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2); 
  transform: translateY(-3px); 
}

.addbox.expanded {
  height: 600px; 
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3); 
}

.extend-btn {
  position: relative; 
  width: 100%; 
  margin-top: auto;
  background: #aab7ff; 
  border: none;
  border-radius: 8px;
  font-size: 15px;
  padding: 10px;
  color: #4a4a4a;
  cursor: pointer;
  transition: background 0.3s ease;
}

.extend-btn:hover {
  background: #7e91ff; 
}

.addboxbox {
  background: linear-gradient(135deg, #bba6ff, #b3e4fe); 
  width: 300px; 
  height: 600px; 
  border-radius: 15px;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column; 
  justify-content: center; 
  align-items: center; 
  padding: 20px; 
  transition: height 0.3s ease, box-shadow 0.3s ease; 
  margin-top: 20px; 
  transition: height 0.5s ease, box-shadow 0.3s ease, transform 0.3s ease;
  position: relative;
}

.addboxbox:hover{
  height: 600px; 
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.5); 
  transform: translateY(-3px); 
}

.delete {
  position: absolute;
  top: 10px; 
  right: 10px; 
  cursor: pointer;
  background: linear-gradient(135deg, #f3f4ff, #f9fafe); 
  border: none; 
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 14px;
  color: #6a6abb; 
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); 
  transition: all 0.3s ease; 
}

.delete:hover {
  background: linear-gradient(135deg, #f7e7e7, #e2c0c0);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); 
  transform: translateY(-2px); 
}

.nobox {
  position: absolute;
  top: 10px;
  right: 10px; 
  cursor: pointer;
  background: linear-gradient(135deg, #f3f4ff, #f9fafe); 
  border: none; 
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 14px;
  color: #6a6abb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 100; 
}

.nobox:hover {
  background: linear-gradient(135deg, #f7e7e7, #e2c0c0);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}


.addworkrectangle {
  border: none;
  background-color: #ffffff;
  color: black;
  border-radius: 10px;
  margin: 20px auto;
  font-size: 20px;
  width: 250px;
  height: 100px;
  text-align: center;
  position: relative;
  top: -100px;
  transform: translateY(0);
  font-weight: bolder;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s ease;
}

.addworkrectangle:focus {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); 
  background-color: #f7ffff; 
  transform: translateY(-3px);
}


.timeout {
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: bold;
  width: 90%;
  text-align: center;
  height: 45px;
  margin: 2px;
  background: linear-gradient(135deg, #f2fdfd, #f5fdff); 
}

.timeout-container {
  display: flex;
  justify-content: space-between;
  width: 90%;
  margin: 10px auto;
  position: relative;
  top: -30px;
}

.allow {
  width: 150px;
  height: 50px;
  background: linear-gradient(135deg, #b9f9fc, #e5b0ff);
  color: black;
  border: none;
  text-align: center;
  font-size: 20px;
  border-radius: 20px;
  cursor: pointer;
  bottom: 0px; 
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  top: 150px;
  font-weight: bold;
}

.allow:hover{
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.taskbox {
  position: relative;
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  width: 90%;
  height: 50px;
  margin: 10px auto; 
  padding: 10px;
  background: linear-gradient(135deg, #fffdf6, #fff4ea);
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease; 
}


.taskbox:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2); 
}

.task-content {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden; 
  text-overflow: ellipsis;
}

.task-title {
  font-weight: bold;
  color: #333;
}

.task-status-container {
  text-align: left;
  font-size: 14px;
  color: gray;
}

.task-details {
  display: flex; 
  align-items: center;
  gap: 5px;
  flex: 1;
}

.taskbox .task-content {
  padding-left: 50px; 
  display: flex;
  align-items: center; 
  width: auto;
  gap: 5px;
}

.taskbox .task-content::after {
  content: " - ";
  gap: 5px;
}

.taskbox .task-status {
  position: relative;
  display: block;
  color: black;
  text-align: center;
  white-space: nowrap;
  font-size: 15px;
}

.task-status {
  text-align: left;
  font-size: 14px;
  color: gray;
  font-weight: bold;
}

.task-status.red {
  color: red;
  font-weight: bold;
}

.endbox {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.3s ease, transform 0.3s ease;
}


.endbox:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transform: scale(1.1); 
}

.AWB {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px; 
  height: 40px; 
  border: none;
  border-radius: 30px; 
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  font-weight: bolder;
  font-size: 15px;
  background: linear-gradient(135deg, #f3f4ff, #f9fafe); 
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); 
  color: #8a8abb;
  transition: all 0.3s ease;
}

.AWB span {
  color: #6a6abb;
  margin-left: 5px;
}

.AWB:hover {
  background: linear-gradient(135deg, #e8e9ff, #f4f5ff); 
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%) scale(1.05);
}

@media screen and (max-width: 700px) {
  .taskbox .task-content {
    font-size: 16px;
  }
}

.delbox {
  top: 10px;
  right: 10px;
  position: absolute;
  padding: 10px;
  width: 20px;
  height: 20px;
  border: none;
  outline: none;
  background: linear-gradient(135deg, #ee9292, #ff7078); 
  color: rgb(5, 5, 5);
  border-radius: 3px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.delbox:hover {
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.15);
  transform: translateX(3%) scale(1.05);
}

.tasks-container {
  width: 120%;
  margin: 0 auto; 
  padding: 20px 20px;
  flex-shrink: 0;
  margin-left: 5px;
}

.username{
  font-weight: bolder;
  font-size: 15px;
  z-index: 10;
  color: black;
  background-color: rgb(176, 176, 176, 0.3);
  border: 0px;
  cursor: pointer;
  pointer-events: auto; 
}

.logoutclass {
  font-weight: bolder;
  font-size: 15px;
  z-index: 10;
  color: black;
  background-color: rgba(247, 43, 43, 0.3);
  border: 0px;
  cursor: pointer;
  pointer-events: auto; 
  margin-left: 5px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0; 
}

.nothingtext{
  color: black;
  font-weight: bold;
  font-size: 20px;
}

.todo{
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 60px;
  font-weight: bolder;
}
.todo span{
  color: #7e91ff;
}
</style>
