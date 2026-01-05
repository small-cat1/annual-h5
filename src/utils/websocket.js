class WebSocketClient {
  constructor(options = {}) {
    this.ws = null;
    this.url = "";
    this.reconnectCount = 0;
    this.maxReconnect = options.maxReconnect ?? 5;
    this.reconnectInterval = options.reconnectInterval ?? 3000;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.isConnected = false;
    this.autoReconnect = options.autoReconnect ?? true;

    // 连接参数（如 token、activityId 等）
    this.params = {};
  }

  /**
   * 连接 WebSocket
   * @param {string} url 连接地址
   * @param {object} params 连接参数（会拼接到 URL）
   */
  connect(url, params = {}) {
    if (this.isConnecting || this.isConnected) {
      console.log("WebSocket 已连接或正在连接中");
      return;
    }

    this.url = url;
    this.params = params;
    this.isConnecting = true;

    // 构建完整 URL
    const fullUrl = this._buildUrl(url, params);
    console.log("WebSocket 连接:", fullUrl);

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log("WebSocket 连接成功");
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectCount = 0;
        this.startHeartbeat();
        this.emit("open");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error("消息解析失败:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket 错误:", error);
        this.isConnecting = false;
        this.emit("error", error);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket 连接关闭:", event.code, event.reason);
        this.isConnecting = false;
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit("close", event);

        // 非正常关闭时尝试重连
        if (this.autoReconnect && event.code !== 1000 && event.code !== 1001) {
          this.reconnect();
        }
      };
    } catch (e) {
      console.error("WebSocket 创建失败:", e);
      this.isConnecting = false;
      if (this.autoReconnect) {
        this.reconnect();
      }
    }
  }

  /**
   * 构建完整的 WebSocket URL
   */
  _buildUrl(url, params) {
    const urlParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        urlParams.append(key, value);
      }
    });

    const queryString = urlParams.toString();
    if (!queryString) return url;

    return url.includes("?")
      ? `${url}&${queryString}`
      : `${url}?${queryString}`;
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    const { type, payload } = data;

    // 心跳响应
    if (type === "pong") {
      return;
    }

    // 连接成功消息
    if (type === "connected") {
      console.log("WebSocket 服务端确认连接:", payload);
      this.emit("connected", payload);
      return;
    }

    // 错误消息
    if (type === "error") {
      console.error("WebSocket 服务端错误:", payload);
      this.emit("error", payload);
      return;
    }

    // 触发对应事件
    this.emit(type, payload);
    this.emit("message", data);
  }

  /**
   * 发送消息
   */
  send(type, payload = {}) {
    if (!this.isConnected || !this.ws) {
      console.warn("WebSocket 未连接");
      return false;
    }

    try {
      const message = JSON.stringify({ type, payload });
      this.ws.send(message);
      return true;
    } catch (e) {
      console.error("发送消息失败:", e);
      return false;
    }
  }

  /**
   * 加入房间
   */
  joinRoom(roomId) {
    return this.send("join_room", { roomId });
  }

  /**
   * 离开房间
   */
  leaveRoom(roomId) {
    return this.send("leave_room", { roomId });
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send("ping");
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 重连
   */
  reconnect() {
    if (this.reconnectCount >= this.maxReconnect) {
      console.log("WebSocket 重连次数已达上限");
      this.emit("reconnect_failed");
      return;
    }

    if (this.reconnectTimer) {
      return;
    }

    this.reconnectCount++;
    console.log(
      `WebSocket 将在 ${this.reconnectInterval}ms 后重连，第 ${this.reconnectCount} 次`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(this.url, this.params);
    }, this.reconnectInterval);
  }

  /**
   * 关闭连接
   */
  close() {
    this.autoReconnect = false;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Normal closure");
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.listeners.clear();
  }

  /**
   * 添加事件监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 移除事件监听
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error("事件处理错误:", e);
      }
    });
  }

  /**
   * 获取连接状态
   */
  get status() {
    if (this.isConnected) return "connected";
    if (this.isConnecting) return "connecting";
    return "disconnected";
  }
}

/**
 * 创建 WebSocket 客户端实例
 */
export function createWebSocket(options = {}) {
  return new WebSocketClient(options);
}

/**
 * 默认导出单例（向后兼容）
 */
export default new WebSocketClient();
