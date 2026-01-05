<template>
  <router-view />
</template>

<script setup>
import { useActivityStore } from "@/store/modules/activity";
import { useUserStore } from "@/store/modules/user";
import { useWebSocketStore } from "@/store/modules/websocket";
import { watch } from "vue";

const userStore = useUserStore();
const activityStore = useActivityStore();
const wsStore = useWebSocketStore();

// 登录成功后自动连接 WebSocket
watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn && activityStore.activityId) {
      wsStore.connect(activityStore.activityId);
    }
  }
);
</script>

<style>
/* 全局样式可以放这里，或者放在 assets/styles/index.scss */
</style>
