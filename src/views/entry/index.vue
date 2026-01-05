<template>
  <div class="entry-page">
    <van-loading type="spinner" color="#ff5722" size="48" />
    <p>正在进入活动...</p>
  </div>
</template>

<script setup>
import { Loading as VanLoading } from "vant";
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

onMounted(async () => {
  await router.isReady();

  // 从 URL 获取 activityId（多种方式兼容）
  let activityId = route.query.activityId;

  // 兜底：直接从 URL 解析
  if (!activityId) {
    const params = new URLSearchParams(window.location.search);
    activityId = params.get("activityId");
  }

  console.log("Entry 页面获取到 activityId:", activityId);

  if (activityId) {
    // 存储到 localStorage
    localStorage.setItem("activityId", activityId);
    console.log("activityId 已存储到 localStorage");
  } else {
    console.warn("未获取到 activityId");
  }

  // 跳转到首页
  router.replace("/");
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
