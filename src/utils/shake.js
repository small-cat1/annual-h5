// 摇一摇检测工具

class ShakeDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 15  // 加速度阈值
    this.timeout = options.timeout || 300     // 两次摇动间隔（毫秒）
    this.callback = options.onShake || (() => {})
    
    this.lastTime = 0
    this.lastX = 0
    this.lastY = 0
    this.lastZ = 0
    this.shakeCount = 0
    this.isListening = false
    this.hasPermission = false
    
    this.handleMotion = this.handleMotion.bind(this)
  }

  /**
   * 请求权限（iOS 13+需要）
   */
  async requestPermission() {
    // iOS 13+ 需要请求权限
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission()
        this.hasPermission = permission === 'granted'
        return this.hasPermission
      } catch (e) {
        console.error('请求设备运动权限失败:', e)
        return false
      }
    }
    
    // 其他设备默认有权限
    this.hasPermission = true
    return true
  }

  /**
   * 检查设备是否支持
   */
  isSupported() {
    return 'DeviceMotionEvent' in window
  }

  /**
   * 开始监听
   */
  async start() {
    if (this.isListening) return

    if (!this.isSupported()) {
      console.warn('设备不支持运动检测')
      return false
    }

    // 先请求权限
    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      console.warn('未获得设备运动权限')
      return false
    }

    this.isListening = true
    this.shakeCount = 0
    window.addEventListener('devicemotion', this.handleMotion, true)
    
    return true
  }

  /**
   * 停止监听
   */
  stop() {
    if (!this.isListening) return

    this.isListening = false
    window.removeEventListener('devicemotion', this.handleMotion, true)
  }

  /**
   * 处理设备运动事件
   */
  handleMotion(event) {
    const acceleration = event.accelerationIncludingGravity
    
    if (!acceleration) return

    const currentTime = Date.now()
    
    // 控制检测频率
    if ((currentTime - this.lastTime) < 100) return
    
    const diffTime = currentTime - this.lastTime
    this.lastTime = currentTime

    const x = acceleration.x || 0
    const y = acceleration.y || 0
    const z = acceleration.z || 0

    const diffX = Math.abs(x - this.lastX)
    const diffY = Math.abs(y - this.lastY)
    const diffZ = Math.abs(z - this.lastZ)

    // 计算速度
    const speed = (diffX + diffY + diffZ) / diffTime * 10000

    if (speed > this.threshold) {
      this.shakeCount++
      this.callback(this.shakeCount)
    }

    this.lastX = x
    this.lastY = y
    this.lastZ = z
  }

  /**
   * 获取摇动次数
   */
  getCount() {
    return this.shakeCount
  }

  /**
   * 重置计数
   */
  resetCount() {
    this.shakeCount = 0
  }

  /**
   * 设置回调
   */
  onShake(callback) {
    this.callback = callback
  }

  /**
   * 设置阈值
   */
  setThreshold(value) {
    this.threshold = value
  }
}

// 创建单例
let shakeDetector = null

/**
 * 获取摇一摇检测器实例
 */
export function getShakeDetector(options) {
  if (!shakeDetector) {
    shakeDetector = new ShakeDetector(options)
  }
  return shakeDetector
}

/**
 * 销毁实例
 */
export function destroyShakeDetector() {
  if (shakeDetector) {
    shakeDetector.stop()
    shakeDetector = null
  }
}

export default ShakeDetector
