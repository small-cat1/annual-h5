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
  // 获取微信返回的 code
  const code = getCodeFromUrl();

  if (!code) {
    showToast("授权失败，请重试");
    router.replace("/auth/login");
    return;
  }

  try {
    statusText.value = "正在登录...";

    // 调用后端接口换取用户信息
    const result = await userStore.wechatLogin(code);

    statusText.value = "登录成功";

    // 获取重定向地址
    const redirect = route.query.redirect || "/";

    // 根据用户状态跳转
    const user = result.user;
    if (user.isRegistered !== 1) {
      if (user.status === 0 && user.realName) {
        // 待审核
        router.replace("/register/status");
      } else {
        // 未报名
        router.replace("/register");
      }
    } else {
      // 已报名，跳转目标页
      router.replace(decodeURIComponent(redirect));
    }
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
