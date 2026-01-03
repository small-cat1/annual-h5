<template>
  <div class="countdown" :class="{ 'countdown-large': large }">
    <span class="countdown-number">{{ displayTime }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  // 倒计时秒数
  time: {
    type: Number,
    default: 0
  },
  // 是否自动开始
  autoStart: {
    type: Boolean,
    default: true
  },
  // 大尺寸
  large: {
    type: Boolean,
    default: false
  },
  // 格式 mm:ss 或 ss
  format: {
    type: String,
    default: 'mm:ss'
  }
})

const emit = defineEmits(['finish', 'change'])

const remainTime = ref(props.time)
let timer = null

const displayTime = computed(() => {
  const time = remainTime.value
  if (props.format === 'ss') {
    return time
  }
  const mins = Math.floor(time / 60)
  const secs = time % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const start = () => {
  if (timer) return
  
  timer = setInterval(() => {
    if (remainTime.value > 0) {
      remainTime.value--
      emit('change', remainTime.value)
    } else {
      stop()
      emit('finish')
    }
  }, 1000)
}

const stop = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const reset = (time) => {
  stop()
  remainTime.value = time ?? props.time
}

watch(() => props.time, (val) => {
  remainTime.value = val
  if (props.autoStart && val > 0) {
    start()
  }
}, { immediate: true })

onUnmounted(() => {
  stop()
})

defineExpose({
  start,
  stop,
  reset,
  remainTime
})
</script>

<style lang="scss" scoped>
.countdown {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.countdown-number {
  font-size: 24px;
  font-weight: bold;
  color: #ff5722;
  font-family: 'Arial', sans-serif;
}

.countdown-large {
  .countdown-number {
    font-size: 48px;
  }
}
</style>
