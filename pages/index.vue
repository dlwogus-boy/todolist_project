<template>
  <div class="mid">
    <div class="title">
      <div>ToDo</div>
      <div class="bigtitle">LIST</div>
    </div>

    <!-- 로그인 폼 -->
    <input type="text" v-model="loginId" placeholder="아이디" :disabled="isBlocked" class="in" required />
    <input type="password" v-model="loginPw" placeholder="비밀번호" :disabled="isBlocked" class="in" required />

    <!-- 로그인 버튼 -->
    <button @click="checkButton(loginId, loginPw)" :disabled="isBlocked" class="startb">로그인</button>

    <!-- 결과 메시지 출력 -->
    <p v-if="message">{{ message }}</p>

    <!-- 로그인 실패 메시지 -->
    <div v-if="isBlocked" class="error-message">더 이상 시도할 수 없습니다.</div>
    <div v-if="isBlocked" class="error-message">{{ remainingTime }}초 후 사용 가능.</div>

    <!-- 회원가입 버튼: 로그인 비밀번호 입력 필드 아래에 배치 -->
    <button @click="toggleRegisterForm" class="registerb" :disabled="isBlocked">회원가입</button>

    <!-- 회원가입 폼 -->
    <div v-if="showRegisterForm">

      <!-- 구글 OAuth 이메일 인증 버튼 -->
      <button @click="redirectToGoogleOAuth" class="googlebox" :disabled="isBlocked">구글 계정으로 이메일 인증</button>

      <!-- 구글 인증 후 나타나는 계정 확인 및 새 아이디/비밀번호 입력 필드 -->
      <div v-if="accountVerified" class="register-section">
        <input type="text" v-model="id" placeholder="새 아이디 입력" required :disabled="isBlocked" class="newin"/>
        <input type="password" v-model="password" placeholder="새 비밀번호 입력" required :disabled="isBlocked" class="newin">
        <button @click="register" class="register-button">회원가입 완료</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const router = useRouter();
const email = ref('');
const id = ref('');
const password = ref('');
const loginId = ref('');
const loginPw = ref('');
const isBlocked = ref(false);
const failcount = ref(0);
const maxFails = 3;
const accountVerified = ref(false);
const message = ref('');
const showRegisterForm = ref(false);
const remainingTime = ref(60);

// 회원가입 폼 표시 전환 함수
const toggleRegisterForm = () => {
  showRegisterForm.value = !showRegisterForm.value;
};

