<template>
  <div class="status-page">
    <van-nav-bar title="审核状态" />
    
    <div class="status-content">
      <!-- 待审核 -->
      <div v-if="userStore.auditStatus === 0" class="status-box pending">
        <van-icon name="clock-o" size="64" color="#ff9800" />
        <h2>等待审核中</h2>
        <p>您的报名信息已提交，请耐心等待管理员审核</p>
        <van-button 
          type="default" 
          round 
          size="small"
          @click="refreshStatus"
          :loading="refreshing"
        >
          刷新状态
        </van-button>
      </div>

      <!-- 已通过 -->
      <div v-else-if="userStore.auditStatus === 1" class="status-box success">
        <van-icon name="checked" size="64" color="#4caf50" />
        <h2>审核通过</h2>
        <p>恭喜您，已通过审核！</p>
        <van-button type="primary" round block @click="goHome">
          进入首页
        </van-button>
      </div>

      <!-- 已拒绝 -->
      <div v-else-if="userStore.auditStatus === 2" class="status-box rejected">
        <van-icon name="close" size="64" color="#f44336" />
        <h2>审核未通过</h2>
        <p>很抱歉，您的报名未通过审核</p>
        <p class="reason">拒绝原因：{{ rejectReason || '未填写' }}</p>
        <van-button type="primary" round block @click="goRegister">
          重新报名
        </van-button>
      </div>
    </div>

    <!-- 报名信息 -->
    <van-cell-group inset title="报名信息" class="info-group">
      <van-cell title="真实姓名" :value="userStore.userInfo?.realName" />
      <van-cell title="手机号" :value="userStore.userInfo?.phone" />
      <van-cell title="部门" :value="userStore.userInfo?.department" />
      <van-cell title="工号" :value="userStore.userInfo?.employeeNo" />
    </van-cell-group>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const refreshing = ref(false)
const rejectReason = ref('')

const refreshStatus = async () => {
  refreshing.value = true
  try {
    await userStore.fetchUserInfo()
    
    if (userStore.auditStatus === 1) {
      showToast({
        type: 'success',
        message: '审核已通过'
      })
    } else {
      showToast('状态已刷新')
    }
  } catch (error) {
    console.error('刷新失败:', error)
  } finally {
    refreshing.value = false
  }
}

const goHome = () => {
  router.replace('/')
}

const goRegister = () => {
  router.replace('/register')
}

onMounted(() => {
  // 页面加载时刷新一次状态
  refreshStatus()
})
</script>

<style lang="scss" scoped>
.status-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.status-content {
  padding: 40px 20px;
}

.status-box {
  background: #fff;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  
  h2 {
    margin: 20px 0 12px;
    font-size: 20px;
    color: #333;
  }
  
  p {
    font-size: 14px;
    color: #666;
    margin-bottom: 12px;
  }
  
  .reason {
    color: #f44336;
    font-size: 12px;
    background: #fff5f5;
    padding: 8px 12px;
    border-radius: 4px;
    margin: 16px 0;
  }
  
  .van-button {
    margin-top: 20px;
  }
}

.info-group {
  margin-top: 20px;
}
</style>
