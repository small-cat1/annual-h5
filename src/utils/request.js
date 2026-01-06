// Axios 封装
import router from "@/router";
import axios from "axios";
import { closeToast, showLoadingToast, showToast } from "vant";
import { clearAuth, getToken } from "./auth";

// 创建 axios 实例
const service = axios.create({
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求计数器
let requestCount = 0;

// 显示加载
function showLoading() {
  if (requestCount === 0) {
    showLoadingToast({
      message: "加载中...",
      forbidClick: true,
      duration: 0,
    });
  }
  requestCount++;
}

// 隐藏加载
function hideLoading() {
  requestCount--;
  if (requestCount <= 0) {
    requestCount = 0;
    closeToast();
  }
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 显示加载（除非明确指定不显示）
    if (config.showLoading !== false) {
      showLoading();
    }

    // 添加 Token
    const token = getToken();
    if (token) {
      config.headers["x-token"] = token;
    }

    return config;
  },
  (error) => {
    hideLoading();
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    hideLoading();

    const res = response.data;

    // 根据后端返回的 code 判断
    if (res.code !== 0) {
      // Token 过期或无效（仅 401 跳转登录）
      if (res.code === 401) {
        clearAuth();
        router.replace("/auth/login");
        return Promise.reject(new Error("登录已过期，请重新登录"));
      }

      // 显示错误消息
      if (response.config.showError !== false) {
        showToast({
          message: res.msg || "请求失败",
          type: "fail",
        });
      }

      return Promise.reject(new Error(res.msg || "Error"));
    }

    return res;
  },
  (error) => {
    hideLoading();

    let message = "网络错误，请稍后重试";

    if (error.response) {
      switch (error.response.status) {
        case 401:
          message = "登录已过期";
          clearAuth();
          router.replace("/auth/login");
          break;
        case 403:
          message = "没有权限";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 500:
          message = "服务器错误";
          break;
        default:
          message = error.response.data?.msg || "请求失败";
      }
    } else if (error.code === "ECONNABORTED") {
      message = "请求超时";
    }

    showToast({
      message,
      type: "fail",
    });

    return Promise.reject(error);
  }
);

// 封装请求方法
export function get(url, params, config = {}) {
  return service.get(url, { params, ...config });
}

export function post(url, data, config = {}) {
  return service.post(url, data, config);
}

export function put(url, data, config = {}) {
  return service.put(url, data, config);
}

export function del(url, data, config = {}) {
  return service.delete(url, { data, ...config });
}

export default service;
