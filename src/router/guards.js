import { useUserStore } from "@/store/modules/user";
import { isWechat, redirectToAuth } from "@/utils/wechat";

export function setupRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
      document.title = to.meta.title + " - 年会互动";
    }

    const userStore = useUserStore();

    // 不需要登录的页面
    if (to.meta.requiresAuth === false) {
      next();
      return;
    }

    // 需要登录但未登录
    if (!userStore.isLoggedIn) {
      if (isWechat()) {
        // 简化：回调后直接跳首页，activityId 已经在 localStorage 里了
        const redirectUri =
          window.location.origin +
          "/auth/callback?redirect=" +
          encodeURIComponent(to.path);
        redirectToAuth(redirectUri);
        return;
      }
      next({ path: "/auth/login", query: { redirect: to.path } });
      return;
    }

    next();
  });

  router.afterEach(() => {
    window.scrollTo(0, 0);
  });
}
