// 活动状态管理
import { defineStore } from 'pinia'
import { getCurrentActivity, getActivityDetail } from '@/api/activity'

export const useActivityStore = defineStore('activity', {
  state: () => ({
    currentActivity: null,
    isLoading: false,
    lastFetchTime: 0
  }),

  getters: {
    // 活动ID
    activityId: (state) => state.currentActivity?.ID,
    
    // 活动标题
    activityTitle: (state) => state.currentActivity?.title || '年会互动',
    
    // 活动状态 0未开始 1进行中 2已结束
    activityStatus: (state) => state.currentActivity?.status ?? 0,
    
    // 是否开启签到
    checkInEnabled: (state) => state.currentActivity?.checkInEnabled === 1,
    
    // 是否开启弹幕
    danmakuEnabled: (state) => state.currentActivity?.danmakuEnabled === 1,
    
    // 弹幕是否需要审核
    danmakuAudit: (state) => state.currentActivity?.danmakuAudit === 1,
    
    // 是否正在进行中
    isOngoing: (state) => state.currentActivity?.status === 1,
    
    // 活动开始时间
    startTime: (state) => state.currentActivity?.startTime,
    
    // 活动结束时间
    endTime: (state) => state.currentActivity?.endTime
  },

  actions: {
    /**
     * 获取当前活动
     */
    async fetchCurrentActivity(force = false) {
      // 缓存5分钟
      const cacheTime = 5 * 60 * 1000
      if (!force && this.currentActivity && Date.now() - this.lastFetchTime < cacheTime) {
        return this.currentActivity
      }

      this.isLoading = true
      try {
        const res = await getCurrentActivity()
        this.currentActivity = res.data
        this.lastFetchTime = Date.now()
        return res.data
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 获取活动详情
     */
    async fetchActivityDetail(id) {
      this.isLoading = true
      try {
        const res = await getActivityDetail(id)
        this.currentActivity = res.data
        this.lastFetchTime = Date.now()
        return res.data
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 更新活动信息
     */
    updateActivity(data) {
      this.currentActivity = { ...this.currentActivity, ...data }
    },

    /**
     * 清除活动信息
     */
    clearActivity() {
      this.currentActivity = null
      this.lastFetchTime = 0
    }
  }
})
