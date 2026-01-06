<template>
  <router-view />
</template>

<script setup>
import { useActivityStore } from "@/store/modules/activity";
import { useUserStore } from "@/store/modules/user";
import { useWebSocketStore } from "@/store/modules/websocket";
import { onMounted, watch } from "vue";

const userStore = useUserStore();
const activityStore = useActivityStore();
const wsStore = useWebSocketStore();
// 游戏调度中心
const gameDispatcher = useGameDispatcher();
// 自动连接 WebSocket
// ⭐ 应用启动时，确保活动数据已初始化
onMounted(async () => {
  // 如果有 activityId 但没有 config，需要初始化
  if (activityStore.activityId && !activityStore.config) {
    await activityStore.init(activityStore.activityId);
  }
});
// 同时监听登录状态和活动ID，两者都满足时连接
watch(
  [() => userStore.isLoggedIn, () => activityStore.activityId],
  ([loggedIn, activityId]) => {
    if (loggedIn && activityId && !wsStore.isConnected) {
      wsStore.connect(activityId);
    }

  },
  { immediate: true } // 关键：立即执行一次
);
</script>

<style>
/* 全局样式可以放这里，或者放在 assets/styles/index.scss */
</style>
