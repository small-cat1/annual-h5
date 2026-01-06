<template>
  <div class="callback-page">
    <div class="loading-box">
      <van-loading type="spinner" color="#ff5722" size="48" />
      <p class="loading-text">{{ statusText }}</p>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from "@/store/modules/user";
import { getCodeFromUrl } from "@/utils/wechat";
import { showToast } from "vant";
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const statusText = ref("正在授权中...");

onMounted(async () => {
  await router.isReady();

  const code = getCodeFromUrl();
  const activityId = localStorage.getItem("activityId");  // ← 添加这行

  if (!code) {
    showToast("授权失败，请重试");
    router.replace("/auth/login");
    return;
  }

  try {
    statusText.value = "正在登录...";
    await userStore.wechatLogin(code,activityId);
    statusText.value = "登录成功";

    // 获取重定向路径
    let redirect = route.query.redirect || "/";

    // 解码（如果需要）
    if (typeof redirect === "string" && redirect.includes("%")) {
      redirect = decodeURIComponent(redirect);
    }

    console.log("授权成功，跳转到:", redirect);

    // 使用 router.replace 跳转（activityId 从 localStorage 获取）
    router.replace(redirect);
  } catch (error) {
    console.error("登录失败:", error);
    showToast("登录失败，请重试");
    router.replace("/auth/login");
  }
});
</script>

<style lang="scss" scoped>
.callback-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-box {
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}
</style>
