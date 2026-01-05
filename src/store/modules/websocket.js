/**
 * WebSocket 全局状态管理（用户端版本）
 * 管理 WebSocket 连接生命周期
 */
import { getToken } from "@/utils/auth";
import { createWebSocket } from "@/utils/websocket";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useWebSocketStore = defineStore("websocket", () => {
  // WebSocket 实例
  const ws = createWebSocket({
    maxReconnect: 10,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
  });

  // 状态
  const status = ref("disconnected"); // disconnected | connecting | connected
  const lastMessage = ref(null);
  const error = ref(null);

  // 计算属性
  const isConnected = computed(() => status.value === "connected");
  const isConnecting = computed(() => status.value === "connecting");

  /**
   * 连接到 WebSocket 服务器（用户端）
   * @param {string} activityId - 活动ID
   */
  function connect(activityId) {
    if (!activityId) {
      console.error("WebSocket 连接需要 activityId");
      return;
    }

    const token = getToken();
    if (!token) {
      console.error("WebSocket 连接需要 token");
      return;
    }

    // 构建 WebSocket URL
    const wsBase = import.meta.env.VITE_APP_WS_URL || "ws://localhost:9001/ws";
    const wsUrl = `${wsBase}/h5`;

    status.value = "connecting";
    error.value = null;

    // 设置事件监听
    ws.on("open", () => {
      status.value = "connected";
      console.log("WebSocket Store: 连接成功");
    });

    ws.on("close", () => {
      status.value = "disconnected";
      console.log("WebSocket Store: 连接关闭");
    });

    ws.on("error", (err) => {
      error.value = err;
      console.error("WebSocket Store: 错误", err);
    });

    ws.on("message", (data) => {
      lastMessage.value = data;
    });

    ws.on("reconnect_failed", () => {
      status.value = "disconnected";
      error.value = { message: "重连失败" };
    });

    // 连接
    ws.connect(wsUrl, { token, activityId });
  }

  /**
   * 断开连接
   */
  function disconnect() {
    ws.close();
    status.value = "disconnected";
  }

  /**
   * 发送消息
   */
  function send(type, payload) {
    return ws.send(type, payload);
  }

  /**
   * 订阅消息
   * @returns {Function} 取消订阅函数
   */
  function subscribe(event, callback) {
    return ws.on(event, callback);
  }

  /**
   * 取消订阅
   */
  function unsubscribe(event, callback) {
    ws.off(event, callback);
  }

  return {
    // 状态
    status,
    isConnected,
    isConnecting,
    lastMessage,
    error,

    // 方法
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,

    // 原始实例（高级用法）
    ws,
  };
});
