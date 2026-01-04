<template>
  <div class="console-page">
    <!-- 无活动ID提示 -->
    <div v-if="!activityStore.hasActivityId" class="no-activity">
      <div class="no-activity-content">
        <span class="icon">⚠️</span>
        <h2>未指定活动</h2>
        <p>请在URL中添加活动ID参数，如：?activityId=1</p>
      </div>
    </div>

    <!-- 加载失败提示 -->
    <div v-else-if="activityStore.loadError" class="load-error">
      <div class="error-content">
        <span class="icon">❌</span>
        <h2>活动加载失败</h2>
        <p>请检查活动ID是否正确</p>
        <button class="btn btn-primary" @click="retryLoad">重试</button>
      </div>
    </div>

    <!-- 正常页面 -->
    <template v-else-if="activityStore.isReady">
      <!-- 背景装饰 -->
      <div class="bg-decorations">
        <div class="lantern lantern-left"></div>
        <div class="lantern lantern-right"></div>
        <div class="firework firework-1"></div>
        <div class="firework firework-2"></div>
        <div class="firework firework-3"></div>
      </div>

      <!-- 顶部标题栏 -->
      <header class="console-header">
        <div class="header-left">
          <button class="game-entry-btn" @click="goToGame">
            <span class="btn-icon">🎮</span>
            进入游戏控制
          </button>
        </div>
        <div class="header-center">
          <img
            v-if="activityStore.config.logo"
            :src="activityStore.config.logo"
            class="activity-logo"
          />
          <span v-else class="logo-icon">🎊</span>
          <h1>{{ activityStore.config.title || "年会控制台" }}</h1>
        </div>
        <div class="header-right">
          <span class="time-display">{{ currentTime }}</span>
        </div>
      </header>

      <!-- 主体内容 -->
      <main class="console-main">
        <!-- 左侧：签到管理 -->
        <section class="panel checkin-panel">
          <div class="panel-header">
            <span class="panel-icon">✅</span>
            <h2>签到管理</h2>
            <span
              class="status-tag"
              :class="checkInData.isOpen ? 'is-open' : 'is-closed'"
            >
              {{ checkInData.isOpen ? "签到中" : "未开启" }}
            </span>
          </div>

          <div class="panel-body">
            <!-- 签到统计 -->
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value gold">{{ checkInData.checkedIn }}</div>
                <div class="stat-label">已签到</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ checkInData.total }}</div>
                <div class="stat-label">总人数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value red">{{ checkInData.rate }}%</div>
                <div class="stat-label">签到率</div>
              </div>
            </div>

            <!-- 签到进度条 -->
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: checkInData.rate + '%' }"
              ></div>
            </div>

            <!-- 签到二维码区域 -->
            <div class="qrcode-section" v-if="checkInData.isOpen">
              <div class="qrcode-wrapper">
                <qrcode-vue :value="checkInQrUrl" :size="180" level="M" />
              </div>
              <p class="qrcode-tip">员工扫码签到</p>
            </div>

            <!-- 签到控制按钮 -->
            <div class="action-buttons">
              <button
                v-if="!checkInData.isOpen"
                class="btn btn-primary btn-glow"
                @click="handleOpenCheckIn"
                :disabled="btnLoading"
              >
                <span class="btn-icon">🚀</span>
                开启签到
              </button>
              <button
                v-else
                class="btn btn-danger"
                @click="handleCloseCheckIn"
                :disabled="btnLoading"
              >
                <span class="btn-icon">⏹️</span>
                关闭签到
              </button>
            </div>
          </div>
        </section>

        <!-- 右侧：弹幕 -->
        <DanmakuPanel
          :activity-id="activityStore.activityId"
          :limit="30"
          :poll-interval="3000"
        />
      </main>

      <!-- 底部状态栏 -->
      <footer class="console-footer">
        <div class="footer-item">
          <span class="footer-icon">📡</span>
          <span>实时同步中</span>
        </div>
        <div class="footer-item">
          <span class="footer-icon">🎪</span>
          <span>活动ID: {{ activityStore.activityId }}</span>
        </div>
      </footer>
    </template>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { closeCheckIn, getCheckInStats, openCheckIn } from "@/api/console/checkin";
import DanmakuPanel from "@/components/DanmakuPanel.vue";
import { useActivityStore } from "@/store/modules/activity";
import QrcodeVue from "qrcode.vue";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const activityStore = useActivityStore();

const H5_BASE = import.meta.env.VITE_APP_H5_URL || window.location.origin;

