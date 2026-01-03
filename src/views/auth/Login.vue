<template>
  <div class="login-page">
    <div class="login-header">
      <img src="@/assets/images/logo.svg" alt="Logo" class="logo" />
      <h1 class="title">年会互动</h1>
      <p class="subtitle">精彩年会，从这里开始</p>
    </div>

    <div class="login-content">
      <van-button 
        type="primary" 
        block 
        round 
        size="large"
        color="#07c160"
        :loading="loading"
        @click="handleWechatLogin"
      >
        <van-icon name="wechat" style="margin-right: 8px" />
        微信授权登录
      </van-button>
      
      <p class="tips">请在微信中打开此页面</p>
    </div>

    <div class="login-footer">
      <p>登录即表示同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { isWechat, redirectToAuth } from '@/utils/wechat'

const router = useRouter()
const route = useRoute()

const loading = ref(false)

const handleWechatLogin = () => {
  if (!isWechat()) {
    showToast('请在微信中打开')
    return
  }
  
  loading.value = true
  
  // 获取重定向地址
  const redirect = route.query.redirect || '/'
  const redirectUri = window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirect)
  
  // 跳转微信授权
  redirectToAuth(redirectUri)
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);
  display: flex;
  flex-direction: column;
  padding: 60px 30px;
}

.login-header {
  text-align: center;
  padding: 40px 0;
  
  .logo {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .title {
    font-size: 28px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8px;
  }
  
  .subtitle {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  .tips {
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 16px;
  }
}

.login-footer {
  text-align: center;
  padding: 20px 0;
  
  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  
  a {
    color: #fff;
    text-decoration: underline;
  }
}
</style>
