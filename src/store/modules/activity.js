import { getActivityDetail } from "@/api/activity";
import { defineStore } from "pinia";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    activityId: Number(localStorage.getItem("activityId")) || null,
    config: null,
    loadError: false,
    isReady: false,
  }),

  getters: {
    // 活动状态 0未开始 1进行中 2已结束
    activityStatus: (state) => {
      if (!state.config) return -1;
      return state.config.status ?? -1;
    },

    // 活动是否进行中
    isOngoing: (state) => {
      return state.config?.status === 1;
    },

    // 是否有活动ID
    hasActivityId: (state) => !!state.activityId,
  },

  actions: {
    async init(activityId) {
      // 重置状态
      this.loadError = false;
      this.isReady = false;

      if (!activityId) {
        this.activityId = null;
        this.config = null;
        return false;
      }

      this.activityId = Number(activityId);

      // 保存到本地
      localStorage.setItem("activityId", this.activityId);

      try {
        const res = await getActivityDetail(this.activityId);
        if (res.code === 0 && res.data) {
          this.config = res.data;
          this.isReady = true;
          return true;
        } else {
          this.loadError = true;
          return false;
        }
      } catch (e) {
        console.error("获取活动信息失败", e);
        this.loadError = true;
        return false;
      }
    },
    // ⭐ 新增：仅恢复 activityId（不请求详情）
    restoreFromStorage() {
      const stored = localStorage.getItem("activityId");
      if (stored) {
        this.activityId = Number(stored);
        return true;
      }
      return false;
    },
  },
});
