<template>
  <div class="entry-page">
    <van-loading type="spinner" color="#ff5722" size="48" />
    <p>正在进入活动...</p>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

onMounted(async () => {
  await router.isReady();
  
  // 从 URL 获取 activityId
  const activityId = route.query.activityId || new URLSearchParams(window.location.search).get('activityId');
  
  if (activityId) {
    // 存储到 localStorage
    localStorage.setItem('activityId', activityId);
    console.log('活动ID已更新:', activityId);
  }
  
  // 跳转到首页（不带参数）
  router.replace('/');
});
</script>

<style scoped>
.entry-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.entry-page p {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}
</style>