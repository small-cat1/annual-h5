// 路由表
export const routes = [
  // ========== 授权相关 ==========
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/views/auth/Callback.vue'),
    meta: { title: '授权中', requiresAuth: false }
  },

  // ========== 报名相关 ==========
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/Index.vue'),
    meta: { title: '报名', requiresAuth: true }
  },
  {
    path: '/register/status',
    name: 'RegisterStatus',
    component: () => import('@/views/register/Status.vue'),
    meta: { title: '审核状态', requiresAuth: true }
  },

  // ========== 主要功能 ==========
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/Index.vue'),
    meta: { title: '首页', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/checkin',
    name: 'CheckIn',
    component: () => import('@/views/checkin/Index.vue'),
    meta: { title: '签到', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/danmaku',
    name: 'Danmaku',
    component: () => import('@/views/danmaku/Index.vue'),
    meta: { title: '弹幕互动', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/shake',
    name: 'Shake',
    component: () => import('@/views/shake/Index.vue'),
    meta: { title: '摇一摇', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/shake/playing',
    name: 'ShakePlaying',
    component: () => import('@/views/shake/Playing.vue'),
    meta: { title: '摇一摇', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/shake/result',
    name: 'ShakeResult',
    component: () => import('@/views/shake/Result.vue'),
    meta: { title: '游戏结果', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/prize',
    name: 'PrizeList',
    component: () => import('@/views/prize/List.vue'),
    meta: { title: '我的奖品', requiresAuth: true, requiresRegistered: true }
  },
  {
    path: '/prize/:id',
    name: 'PrizeDetail',
    component: () => import('@/views/prize/Detail.vue'),
    meta: { title: '奖品详情', requiresAuth: true, requiresRegistered: true }
  },

  // ========== 大屏页面(游客可看) ==========
  {
    path: '/screen',
    name: 'Screen',
    component: () => import('@/views/screen/Index.vue'),
    meta: { title: '互动大屏', requiresAuth: false }
  },
  {
    path: '/screen/checkin',
    name: 'ScreenCheckIn',
    component: () => import('@/views/screen/CheckIn.vue'),
    meta: { title: '签到墙', requiresAuth: false }
  },
  {
    path: '/screen/danmaku',
    name: 'ScreenDanmaku',
    component: () => import('@/views/screen/Danmaku.vue'),
    meta: { title: '弹幕墙', requiresAuth: false }
  },
  {
    path: '/screen/shake',
    name: 'ScreenShake',
    component: () => import('@/views/screen/Shake.vue'),
    meta: { title: '摇一摇排行', requiresAuth: false }
  },
  {
    path: '/screen/draw',
    name: 'ScreenDraw',
    component: () => import('@/views/screen/Draw.vue'),
    meta: { title: '抽奖大屏', requiresAuth: false }
  },

  // ========== 错误页面 ==========
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]
