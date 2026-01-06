// 路由表
export const routes = [
  // ========== 活动入口 ==========
  {
    path: "/entry",
    name: "Entry",
    component: () => import("@/views/entry/index.vue"),
    meta: { title: "进入活动", requiresAuth: false },
  },

  // ========== 授权相关 ==========
  {
    path: "/auth/login",
    name: "Login",
    component: () => import("@/views/auth/Login.vue"),
    meta: { title: "登录", requiresAuth: false },
  },
  {
    path: "/auth/callback",
    name: "AuthCallback",
    component: () => import("@/views/auth/Callback.vue"),
    meta: { title: "授权中", requiresAuth: false },
  },

  // ========== 主要功能 ==========
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/home/Index.vue"),
    meta: { title: "首页", requiresAuth: true },
  },
  {
    path: "/checkIn",
    name: "CheckIn",
    component: () => import("@/views/checkIn/Index.vue"),
    meta: { title: "签到", requiresAuth: true },
  },
  {
    path: "/checkIn/status",
    name: "CheckInStatus",
    component: () => import("@/views/checkIn/Status.vue"),
    meta: { title: "审核状态", requiresAuth: true },
  },
  {
    path: "/danmaku",
    name: "Danmaku",
    component: () => import("@/views/danmaku/Index.vue"),
    meta: { title: "弹幕互动", requiresAuth: true },
  },
  {
    path: "/shake",
    name: "Shake",
    component: () => import("@/views/shake/Index.vue"),
    meta: { title: "摇一摇", requiresAuth: true },
  },
  {
    path: "/shake/result",
    name: "ShakeResult",
    component: () => import("@/views/shake/Result.vue"),
    meta: { title: "游戏结果", requiresAuth: true },
  },
  {
    path: "/prize",
    name: "PrizeList",
    component: () => import("@/views/prize/List.vue"),
    meta: { title: "我的奖品", requiresAuth: true },
  },
  {
    path: "/prize/:id",
    name: "PrizeDetail",
    component: () => import("@/views/prize/Detail.vue"),
    meta: { title: "奖品详情", requiresAuth: true },
  },
  // ========== 错误页面 ==========
  {
    path: "/404",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
    meta: { title: "页面不存在", requiresAuth: false },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/404",
  },
];