// 当前时间
const currentTime = ref("");

// 签到数据（状态+统计合一）
const checkInData = reactive({
  isOpen: false,
  checkedIn: 0,
  total: 0,
  rate: 0,
});

// 按钮加载状态
const btnLoading = ref(false);

// 签到二维码URL
const checkInQrUrl = computed(
  () => `${H5_BASE}/checkin?activityId=${activityStore.activityId}`
);

// 定时器
let pollTimer = null;
let timeTimer = null;

// 更新当前时间
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString("zh-CN", { hour12: false });
};

// 获取签到统计（包含状态）
const fetchCheckInStats = async () => {
  if (!activityStore.activityId) return;

  try {
    const res = await getCheckInStats(activityStore.activityId);
    if (res.code === 0 && res.data) {
      checkInData.isOpen = res.data.isOpen || false;
      checkInData.checkedIn = res.data.checkedIn || 0;
      checkInData.total = res.data.total || 0;
      checkInData.rate = res.data.rate || 0;
    }
  } catch (e) {
    console.error("获取签到统计失败", e);
  }
};

// 开启签到
const handleOpenCheckIn = async () => {
  btnLoading.value = true;
  try {
    const res = await openCheckIn(activityStore.activityId);
    if (res.code === 0) {
      checkInData.isOpen = true;
            startPolling(); // 开始轮询
    }
  } catch (e) {
    console.error("开启签到失败", e);
  } finally {
    btnLoading.value = false;
  }
};

// 关闭签到
const handleCloseCheckIn = async () => {
  btnLoading.value = true;
  try {
    const res = await closeCheckIn(activityStore.activityId);
    if (res.code === 0) {
      checkInData.isOpen = false;
            stopPolling(); // 停止轮询
    }
  } catch (e) {
    console.error("关闭签到失败", e);
  } finally {
    btnLoading.value = false;
  }
};

// 进入游戏控制
const goToGame = () => {
  router.push({ path: "/screen/game" });
};

// 重试加载
const retryLoad = async () => {
  await activityStore.init(route.query.activityId);
  if (activityStore.isReady) {
    startPolling();
  }
};

// 开始轮询
const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(fetchCheckInStats, 5000);
};

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

// 初始化
onMounted(async () => {
  // 时间更新
  updateTime();
  timeTimer = setInterval(updateTime, 1000);

  // 初始化store（获取活动ID + 加载配置）
  const success = await activityStore.init(route.query.activityId);

  // 配置加载成功才开始轮询
  if (success) {
   // 首次请求一次签到数据
    await fetchCheckInStats();
    // 如果签到已开启，才开始轮询
    if (checkInData.isOpen) {
      startPolling();
    }
  }
});

// 清理
onUnmounted(() => {
  stopPolling();
  if (timeTimer) clearInterval(timeTimer);
});
</script>

<style lang="scss" scoped>
// 主题色变量
$primary-red: #e63946;
$primary-gold: #ffd700;
$dark-red: #9b1b30;
$bg-dark: #1a0a0a;
$bg-card: rgba(40, 15, 15, 0.9);
$text-light: #fff5e6;
$text-gold: #ffd700;

.console-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0a0a 0%, #2d1515 50%, #1a0808 100%);
  color: $text-light;
  position: relative;
  overflow: hidden;
}

// 无活动ID / 加载失败 / 加载中
.no-activity,
.load-error,
.loading-state {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-activity-content,
.error-content {
  text-align: center;
  padding: 40px;
  background: $bg-card;
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);

  .icon {
    font-size: 64px;
    display: block;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    margin: 0 0 12px;
    color: $text-gold;
  }

  p {
    font-size: 14px;
    opacity: 0.7;
    margin: 0 0 20px;
  }
}

.loading-state {
  flex-direction: column;
  gap: 16px;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.2);
    border-top-color: $primary-gold;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: 14px;
    opacity: 0.7;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 背景装饰
