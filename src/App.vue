<template>
  <!-- 加载中 -->
  <div v-if="loading" class="app-loading">
    <van-loading type="spinner" color="#ff5722" size="36" />
    <p>加载中...</p>
  </div>

  <!-- 无活动ID -->
  <div v-else-if="!activityStore.activityId" class="app-error">
    <div class="error-content">
      <van-icon name="warning-o" size="64" color="#ff9800" />
      <h2>未指定活动</h2>
      <p>请通过正确的链接访问</p>
    </div>
  </div>

  <!-- 活动加载失败 -->
  <div v-else-if="activityStore.loadError" class="app-error">
    <div class="error-content">
      <van-icon name="close" size="64" color="#f44336" />
      <h2>活动不存在</h2>
      <p>请检查链接是否正确</p>
      <van-button type="primary" round @click="retry">重试</van-button>
    </div>
  </div>

  <!-- 活动未开始 -->
  <div v-else-if="activityStore.activityStatus === 0" class="app-error">
    <div class="error-content">
      <van-icon name="clock-o" size="64" color="#2196f3" />
      <h2>活动未开始</h2>
      <p>{{ activityStore.config.title }}</p>
      <p class="sub-text">
        开始时间：{{ formatDate(activityStore.config.startTime) }}
      </p>
      <van-button type="primary" round @click="retry">刷新</van-button>
    </div>
  </div>

  <!-- 活动已结束 -->
  <div v-else-if="activityStore.activityStatus === 2" class="app-error">
    <div class="error-content">
      <van-icon name="passed" size="64" color="#9e9e9e" />
      <h2>活动已结束</h2>
      <p>{{ activityStore.config.title }}</p>
      <p class="sub-text">感谢您的参与！</p>
    </div>
  </div>

  <!-- 正常显示 -->
  <router-view v-else />
</template>

<script setup>
import { useActivityStore, useUserStore } from "@/store";
import { formatDate } from "@/utils/format";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const activityStore = useActivityStore();
const userStore = useUserStore();

const loading = ref(true);

const init = async () => {
  loading.value = true;
  // 从路由获取活动ID
  const activityId = route.query.activityId;

  // 初始化活动信息
  const success = await activityStore.init(activityId);

  // 如果活动正常且已登录，刷新用户信息（包含签到状态）
  if (success && activityStore.activityStatus === 1 && userStore.isLoggedIn) {
    await userStore.fetchUserInfo(activityStore.activityId);
  }

  loading.value = false;
};

const retry = () => {
  init();
};

onMounted(async () => {
  await router.isReady();
  // 此时 route.query 一定有值了
  const activityId = route.query.activityId || new URLSearchParams(window.location.search).get('activityId');
  
  if (!activityId) {
    loading.value = false;
    return;
  }
  init();
});
</script>

<style>
.app-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.app-loading p {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.app-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.error-content {
  text-align: center;
  background: #fff;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  width: 100%;
}

.error-content h2 {
  margin: 20px 0 12px;
  font-size: 20px;
  color: #333;
}

.error-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.error-content .sub-text {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.error-content .van-button {
  margin-top: 24px;
}
</style>
