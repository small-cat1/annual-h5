// WebSocket Hook
import { ref, onMounted, onUnmounted } from 'vue'
import websocket from '@/utils/websocket'

export function useWebSocket(url, options = {}) {
  const { autoConnect = true, onMessage = null } = options

  const isConnected = ref(false)
  const error = ref(null)

  const connect = () => {
    websocket.connect(url)
  }

  const disconnect = () => {
    websocket.close()
  }

  const send = (type, payload) => {
    return websocket.send(type, payload)
  }

  const on = (event, callback) => {
    websocket.on(event, callback)
  }

  const off = (event, callback) => {
    websocket.off(event, callback)
  }

  // 监听连接状态
  const handleOpen = () => {
    isConnected.value = true
    error.value = null
  }

  const handleClose = () => {
    isConnected.value = false
  }

  const handleError = (err) => {
    error.value = err
  }

  const handleMessage = (data) => {
    onMessage?.(data)
  }

  onMounted(() => {
    websocket.on('open', handleOpen)
    websocket.on('close', handleClose)
    websocket.on('error', handleError)
    websocket.on('message', handleMessage)

    if (autoConnect) {
      connect()
    }
  })

  onUnmounted(() => {
    websocket.off('open', handleOpen)
    websocket.off('close', handleClose)
    websocket.off('error', handleError)
    websocket.off('message', handleMessage)
    disconnect()
  })

  return {
    isConnected,
    error,
    connect,
    disconnect,
    send,
    on,
    off
  }
}