.bg-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.lantern {
  position: absolute;
  width: 60px;
  height: 80px;
  background: radial-gradient(ellipse at center, #ff4444 0%, #cc0000 70%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: 0 0 30px rgba(255, 68, 68, 0.6);
  animation: sway 3s ease-in-out infinite;

  &::before {
    content: "";
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 15px;
    background: linear-gradient(to bottom, #ffd700, #ffaa00);
    border-radius: 3px 3px 0 0;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 20px;
    background: linear-gradient(to bottom, #ffd700, transparent);
  }

  &.lantern-left {
    top: 20px;
    left: 5%;
  }
  &.lantern-right {
    top: 20px;
    right: 5%;
    animation-delay: 1.5s;
  }
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

.firework {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: firework 2s ease-out infinite;

  &.firework-1 {
    top: 15%;
    left: 20%;
    background: $primary-gold;
  }
  &.firework-2 {
    top: 25%;
    right: 25%;
    background: $primary-red;
    animation-delay: 0.7s;
  }
  &.firework-3 {
    top: 10%;
    right: 15%;
    background: #ff6b6b;
    animation-delay: 1.4s;
  }
}

@keyframes firework {
  0% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 0 currentColor;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.8;
    box-shadow: 20px -20px 0 -2px currentColor, -20px -20px 0 -2px currentColor,
      20px 20px 0 -2px currentColor, -20px 20px 0 -2px currentColor,
      30px 0 0 -2px currentColor, -30px 0 0 -2px currentColor,
      0 30px 0 -2px currentColor, 0 -30px 0 -2px currentColor;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
    box-shadow: none;
  }
}

// 顶部标题栏
.console-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(
    to right,
    rgba(154, 27, 48, 0.9),
    rgba(40, 15, 15, 0.9)
  );
  border-bottom: 2px solid rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);

  .header-left {
    flex: 1;
  }

  .game-entry-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $primary-gold, #ffaa00);
    border: none;
    border-radius: 25px;
    color: #1a0a0a;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
    }

    .btn-icon {
      font-size: 18px;
    }
  }

  .header-center {
    display: flex;
    align-items: center;
    gap: 12px;

    .activity-logo {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: contain;
    }

    .logo-icon {
      font-size: 32px;
      animation: bounce 2s ease-in-out infinite;
    }

    h1 {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffd700, #ffaa00, #ffd700);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }
  }

  .header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .time-display {
    font-size: 20px;
    font-weight: 600;
    font-family: "Courier New", monospace;
    color: $primary-gold;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

// 主体内容 - 两栏布局
.console-main {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  min-height: calc(100vh - 140px);
}

// 面板通用样式
.panel {
  background: $bg-card;
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(
    to right,
    rgba(154, 27, 48, 0.5),
    rgba(40, 15, 15, 0.5)
  );
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);

  .panel-icon {
    font-size: 20px;
  }

  h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    flex: 1;
    color: $text-gold;
  }

  .status-tag {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;

    &.is-open {
      background: rgba(76, 175, 80, 0.2);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.4);
    }

    &.is-closed {
      background: rgba(158, 158, 158, 0.2);
      color: #bdbdbd;
      border: 1px solid rgba(158, 158, 158, 0.4);
    }
  }
}

.panel-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

// 签到统计
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  .stat-item {
    text-align: center;
    padding: 20px 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    border: 1px solid rgba(255, 215, 0, 0.1);

    .stat-value {
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;

      &.gold {
        color: $primary-gold;
      }
      &.red {
        color: #ff6b6b;
      }
    }

    .stat-label {
      font-size: 13px;
      opacity: 0.7;
    }
  }
}

.progress-bar {
  height: 10px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 5px;
  margin-bottom: 24px;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $primary-red, $primary-gold);
    border-radius: 5px;
    transition: width 0.5s ease;
  }
}

.qrcode-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;

  .qrcode-wrapper {
    padding: 20px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  }

  .qrcode-tip {
    margin-top: 16px;
    font-size: 15px;
    color: $primary-gold;
  }
}

// 按钮
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;

  .btn-icon {
    font-size: 20px;
  }

  &.btn-primary {
    background: linear-gradient(135deg, $primary-red, $dark-red);
    color: #fff;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(230, 57, 70, 0.5);
    }
  }

  &.btn-danger {
    background: linear-gradient(135deg, #ff4444, #cc0000);
    color: #fff;
  }

  &.btn-glow {
    animation: glow 2s ease-in-out infinite;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes glow {
  0%,
  100% {
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);
  }
  50% {
    box-shadow: 0 4px 30px rgba(230, 57, 70, 0.7),
      0 0 60px rgba(255, 215, 0, 0.3);
  }
}

// 底部状态栏
.console-footer {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 215, 0, 0.1);

  .footer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    opacity: 0.7;
  }
}

// 响应式
@media (max-width: 1200px) {
  .console-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .console-header {
    flex-wrap: wrap;
    gap: 12px;
    .header-center {
      order: -1;
      width: 100%;
      justify-content: center;
    }
    .header-left,
    .header-right {
      flex: none;
    }
  }
}
</style>
