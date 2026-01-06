// 路由守卫
import { useUserStore } from "@/store/modules/user";
import { isWechat, redirectToAuth } from "@/utils/wechat";

export function setupRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
      document.title = to.meta.title + " - 年会互动";
    }

    const userStore = useUserStore();

    // 不需要登录的页面直接放行
    if (to.meta.requiresAuth === false) {
      next();
      return;
    }

    // 需要登录但未登录
    if (!userStore.isLoggedIn) {
      if (isWechat()) {
        // 微信环境：跳转授权，回调后跳转到目标路径（不带 query 参数）
        const redirectUri =
          window.location.origin +
          "/auth/callback?redirect=" +
          encodeURIComponent(to.path);
        redirectToAuth(redirectUri);
        return;
      }
      // 非微信环境：跳转登录页
      next({ path: "/auth/login", query: { redirect: to.path } });
      return;
    }

    // ========== 新增：每次路由切换都刷新用户信息 ==========
    if (activityStore.activityId) {
      try {
        await userStore.fetchUserInfo(activityStore.activityId);
      } catch (e) {
        // token 失效，清除登录状态，重新授权
        if (e?.response?.status === 401) {
          userStore.logout();
          if (isWechat()) {
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
      }
    }
    // 已登录，直接放行
    next();
  });

  router.afterEach(() => {
    window.scrollTo(0, 0);
  });
}
