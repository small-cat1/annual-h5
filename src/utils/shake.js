/**
 * 摇一摇检测器
 * 支持 iOS 13+ 权限请求
 */

let shakeInstance = null;

class ShakeDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 12; // 加速度阈值
    this.timeout = options.timeout || 300; // 两次摇动的最小间隔(ms)
    this.onShake = options.onShake || (() => {});
    this.onDebug = options.onDebug || (() => {}); // 调试回调

    this.shakeCount = 0;
    this.lastShakeTime = 0;
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
    this.isListening = false;

    this.handleMotion = this.handleMotion.bind(this);
  }

  // 检查是否支持 DeviceMotion
  isSupported() {
    return "DeviceMotionEvent" in window;
  }

  // 检查是否需要请求权限 (iOS 13+)
  needsPermission() {
    return (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    );
  }

  // 请求权限
  async requestPermission() {
    if (!this.needsPermission()) {
      this.onDebug("不需要请求权限 (非iOS或低版本)", "info");
      return "granted";
    }

    try {
      this.onDebug("正在请求 DeviceMotion 权限...", "info");
      const permission = await DeviceMotionEvent.requestPermission();
      this.onDebug(
        `权限请求结果: ${permission}`,
        permission === "granted" ? "success" : "error"
      );
      return permission;
    } catch (error) {
      this.onDebug(`权限请求失败: ${error.message}`, "error");
      throw error;
    }
  }

  // 启动监听
  async start(initialCount = 0) {
    if (!this.isSupported()) {
      const msg = "当前设备不支持 DeviceMotion API";
      this.onDebug(msg, "error");
      throw new Error(msg);
    }

    // iOS 13+ 需要请求权限
    if (this.needsPermission()) {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        const msg = "用户拒绝了运动传感器权限";
        this.onDebug(msg, "error");
        throw new Error(msg);
      }
    }

    this.shakeCount = initialCount;
    this.isListening = true;
    window.addEventListener("devicemotion", this.handleMotion, true);
    this.onDebug("开始监听 devicemotion 事件", "success");

    return true;
  }

  // 停止监听
  stop() {
    this.isListening = false;
    window.removeEventListener("devicemotion", this.handleMotion, true);
    this.onDebug("停止监听 devicemotion 事件", "info");
  }


  setCount(count) {
    this.shakeCount = count;
  }
  // 重置计数
  reset() {
    this.shakeCount = 0;
    this.lastX = null;
    this.lastY = null;
    this.lastZ = null;
    this.onDebug("计数已重置", "info");
  }

  // 处理运动事件
  handleMotion(event) {
    const acceleration =
      event.accelerationIncludingGravity || event.acceleration;

    if (!acceleration) {
      this.onDebug("无法获取加速度数据", "warn");
      return;
    }

    const { x, y, z } = acceleration;

    // 首次记录
    if (this.lastX === null) {
      this.lastX = x;
      this.lastY = y;
      this.lastZ = z;
      return;
    }

    // 计算加速度变化
    const deltaX = Math.abs(x - this.lastX);
    const deltaY = Math.abs(y - this.lastY);
    const deltaZ = Math.abs(z - this.lastZ);

    // 计算总变化量
    const delta = Math.sqrt(
      deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ
    );

    // 更新上次的值
    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;

    // 检测是否超过阈值
    if (delta > this.threshold) {
      const now = Date.now();

      // 防抖：两次摇动间隔太短则忽略
      if (now - this.lastShakeTime > this.timeout) {
        this.shakeCount++;
        this.lastShakeTime = now;

        this.onDebug(
          `检测到摇动! delta=${delta.toFixed(2)}, 次数=${this.shakeCount}`,
          "success"
        );
        this.onShake(this.shakeCount);
      }
    }
  }

  // 获取当前计数
  getCount() {
    return this.shakeCount;
  }
}

// 获取单例
export function getShakeDetector(options = {}) {
  if (!shakeInstance) {
    shakeInstance = new ShakeDetector(options);
  } else {
    // 更新回调
    if (options.onShake) shakeInstance.onShake = options.onShake;
    if (options.onDebug) shakeInstance.onDebug = options.onDebug;
    if (options.threshold) shakeInstance.threshold = options.threshold;
  }
  return shakeInstance;
}

// 销毁单例
export function destroyShakeDetector() {
  if (shakeInstance) {
    shakeInstance.stop();
    shakeInstance = null;
  }
}

export default ShakeDetector;
