<template>
  <div class="empty-state">
    <van-empty :image="imageUrl" :description="description">
      <template #default v-if="$slots.default">
        <slot />
      </template>
    </van-empty>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'default' // default, network, search, prize
  },
  description: {
    type: String,
    default: '暂无数据'
  },
  image: {
    type: String,
    default: ''
  }
})

const imageUrl = computed(() => {
  if (props.image) return props.image
  
  const imageMap = {
    default: 'default',
    network: 'network',
    search: 'search',
    prize: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png'
  }
  
  return imageMap[props.type] || 'default'
})
</script>

<style lang="scss" scoped>
.empty-state {
  padding: 40px 20px;
}
</style>
