<template>
  <div class="login-page">
    <!-- 背景图片 -->
    <div class="bg-image"></div>
    <!-- 遮罩层 -->
    <div class="bg-overlay"></div>
    
    <!-- 内容区 -->
    <div class="login-container">
      <!-- 顶部装饰 -->
      <div class="decoration">
        <span class="year">2025</span>
        <div class="line"></div>
      </div>
      
      <!-- 主标题 -->
      <div class="main-title">
        <h1>年度盛典</h1>
        <p class="slogan">骏马奔腾启新程 · 共创辉煌谱华章</p>
      </div>
      
      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="card-header">
          <div class="icon-wrapper">
            <van-icon name="user-circle-o" size="32" />
          </div>
          <span>员工登录</span>
        </div>
        
        <van-button 
          class="wechat-btn"
          block 
          round 
          size="large"
          :loading="loading"
          loading-text="正在跳转..."
          @click="handleWechatLogin"
        >
          <template #icon>
            <van-icon name="wechat" class="wechat-icon" />
          </template>
          微信一键登录
        </van-button>
        
        <p class="hint" v-if="!isWechatEnv">
          <van-icon name="info-o" />
          请使用微信扫码或在微信中打开
        </p>
      </div>
      
      <!-- 底部信息 -->
      <div class="footer">
        <p class="agreement">
          登录即表示同意
          <a @click="showAgreement('user')">《用户协议》</a>
          和
          <a @click="showAgreement('privacy')">《隐私政策》</a>
        </p>
        <p class="copyright">© 2025 公司名称 All Rights Reserved</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { isWechat, redirectToAuth } from '@/utils/wechat'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const isWechatEnv = ref(false)

onMounted(() => {
  isWechatEnv.value = isWechat()
})

const handleWechatLogin = async () => {
  if (!isWechat()) {
    showToast({
      message: '请在微信中打开',
      icon: 'warning-o'
    })
    return
  }
  
  loading.value = true
  
  // 获取重定向地址
  const redirect = route.query.redirect || '/'
  const redirectUri = window.location.origin + '/auth/callback?redirect=' + encodeURIComponent(redirect)
  
  // 跳转微信授权
  await redirectToAuth(redirectUri)
}

const showAgreement = (type) => {
  const title = type === 'user' ? '用户协议' : '隐私政策'
  showDialog({
    title,
    message: '协议内容...',
    confirmButtonText: '我知道了'
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

// 背景图片
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('@/assets/images/login-bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform: scale(1.1);
  filter: blur(2px);
}

// 渐变遮罩
.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(139, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
}

// 内容容器
.login-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 60px 24px 40px;
}

// 顶部装饰
.decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
  
  .year {
    font-size: 20px;
    font-weight: 300;
    color: #ffd700;
    letter-spacing: 4px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .line {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #ffd700, transparent);
  }
}

// 主标题
.main-title {
  text-align: center;
  margin-bottom: 60px;
  
  h1 {
    font-size: 42px;
    font-weight: bold;
    color: #fff;
    letter-spacing: 8px;
    text-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      0 4px 20px rgba(255, 215, 0, 0.3);
    margin-bottom: 16px;
    
    // 金色渐变文字
    background: linear-gradient(180deg, #fff 0%, #ffd700 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .slogan {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 2px;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  }
}

// 登录卡片
.login-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px 24px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  
  .card-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 24px;
    color: #333;
    
    .icon-wrapper {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #ff5722, #ff8a65);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    span {
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .wechat-btn {
    height: 50px;
    font-size: 16px;
    font-weight: 500;
    background: linear-gradient(135deg, #07c160, #06ad56);
    border: none;
    box-shadow: 0 4px 15px rgba(7, 193, 96, 0.4);
    
    &:active {
      transform: scale(0.98);
    }
    
    .wechat-icon {
      font-size: 22px;
      margin-right: 8px;
    }
  }
  
  .hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 16px;
    font-size: 12px;
    color: #999;
  }
}

// 底部信息
.footer {
  margin-top: auto;
  padding-top: 40px;
  text-align: center;
  
  .agreement {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 12px;
    
    a {
      color: #ffd700;
      text-decoration: none;
      
      &:active {
        opacity: 0.8;
      }
    }
  }
  
  .copyright {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }
}

// 动画效果
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.decoration {
  animation: fadeInUp 0.6s ease-out;
}

.main-title {
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.login-card {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.footer {
  animation: fadeInUp 0.6s ease-out 0.3s both;
}
</style>