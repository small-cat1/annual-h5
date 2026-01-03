// 摇一摇 Hook
import { ref, onMounted, onUnmounted } from 'vue'
import { getShakeDetector, destroyShakeDetector } from '@/utils/shake'

export function useShake(options = {}) {
  const { 
    threshold = 15, 
    autoStart = false,
    onShake = null 
  } = options

  const count = ref(0)
  const isListening = ref(false)
  const isSupported = ref(false)
  const hasPermission = ref(false)

  let detector = null

  const handleShake = (shakeCount) => {
    count.value = shakeCount
    onShake?.(shakeCount)
  }

  const start = async () => {
    if (isListening.value) return true

    detector = getShakeDetector({
      threshold,
      onShake: handleShake
    })

    isSupported.value = detector.isSupported()
    
    if (!isSupported.value) {
      console.warn('设备不支持摇一摇')
      return false
    }

    const started = await detector.start()
    isListening.value = started
    hasPermission.value = detector.hasPermission

    return started
  }

  const stop = () => {
    if (detector) {
      detector.stop()
    }
    isListening.value = false
  }

  const reset = () => {
    count.value = 0
    if (detector) {
      detector.resetCount()
    }
  }

  const setThreshold = (value) => {
    if (detector) {
      detector.setThreshold(value)
    }
  }

  onMounted(() => {
    if (autoStart) {
      start()
    }
  })

  onUnmounted(() => {
    stop()
    destroyShakeDetector()
  })

  return {
    count,
    isListening,
    isSupported,
    hasPermission,
    start,
    stop,
    reset,
    setThreshold
  }
}
