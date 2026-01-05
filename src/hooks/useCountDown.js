import { ref, onUnmounted } from 'vue'

export function useCountDown(initialTime = 0, options = {}) {
  const { onFinish, onTick, autoStart = false } = options
  
  const time = ref(initialTime)
  const isRunning = ref(false)
  let timer = null

  const start = () => {
    if (isRunning.value || time.value <= 0) return
    
    isRunning.value = true
    timer = setInterval(() => {
      time.value--
      onTick?.(time.value)
      
      if (time.value <= 0) {
        stop()
        onFinish?.()
      }
    }, 1000)
  }

  const stop = () => {
    isRunning.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  const reset = (newTime) => {
    stop()
    time.value = newTime ?? initialTime
  }

  const restart = (newTime) => {
    reset(newTime)
    start()
  }

  if (autoStart && initialTime > 0) {
    start()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    restart
  }
}
