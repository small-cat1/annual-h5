import { getActivityDetail } from "@/api/console/activity";
import { defineStore } from "pinia";

export const useActivityStore = defineStore("activity", {
  state: () => ({
    // 活动ID
    activityId: null,

    // 活动配置信息
    config: {
      title: "",
      logo: "",
      cover: "",
      checkInEnabled: true,
      danmakuEnabled: true,
      danmakuAudit: false,
      danmakuDrawEnabled: false, // 弹幕抽奖开关
      winnerExclude: false,
    },

    // 配置是否已加载
    configLoaded: false,

    // 加载失败
    loadError: false,
  }),

  getters: {
    // 是否有有效的活动ID
    hasActivityId: (state) => !!state.activityId,

    // 是否可以开始业务（有ID且配置已加载）
    isReady: (state) =>
      !!state.activityId && state.configLoaded && !state.loadError,
  },

  actions: {
    // 设置活动ID
    setActivityId(id) {
      if (id) {
        this.activityId = Number(id);
        // 持久化到localStorage
        localStorage.setItem("annual_activity_id", id);
      }
    },

    // 从本地恢复活动ID
    restoreActivityId() {
      const savedId = localStorage.getItem("annual_activity_id");
      if (savedId) {
        this.activityId = Number(savedId);
      }
      return this.activityId;
    },

    // 加载活动配置
    async loadConfig() {
      if (!this.activityId) {
        this.loadError = true;
        return false;
      }

      try {
        const res = await getActivityDetail(this.activityId);
        if (res.code === 0 && res.data) {
          this.config = {
            title: res.data.title || "",
            logo: res.data.logo || "",
            cover: res.data.cover || "",
            checkInEnabled: res.data.checkInEnabled !== 0,
            danmakuEnabled: res.data.danmakuEnabled !== 0,
            danmakuAudit: res.data.danmakuAudit === 1,
            danmakuDrawEnabled: res.data.danmakuDrawEnabled === 1,
            winnerExclude: res.data.winnerExclude === 1,
          };
          this.configLoaded = true;
          this.loadError = false;
          return true;
        } else {
          this.loadError = true;
          return false;
        }
      } catch (e) {
        console.error("加载活动配置失败", e);
        this.loadError = true;
        return false;
      }
    },

    // 初始化（恢复ID + 加载配置）
    async init(routeActivityId) {
      // 优先使用路由参数
      if (routeActivityId) {
        this.setActivityId(routeActivityId);
      } else {
        // 尝试从本地恢复
        this.restoreActivityId();
      }

      // 没有活动ID，直接返回失败
      if (!this.activityId) {
        this.loadError = true;
        return false;
      }

      // 如果配置已加载，不重复请求
      if (this.configLoaded) {
        return true;
      }

      // 加载配置
      return await this.loadConfig();
    },

    // 重置
    reset() {
      this.activityId = null;
      this.config = {
        title: "",
        logo: "",
        cover: "",
        checkInEnabled: true,
        danmakuEnabled: true,
        danmakuAudit: false,
        danmakuDrawEnabled: false,
        winnerExclude: false,
      };
      this.configLoaded = false;
      this.loadError = false;
      localStorage.removeItem("annual_activity_id");
    },
  },
});
