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
  const code = getCodeFromUrl();

  if (!code) {
    showToast("授权失败，请重试");
    router.replace("/auth/login");
    return;
  }

  try {
    statusText.value = "正在登录...";
    await userStore.wechatLogin(code);
    statusText.value = "登录成功";

    // 获取重定向路径（只是路径，不带 activityId）
    let redirect = route.query.redirect || "/";
    if (redirect.includes("%")) {
      redirect = decodeURIComponent(redirect);
    }

    // 直接跳转，activityId 从 localStorage 获取
    router.replace(redirect);
  } catch (error) {
    console.error("登录失败:", error);
    showToast("登录失败，请重试");
    router.replace("/auth/login");
  }
});
</script>
