// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  components: true,

  nitro: {
    preset: 'node-server',
  },

  // 런타임 구성: 환경 변수 관리
  runtimeConfig: {
    public: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '', 
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '', 
    },
  },
});
