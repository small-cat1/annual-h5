<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <h2>页面不存在</h2>
      <p>抱歉，您访问的页面不存在或已被移除</p>
      <van-button type="primary" round @click="goHome">
        返回首页
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.replace('/')
}
</script>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
  
  .error-code {
    font-size: 120px;
    font-weight: bold;
    color: #ff5722;
    line-height: 1;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 24px;
    color: #333;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 14px;
    color: #666;
    margin-bottom: 30px;
  }
}
</style>
