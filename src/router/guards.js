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
    const { isLoggedIn } = userStore;

    // 不需要登录的页面直接放行
    if (to.meta.requiresAuth === false) {
      next();
      return;
    }

    // 需要登录但未登录
    if (!isLoggedIn) {
      if (isWechat()) {
        const redirectUri =
          window.location.origin +
          "/auth/callback?redirect=" +
          encodeURIComponent(to.fullPath);
        redirectToAuth(redirectUri);
        return;
      }
      next({ path: "/auth/login", query: { redirect: to.fullPath } });
      return;
    }

    // 已登录，直接放行
    next();
  });

  router.afterEach(() => {
    window.scrollTo(0, 0);
  });
}
