// WebSocket 封装
import { getToken } from './auth'

class WebSocketClient {
  constructor() {
    this.ws = null
    this.url = ''
    this.reconnectCount = 0
    this.maxReconnect = 5
    this.reconnectInterval = 3000
    this.heartbeatInterval = 30000
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.listeners = new Map()
    this.isConnecting = false
    this.isConnected = false
  }

  /**
   * 连接 WebSocket
   * @param {string} url 连接地址
   */
  connect(url) {
    if (this.isConnecting || this.isConnected) {
      return
    }

    this.url = url
    this.isConnecting = true

    // 添加 Token 到 URL
    const token = getToken()
    const separator = url.includes('?') ? '&' : '?'
    const fullUrl = token ? `${url}${separator}token=${token}` : url

    try {
      this.ws = new WebSocket(fullUrl)

      this.ws.onopen = () => {
        console.log('WebSocket 连接成功')
        this.isConnecting = false
        this.isConnected = true
        this.reconnectCount = 0
        this.startHeartbeat()
        this.emit('open')
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (e) {
          console.error('消息解析失败:', e)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        this.isConnecting = false
        this.emit('error', error)
      }

      this.ws.onclose = (event) => {
        console.log('WebSocket 连接关闭:', event.code, event.reason)
        this.isConnecting = false
        this.isConnected = false
        this.stopHeartbeat()
        this.emit('close', event)
        
        // 非正常关闭时尝试重连
        if (event.code !== 1000 && event.code !== 1001) {
          this.reconnect()
        }
      }
    } catch (e) {
      console.error('WebSocket 创建失败:', e)
      this.isConnecting = false
      this.reconnect()
    }
  }

  /**
   * 处理接收到的消息
   * @param {object} data 消息数据
   */
  handleMessage(data) {
    const { type, payload } = data

    // 心跳响应
    if (type === 'pong') {
      return
    }

    // 触发对应事件
    this.emit(type, payload)
    this.emit('message', data)
  }

  /**
   * 发送消息
   * @param {string} type 消息类型
   * @param {any} payload 消息内容
   */
  send(type, payload = {}) {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket 未连接')
      return false
    }

    try {
      const message = JSON.stringify({ type, payload })
      this.ws.send(message)
      return true
    } catch (e) {
      console.error('发送消息失败:', e)
      return false
    }
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send('ping')
    }, this.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 重连
   */
  reconnect() {
    if (this.reconnectCount >= this.maxReconnect) {
      console.log('WebSocket 重连次数已达上限')
      this.emit('reconnect_failed')
      return
    }

    if (this.reconnectTimer) {
      return
    }

    this.reconnectCount++
    console.log(`WebSocket 将在 ${this.reconnectInterval}ms 后重连，第 ${this.reconnectCount} 次`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect(this.url)
    }, this.reconnectInterval)
  }

  /**
   * 关闭连接
   */
  close() {
    this.stopHeartbeat()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }

    this.isConnected = false
    this.isConnecting = false
  }

  /**
   * 添加事件监听
   * @param {string} event 事件名
   * @param {function} callback 回调函数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听
   * @param {string} event 事件名
   * @param {function} callback 回调函数
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return

    if (callback) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    } else {
      this.listeners.delete(event)
    }
  }

  /**
   * 触发事件
   * @param {string} event 事件名
   * @param {any} data 数据
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return

    this.listeners.get(event).forEach(callback => {
      try {
        callback(data)
      } catch (e) {
        console.error('事件处理错误:', e)
      }
    })
  }
}

// 导出单例
export default new WebSocketClient()
