<template>
  <div class="callback-page">
    <div class="loading-box">
      <van-loading type="spinner" color="#ff5722" size="48" />
      <p class="loading-text">{{ statusText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store/modules/user'
import { getCodeFromUrl } from '@/utils/wechat'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const statusText = ref('正在授权中...')

onMounted(async () => {
  const code = getCodeFromUrl()
  
  if (!code) {
    showToast('授权失败，请重试')
    router.replace('/auth/login')
    return
  }

  try {
    statusText.value = '正在登录...'
    await userStore.wechatLogin(code)
    statusText.value = '登录成功'
    
    // 直接跳转目标页（默认首页）
    const redirect = route.query.redirect || '/'
    router.replace(decodeURIComponent(redirect))
  } catch (error) {
    console.error('登录失败:', error)
    showToast('登录失败，请重试')
    router.replace('/auth/login')
  }
})
</script>

<style lang="scss" scoped>
.callback-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-box {
  text-align: center;
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}
</style>