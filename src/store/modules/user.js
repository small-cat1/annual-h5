// 用户状态管理
import { wechatLogin } from "@/api/auth";
import { getUserInfo, register as registerApi } from "@/api/user";
import { clearAuth, getToken, getUser, setToken, setUser } from "@/utils/auth";
import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: getToken() || "",
    userInfo: getUser() || null,
    isLoading: false,
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.token,

    // 是否已报名
    isRegistered: (state) => state.userInfo?.isRegistered === 1,

    // 审核状态 0待审核 1已通过 2已拒绝
    auditStatus: (state) => state.userInfo?.status ?? 0,

    // 用户ID
    userId: (state) => state.userInfo?.ID,

    // 用户昵称
    nickname: (state) => state.userInfo?.nickname || "游客",

    // 用户头像
    avatar: (state) => state.userInfo?.avatar || "",
  },

  actions: {
    /**
     * 微信登录
     */
    async wechatLogin(code) {
      this.isLoading = true;
      try {
        const res = await wechatLogin({ code });
        console.log("=== 登录响应 ===");
        console.log("res:", res);
        console.log("res.data:", res.data);

        const { token, user } = res.data;

        console.log("token:", token);
        console.log("user:", user);

        this.token = token;
        this.userInfo = user;

        setToken(token);
        setUser(user);

        return res.data;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * 获取用户信息
     */
    async fetchUserInfo() {
      if (!this.token) return null;

      try {
        const res = await getUserInfo();
        this.userInfo = res.data;
        setUser(res.data);
        return res.data;
      } catch (e) {
        return null;
      }
    },

    /**
     * 用户报名
     */
    async register(data) {
      const res = await registerApi(data);
      this.userInfo = res.data;
      setUser(res.data);
      return res.data;
    },

    /**
     * 更新用户信息
     */
    updateUserInfo(data) {
      this.userInfo = { ...this.userInfo, ...data };
      setUser(this.userInfo);
    },

    /**
     * 退出登录
     */
    logout() {
      this.token = "";
      this.userInfo = null;
      clearAuth();
    },
  },
});
