// 授权 Hook
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { isWechat, redirectToAuth } from '@/utils/wechat'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()

  const isLoggedIn = computed(() => userStore.isLoggedIn)
  const isRegistered = computed(() => userStore.isRegistered)
  const auditStatus = computed(() => userStore.auditStatus)
  const userInfo = computed(() => userStore.userInfo)

  /**
   * 检查登录状态，未登录则跳转登录
   */
  const checkLogin = (redirectPath) => {
    if (!isLoggedIn.value) {
      if (isWechat()) {
        const redirectUri = window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirectPath || window.location.pathname)
        redirectToAuth(redirectUri)
      } else {
        router.push({
          path: '/auth/login',
          query: { redirect: redirectPath || window.location.pathname }
        })
      }
      return false
    }
    return true
  }

  /**
   * 检查报名状态，未报名则跳转报名
   */
  const checkRegistered = () => {
    if (!isRegistered.value) {
      if (auditStatus.value === 0 && userInfo.value?.realName) {
        router.push('/register/status')
      } else {
        router.push('/register')
      }
      return false
    }
    return true
  }

  /**
   * 检查权限（登录+报名）
   */
  const checkAuth = (redirectPath) => {
    if (!checkLogin(redirectPath)) return false
    if (!checkRegistered()) return false
    return true
  }

  /**
   * 退出登录
   */
  const logout = () => {
    userStore.logout()
    router.replace('/auth/login')
  }

  return {
    isLoggedIn,
    isRegistered,
    auditStatus,
    userInfo,
    checkLogin,
    checkRegistered,
    checkAuth,
    logout
  }
}
