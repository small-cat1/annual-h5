// 用户状态管理
import { defineStore } from 'pinia'
import { getUserInfo, checkIn as checkInApi } from '@/api/user'
import { wechatLogin } from '@/api/auth'
import { getToken, setToken, setUser, getUser, clearAuth } from '@/utils/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken() || '',
    userInfo: getUser() || null,
    isLoading: false
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.token,
    
    // 签到信息
    checkInInfo: (state) => state.userInfo?.checkIn || null,
    
    // 是否已签到当前活动
    isCheckedIn: (state) => state.userInfo?.checkIn?.isCheckedIn === true,
    
    // 审核状态 0待审核 1已通过 2已拒绝
    auditStatus: (state) => state.userInfo?.checkIn?.status ?? -1,
    
    // 是否可以参与活动（签到 + 审核通过）
    canJoinActivity: (state) => {
      const checkIn = state.userInfo?.checkIn
      return checkIn?.isCheckedIn === true && checkIn?.status === 1
    },
    
    // 用户ID
    userId: (state) => state.userInfo?.ID,
    
    // 用户昵称
    nickname: (state) => state.userInfo?.nickname || '游客',
    
    // 用户头像
    avatar: (state) => state.userInfo?.avatar || ''
  },

  actions: {
    // 微信登录
    async wechatLogin(code,activityId) {
      this.isLoading = true
      try {
        const res = await wechatLogin({ code, activityId  })
        const { token, user } = res.data
        
        this.token = token
        this.userInfo = user
        
        setToken(token)
        setUser(user)
        
        return res.data
      } finally {
        this.isLoading = false
      }
    },

    // 获取用户信息（需要传入活动ID获取签到状态）
    async fetchUserInfo(activityId) {
      if (!this.token) return null
      
      try {
        const res = await getUserInfo(activityId)
        this.userInfo = res.data
        setUser(res.data)
        return res.data
      } catch (e) {
        return null
      }
    },

    // 签到
    async checkIn(data) {
      const res = await checkInApi(data)
      this.userInfo = res.data
      setUser(res.data)
      return res.data
    },

    // 退出登录
    logout() {
      this.token = ''
      this.userInfo = null
      clearAuth()
    }
  }
})