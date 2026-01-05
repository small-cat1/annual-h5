<template>
  <router-view v-if="initialized" />
  <div v-else class="app-loading">
    <van-loading type="spinner" color="#ff5722" size="36" />
  </div>
</template>

<script setup>
import { useActivityStore, useUserStore } from "@/store";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const activityStore = useActivityStore();
const userStore = useUserStore();

const initialized = ref(false);

onMounted(async () => {
  // 从路由或本地存储获取活动ID
  const activityId = route.query.activityId;
  await activityStore.init(activityId);

  // 如果已登录，刷新用户信息
  if (userStore.isLoggedIn) {
    await userStore.fetchUserInfo();
  }

  initialized.value = true;
});
</script>

<style>
.app-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
