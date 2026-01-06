<template>
  <div class="home-container">
    <!-- 加载中 -->
    <div v-if="loading" class="app-loading">
      <van-loading type="spinner" color="#ff5722" size="36" />
      <p>加载中...</p>
    </div>

    <!-- 无活动ID -->
    <div v-else-if="!activityStore.activityId" class="app-error">
      <div class="error-content">
        <van-icon name="warning-o" size="64" color="#ff9800" />
        <h2>未指定活动</h2>
        <p>请通过正确的链接访问</p>
      </div>
    </div>

    <!-- 活动加载失败 -->
    <div v-else-if="activityStore.loadError" class="app-error">
      <div class="error-content">
        <van-icon name="close" size="64" color="#f44336" />
        <h2>活动不存在</h2>
        <p>请检查链接是否正确</p>
        <van-button type="primary" round @click="retry">重试</van-button>
      </div>
    </div>

    <!-- 活动未开始 -->
    <div v-else-if="activityStore.activityStatus === 0" class="app-error">
      <div class="error-content">
        <van-icon name="clock-o" size="64" color="#2196f3" />
        <h2>活动未开始</h2>
        <p>{{ activityStore.config?.title }}</p>
        <p class="sub-text">
          开始时间：{{ formatDate(activityStore.config?.startTime) }}
        </p>
        <van-button type="primary" round @click="retry">刷新</van-button>
      </div>
    </div>

    <!-- 活动已结束 -->
    <div v-else-if="activityStore.activityStatus === 2" class="app-error">
      <div class="error-content">
        <van-icon name="passed" size="64" color="#9e9e9e" />
        <h2>活动已结束</h2>
        <p>{{ activityStore.config?.title }}</p>
        <p class="sub-text">感谢您的参与！</p>
      </div>
    </div>

    <!-- 正常显示首页内容 -->
    <div v-else class="home-page">
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
              v-if="isCheckedIn && auditStatus === 1"
              type="success"
              size="small"
              >已签到</van-tag
            >
            <van-tag
              v-else-if="isCheckedIn && auditStatus === 0"
              type="warning"
              size="small"
              >审核中</van-tag
            >
          </div>
        </div>
        <h1 class="activity-title">
          {{ activityStore.config?.title || "年会互动" }}
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
          <div class="menu-icon" :class="{ disabled: isCheckedIn }">
            <van-icon name="certificate" size="32" />
          </div>
          <span class="menu-text">签到</span>
          <van-tag v-if="isCheckedIn" type="success" size="mini"
            >已完成</van-tag
          >
        </div>

        <!-- 摇一摇抽奖 -->
        <div class="menu-item" @click="handleShake">
          <div class="menu-icon shake" :class="{ disabled: !canJoinLottery }">
            <van-icon name="gift-o" size="32" />
          </div>
          <span class="menu-text">摇一摇</span>
          <!-- ⭐ 修改：优先显示"进行中"，否则显示"需签到" -->
          <van-tag v-if="hasActiveGame" type="danger" size="mini" class="blink">
            进行中
          </van-tag>
          <van-tag v-else-if="!canJoinLottery" type="warning" size="mini">
            需签到
          </van-tag>
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
        v-if="activityStore.config?.title"
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
  </div>
</template>

<script setup>
import { getCurrentRound } from "@/api/shake";
import { useActivityStore, useUserStore, useWebSocketStore } from "@/store";
import { formatDate } from "@/utils/format";
import { showToast } from "vant";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userStore = useUserStore();
const activityStore = useActivityStore();
const wsStore = useWebSocketStore();

const loading = ref(true);
const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";
// ⭐ 新增：游戏状态
const hasActiveGame = ref(false);
const activeRound = ref(null);
// WebSocket 订阅取消函数
let gameStartUnsubscribe = null;
let gameStopUnsubscribe = null;
// 是否已签到（使用 store 中的 getter）
const isCheckedIn = computed(() => userStore.isCheckedIn);

// 审核状态（使用 store 中的 getter）
const auditStatus = computed(() => userStore.auditStatus);

// 是否可以参与抽奖（签到 + 审核通过）
const canJoinLottery = computed(() => userStore.canJoinActivity);

// 状态卡片样式
const statusCardClass = computed(() => {
  if (!isCheckedIn.value) return "not-registered";
  if (auditStatus.value === 0) return "pending";
  if (auditStatus.value === 2) return "rejected";
  return "approved";
});

// 状态图标
const statusIcon = computed(() => {
  if (!isCheckedIn.value) return "warning-o";
  if (auditStatus.value === 0) return "clock-o";
  if (auditStatus.value === 2) return "close";
  return "checked";
});

