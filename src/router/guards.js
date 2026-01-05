// 路由守卫
import { useUserStore } from '@/store/modules/user'
import { isWechat, redirectToAuth } from '@/utils/wechat'

/**
 * 设置路由守卫
 * @param {Router} router 路由实例
 */
export function setupRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
      document.title = to.meta.title + ' - 年会互动'
    }

    const userStore = useUserStore()
    const { isLoggedIn, isRegistered, auditStatus } = userStore

    // 不需要登录的页面
    if (to.meta.requiresAuth === false) {
      next()
      return
    }

    // 需要登录但未登录
    if (!isLoggedIn) {
      // 微信环境跳转授权
      if (isWechat()) {
        const redirectUri = window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(to.fullPath)
        redirectToAuth(redirectUri)
        return
      }
      // 非微信环境跳转登录页
      next({ path: '/auth/login', query: { redirect: to.fullPath } })
      return
    }

    // 需要报名但未报名
    if (to.meta.requiresRegistered && !isRegistered) {
      // 待审核状态
      if (auditStatus === 0 && userStore.userInfo?.realName) {
        next({ path: '/register/status' })
        return
      }
      // 未报名或被拒绝
      next({ path: '/register' })
      return
    }

    next()
  })

  router.afterEach(() => {
    // 页面跳转后滚动到顶部
    window.scrollTo(0, 0)
  })
}
