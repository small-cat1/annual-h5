<template>
  <router-view />
</template>

<script setup>
import { useActivityStore } from "@/store/modules/activity";
import { useUserStore } from "@/store/modules/user";
import { useWebSocketStore } from "@/store/modules/websocket";
import { useGameDispatcher } from "@/composables/useGameDispatcher";
import { watch } from "vue";

const userStore = useUserStore();
const activityStore = useActivityStore();
const wsStore = useWebSocketStore();
// 游戏调度中心
const gameDispatcher = useGameDispatcher();
// 自动连接 WebSocket
// 同时监听登录状态和活动ID，两者都满足时连接
watch(
  [() => userStore.isLoggedIn, () => activityStore.activityId],
  ([loggedIn, activityId]) => {
    if (loggedIn && activityId && !wsStore.isConnected) {
      wsStore.connect(activityId);
    }

     // 启动游戏调度中心（需要登录 + 活动ID）
    if (loggedIn && activityId) {
      gameDispatcher.start();
    }
  },
  { immediate: true } // 关键：立即执行一次
);
</script>

<style>
/* 全局样式可以放这里，或者放在 assets/styles/index.scss */
</style>
