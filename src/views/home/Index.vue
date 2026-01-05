<template>
  <div class="home-page">
    <!-- 头部 -->
    <div class="home-header">
      <div class="user-info">
        <van-image
          round
          width="48"
          height="48"
          :src="userStore.avatar || defaultAvatar"
          fit="cover"
        />
        <div class="user-meta">
          <span class="nickname">{{
            userStore.userInfo?.realName || userStore.nickname
          }}</span>
          <van-tag
            v-if="userStore.isRegistered && userStore.auditStatus === 1"
            type="success"
            size="small"
            >已签到</van-tag
          >
          <van-tag
            v-else-if="userStore.isRegistered && userStore.auditStatus === 0"
            type="warning"
            size="small"
            >审核中</van-tag
          >
        </div>
      </div>
      <h1 class="activity-title">
        {{ activityStore.config.title || "年会互动" }}
      </h1>
    </div>

    <!-- 状态提示卡片 -->
    <div
      class="status-card"
      :class="statusCardClass"
      @click="handleStatusAction"
    >
      <div class="status-content">
        <van-icon :name="statusIcon" size="28" />
        <div class="status-text">
          <span class="status-title">{{ statusTitle }}</span>
          <span class="status-desc">{{ statusDesc }}</span>
        </div>
      </div>
      <van-button v-if="showStatusBtn" type="primary" size="small" round>{{
        statusBtnText
      }}</van-button>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-grid">
      <!-- 签到 -->
      <div class="menu-item" @click="handleCheckIn">
        <div class="menu-icon" :class="{ disabled: userStore.isRegistered }">
          <van-icon name="certificate" size="32" />
        </div>
        <span class="menu-text">签到</span>
        <van-tag v-if="userStore.isRegistered" type="success" size="mini"
          >已完成</van-tag
        >
      </div>

      <!-- 摇一摇抽奖 -->
      <div class="menu-item" @click="handleShake">
        <div class="menu-icon shake" :class="{ disabled: !canJoinLottery }">
          <van-icon name="gift-o" size="32" />
        </div>
        <span class="menu-text">摇一摇</span>
        <van-tag v-if="!canJoinLottery" type="warning" size="mini"
          >需签到</van-tag
        >
      </div>

      <!-- 发弹幕 -->
      <div class="menu-item" @click="handleDanmaku">
        <div class="menu-icon danmaku">
          <van-icon name="comment-o" size="32" />
        </div>
        <span class="menu-text">发弹幕</span>
      </div>

      <!-- 我的奖品 -->
      <div class="menu-item" @click="handlePrize">
        <div class="menu-icon prize">
          <van-icon name="award-o" size="32" />
        </div>
        <span class="menu-text">我的奖品</span>
      </div>
    </div>

    <!-- 活动公告 -->
    <van-notice-bar
      v-if="activityStore.config.title"
      left-icon="volume-o"
      text="欢迎参加年会活动，签到后即可参与抽奖！"
      class="notice-bar"
    />

    <!-- 活动说明 -->
    <div class="info-card">
      <div class="info-title">参与流程</div>
      <div class="info-steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">微信授权登录</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">填写信息签到</div>
        </div>
        <div class="step-arrow">→</div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">参与抽奖活动</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore, useActivityStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const activityStore = useActivityStore()

// 是否已签到
const isCheckedIn = computed(() => userStore.isCheckedIn)

// 审核状态
const auditStatus = computed(() => userStore.auditStatus)

// 是否可以参与抽奖（签到 + 审核通过）
const canJoinLottery = computed(() => userStore.canJoinActivity)

// 签到按钮处理
const handleCheckIn = () => {
  if (isCheckedIn.value) {
    if (auditStatus.value === 0) {
      router.push('/checkIn/status')
    } else {
      showToast('您已完成签到')
    }
    return
  }
  router.push('/checkIn')
}

// 摇一摇按钮处理
const handleShake = () => {
  if (!canJoinLottery.value) {
    if (!isCheckedIn.value) {
      showToast('请先完成签到')
    } else if (auditStatus.value === 0) {
      showToast('签到审核中，请稍后')
    } else if (auditStatus.value === 2) {
      showToast('签到未通过，无法参与')
    }
    return
  }
  router.push('/shake')
}

// 发弹幕（登录就能用）
const handleDanmaku = () => {
  router.push('/danmaku')
}

// 我的奖品
const handlePrize = () => {
  router.push('/prize')
}

onMounted(async () => {
  await activityStore.init()
  if (activityStore.activityId && userStore.isLoggedIn) {
    await userStore.fetchUserInfo(activityStore.activityId)
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 30px;
}

.home-header {
  background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);
  padding: 24px 16px 50px;

  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .user-meta {
      margin-left: 12px;
      display: flex;
      align-items: center;
      gap: 8px;

      .nickname {
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }
    }
  }

  .activity-title {
    font-size: 24px;
    color: #fff;
    font-weight: bold;
  }
}

.status-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -30px 16px 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &.not-registered {
    border-left: 4px solid #ff9800;
    .van-icon {
      color: #ff9800;
    }
  }

  &.pending {
    border-left: 4px solid #2196f3;
    .van-icon {
      color: #2196f3;
    }
  }

  &.rejected {
    border-left: 4px solid #f44336;
    .van-icon {
      color: #f44336;
    }
  }

  &.approved {
    border-left: 4px solid #4caf50;
    .van-icon {
      color: #4caf50;
    }
  }

  .status-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-text {
    display: flex;
    flex-direction: column;

    .status-title {
      font-size: 15px;
      font-weight: bold;
      color: #333;
    }

    .status-desc {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: 0 16px 16px;
  padding: 20px 12px;
  background: #fff;
  border-radius: 12px;

  .menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    .menu-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #4caf50, #8bc34a);
      color: #fff;

      &.shake {
        background: linear-gradient(135deg, #ff5722, #ff9800);
      }

      &.danmaku {
        background: linear-gradient(135deg, #2196f3, #03a9f4);
      }

      &.prize {
        background: linear-gradient(135deg, #9c27b0, #e91e63);
      }

      &.disabled {
        opacity: 0.5;
      }
    }

    .menu-text {
      font-size: 12px;
      color: #333;
    }

    .van-tag {
      position: absolute;
      top: -4px;
      right: 0;
    }
  }
}

.notice-bar {
  margin: 0 16px 16px;
  border-radius: 8px;
}

.info-card {
  margin: 0 16px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;

  .info-title {
    font-size: 15px;
    font-weight: bold;
    color: #333;
    margin-bottom: 16px;
  }

  .info-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;

      .step-num {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #ff5722;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 6px;
      }

      .step-text {
        font-size: 11px;
        color: #666;
        white-space: nowrap;
      }
    }

    .step-arrow {
      color: #ccc;
      font-size: 16px;
      margin-bottom: 20px;
    }
  }
}
</style>