// 구글 OAuth 리디렉션
const redirectToGoogleOAuth = () => {
  const clientId = '77251841608-nddq8a02fp8o9fu2ugk1kebuh3klcvvt.apps.googleusercontent.com';
  const redirectUri = 'http://localhost:3000/callback';
  const scope = 'profile email';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=select_account`;
  
  window.location.href = authUrl;
};

// 회원가입 처리 함수
const register = async () => {
  if (!accountVerified.value) {
    message.value = '먼저 계정 확인을 해주세요.';
    return;
  }

  if(id === '' || password === ''){
    console.log('새로 생성할 아이디 또는 비밀번호를 적어주세요');
    return;
  }

  try {
    const response = await fetch('/api/+server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'register',
        id: id.value,
        password: password.value
      }),
    });

    const result = await response.json();
    if (result.status === 'success') {
      message.value = '회원가입이 완료되었습니다.';
      accountVerified.value = false;
    } else {
      message.value = `회원가입 실패: ${result.message}`;
    }
  } catch (error) {
    console.error('회원가입 오류:', error);
    message.value = '서버 오류가 발생했습니다.';
  }
};

// 로그인 처리 함수
const checkButton = async (id, pw) => {
  if (isBlocked.value) {
    alert('3회 이상 로그인 실패하여 더 이상 시도할 수 없습니다.');
    return;
  }

  try {
    const response = await fetch('/api/+server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', id, pw }),
    });

    const result = await response.json();
    if (result.status === 'success') {
      message.value = result.message;
      localStorage.setItem('user_id', id); // 로그인한 사용자 ID 저장
      router.push({ path: '/Home', query: { userId: id } }); // Home으로 이동
    } 
    else {
      message.value = `로그인 실패: ${result.message}`;
      failcount.value += 1;
      if (failcount.value >= maxFails) {
        isBlocked.value = true;
        startCountdown();
      }
    }
    }
   catch (error) {
    console.error('로그인 오류:', error);
    message.value = '서버 오류가 발생했습니다.';
  }
};

//상태 시간 확인
const startCountdown = () => {
  remainingTime.value = 15; // 15초로 초기화
  timer = setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value -= 1; // 1초씩 감소
    } 
    else if(remainingTime.value === 0){
      message.value = `로그인을 다시 이용 가능합니다`;
      isBlocked.value = false; // 차단 해제
      failcount.value = 0; // 실패 횟수 초기화
      remainingTime.value = 15;
    }
  }, 1000);
};

onMounted(() => {
  console.log("OAuth 콜백 데이터:", route.query);

  if (route.query.accountVerified === 'true' && route.query.email) {
    accountVerified.value = true;
    email.value = route.query.email;
  } else {
    console.log("OAuth 인증 실패 또는 값 없음");
  }
});
</script>

<style scoped>
.mid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 393px;
  height: 700px;
  margin: auto;

}

.startb,
.in {
  width: 550px;
  box-sizing: border-box;
  padding: 20px;
  border: 1px solid rgb(193, 193, 193); 
}

.startb {
  background: linear-gradient(135deg, #2ef8ffa2, #156ac5);
  color: white;
  font-weight: bold;
  font-size: 30px;
  padding: 10px;
  border: 1px solid mediumturquoise;
  cursor: pointer;
  margin-top: 50px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease;
  transition: all 0.3s ease;
}

.startb:hover {
  background: linear-gradient(135deg, #0056b3, #003d80);
  transform: translateY(-3px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
}

.startb:active {
  background: linear-gradient(135deg, #003d80, #002959);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transform: scale(0.98);
}

.in {
  background: linear-gradient(135deg, #fdfdff, #e3eefa);
  border: 1px solid rgb(193, 193, 193);
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
  color: black;
  outline: none;
  font-size: 30px;
  font-weight: bold;
  margin-top: 10px;
  padding: 20px;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease;
}

.in:focus {
  box-shadow: 0 4px 8px rgba(248, 252, 255, 0.5);
  background-color: #f9f9ff;
  transform: scale(1.02);
}

.in:hover {
  border-color: #0056b3;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.title {
  text-align: center;
  font-family: arial;
  font-size: 50px;
  margin-bottom: 80px;
  font-weight: bolder;
}

.bigtitle {
  font-size: 90px;
  color: white;
  font-weight: bolder;
  text-shadow: 3px 2px 5px black, 
               -3px 2px 5px black, 
               3px -2px 5px black, 
               -3px -2px 5px black;
}

.error-message {
  color: red;
  font-size: 20px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.registerb {
  background-color: white;
  color: gray;
  font-size: 20px;
  font-weight: bold;
  border: 2px solid gray;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease;
}

.registerb:hover {
  background-color: #f0f0f0; 
  border-color: #555;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15); 
  transform: translateY(-2px); 
}

.registerb:active {
  background-color: #e0e0e0;
  border-color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); 
  transform: scale(0.98);
}

.googlebox {
  color: black;
  cursor: pointer;
  background-color: white;
  border: 2px solid gray;
  font-weight: bolder;
  margin-top: 10px;
  padding: 10px;
  transition: all 0.3s ease;
}

.googlebox:hover {
  background-color: #f9f9f9;
  border-color: #555;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.googlebox:active {
  background-color: #eaeaea;
  border-color: #333;
  transform: scale(0.98);
}

.newin {
  color: black;
  background: linear-gradient(135deg, #fdfdff, #e3eefa);
  border: 2px solid black;
  font-weight: bolder;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  outline: none;
  border-color: #a8a8a8;
}

.newin:focus {
  outline: none;
  border-color: #a8a8a8;
  box-shadow: 0 0 8px rgba(172, 172, 172, 0.5);
}

.newin:hover {
  border-color: #333;
  background-color: #fafafa;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.register-button {
  width: 100px;
  height: 30px;
  text-align: center;
  background-color: white;
  border: 2px solid gray;
  border-radius: 5px;
  margin: auto;
  display: block;
  margin-top: 10px;
  font-weight: bolder;
  transition: all 0.3s ease;
}

.register-button:hover {
  background-color: #f5f5f5;
  border-color: #555;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.register-button:active {
  background-color: #e5e5e5;
  border-color: #333;
  transform: scale(0.98);
}


@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px); /* 아래에서 위로 */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
