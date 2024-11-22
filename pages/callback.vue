<template>
    <div v-if="message">{{ message }}</div>
  </template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const message = ref('');
const email = ref('');

onMounted(async () => {
  const route = router.currentRoute.value;
  const code = route.query.code;
  if (!code) {
    message.value = 'OAuth 인증 코드가 없습니다.';
    return;
  }

  try {
    // 서버로 OAuth 인증 코드 전송
    const response = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'oauth', code }),
    });

    const result = await response.json();
    if (result.status === 'success') {
      email.value = result.email;
      message.value = 'OAuth 인증 성공';
      router.push({ path: '/', query: { accountVerified: true, email: email.value } });
    } else {
      message.value = `OAuth 인증 실패: ${result.message}`;
    }
  } catch (error) {
    console.error('OAuth 인증 실패:', error);
    message.value = 'OAuth 인증 중 오류가 발생했습니다.';
  }
});
</script>