// 状态标题
const statusTitle = computed(() => {
  if (!isCheckedIn.value) return "未签到";
  if (auditStatus.value === 0) return "签到审核中";
  if (auditStatus.value === 2) return "签到未通过";
  return "已签到";
});

// 状态描述
const statusDesc = computed(() => {
  if (!isCheckedIn.value) return "完成签到后可参与抽奖";
  if (auditStatus.value === 0) return "请等待工作人员审核";
  if (auditStatus.value === 2) return "请联系工作人员";
  return "可以参与抽奖活动啦";
});

// 是否显示状态按钮
const showStatusBtn = computed(() => {
  return !isCheckedIn.value || auditStatus.value === 0;
});

// 状态按钮文字
const statusBtnText = computed(() => {
  if (!isCheckedIn.value) return "去签到";
  if (auditStatus.value === 0) return "查看状态";
  return "";
});

// ⭐ 新增：检查当前游戏状态
const checkGameStatus = async () => {
  if (!activityStore.activityId) return;

  try {
    const res = await getCurrentRound(activityStore.activityId);
    if (res.code === 0 && res.data && res.data.status === 1) {
      hasActiveGame.value = true;
      activeRound.value = res.data;
    } else {
      hasActiveGame.value = false;
      activeRound.value = null;
    }
  } catch (e) {
    console.error("获取游戏状态失败:", e);
  }
};

// ⭐ 新增：订阅 WebSocket 游戏事件
const subscribeGameEvents = () => {
  if (!wsStore.ws) return;

  gameStartUnsubscribe = wsStore.subscribe("game_start", (data) => {
    console.log("[Home] 收到游戏开始:", data);
    hasActiveGame.value = true;
    activeRound.value = data.round || null;
  });

  gameStopUnsubscribe = wsStore.subscribe("game_stop", (data) => {
    console.log("[Home] 收到游戏结束:", data);
    hasActiveGame.value = false;
    activeRound.value = null;
  });
};

// ⭐ 新增：取消订阅
const unsubscribeGameEvents = () => {
  if (gameStartUnsubscribe) {
    gameStartUnsubscribe();
    gameStartUnsubscribe = null;
  }
  if (gameStopUnsubscribe) {
    gameStopUnsubscribe();
    gameStopUnsubscribe = null;
  }
};

// 状态卡片点击处理
const handleStatusAction = () => {
  if (!isCheckedIn.value) {
    router.push("/checkIn");
  } else if (auditStatus.value === 0) {
    router.push("/checkIn/status");
  }
};

// 签到按钮处理
const handleCheckIn = () => {
  if (isCheckedIn.value) {
    if (auditStatus.value === 0) {
      router.push("/checkIn/status");
    } else {
      showToast("您已完成签到");
    }
    return;
  }
  router.push("/checkIn");
};

// 摇一摇按钮处理
const handleShake = () => {
  // 检查权限
  if (!canJoinLottery.value) {
    if (!isCheckedIn.value) {
      showToast("请先完成签到");
    } else if (auditStatus.value === 0) {
      showToast("签到审核中，请稍后");
    } else if (auditStatus.value === 2) {
      showToast("签到未通过，无法参与");
    }
    return;
  }

  router.push("/shake");
};

// 发弹幕（登录就能用）
const handleDanmaku = () => {
  router.push("/danmaku");
};

// 我的奖品
const handlePrize = () => {
  router.push("/prize");
};

// 初始化
const init = async () => {
  loading.value = true;

  // 从 localStorage 获取 activityId
  const activityId = localStorage.getItem("activityId");
  console.log("Home 页面从 localStorage 获取 activityId:", activityId);

  if (!activityId) {
    loading.value = false;
    return;
  }

  // 初始化活动信息
  await activityStore.init(activityId);

  // ⭐ 新增：检查游戏状态
  await checkGameStatus();
  // ⭐ 新增：订阅游戏事件
  subscribeGameEvents();
  loading.value = false;
};

const retry = () => {
  init();
};

onMounted(() => {
  init();
});
// ⭐ 新增：组件卸载时取消订阅
onUnmounted(() => {
  unsubscribeGameEvents();
});
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
}

.app-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.app-loading p {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.app-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.error-content {
  text-align: center;
  background: #fff;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-width: 320px;
  width: 100%;
}

.error-content h2 {
  margin: 20px 0 12px;
  font-size: 20px;
  color: #333;
}

.error-content p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.error-content .sub-text {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.error-content .van-button {
  margin-top: 24px;
}

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

.blink {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
