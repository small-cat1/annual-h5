<template>
  <div class="shake-page">
    <van-nav-bar title="摇一摇" left-arrow @click-left="$router.back()" />

    <!-- 调试面板 -->
    <div class="debug-panel" :class="{ collapsed: debugCollapsed }">
      <div class="debug-header" @click="debugCollapsed = !debugCollapsed">
        <span>🔧 调试面板</span>
        <span>{{ debugCollapsed ? '展开' : '收起' }}</span>
      </div>
      <div v-show="!debugCollapsed" class="debug-content">
        <div class="debug-section">
          <div class="debug-title">📱 摇动检测</div>
          <div class="debug-row">
            <span>检测器状态:</span>
            <span :class="shakeDetectorReady ? 'status-ok' : 'status-error'">
              {{ shakeDetectorReady ? '✅ 已启动' : '❌ 未启动' }}
            </span>
          </div>
          <div class="debug-row">
            <span>摇动次数:</span>
            <span class="value">{{ shakeCount }}</span>
          </div>
          <div class="debug-row">
            <span>最后摇动:</span>
            <span>{{ lastShakeTime || '-' }}</span>
          </div>
        </div>

        <div class="debug-section">
          <div class="debug-title">🌐 WebSocket</div>
          <div class="debug-row">
            <span>连接状态:</span>
            <span :class="wsConnected ? 'status-ok' : 'status-error'">
              {{ wsConnected ? '✅ 已连接' : '❌ 未连接' }}
            </span>
          </div>
          <div class="debug-row">
            <span>发送次数:</span>
            <span class="value">{{ sendCount }}</span>
          </div>
          <div class="debug-row">
            <span>最后发送:</span>
            <span>{{ lastSendTime || '-' }}</span>
          </div>
        </div>

        <div class="debug-section">
          <div class="debug-title">📤 最近发送的数据</div>
          <div class="debug-data">
            <pre>{{ lastSendData ? JSON.stringify(lastSendData, null, 2) : '暂无' }}</pre>
          </div>
        </div>

        <div class="debug-section">
          <div class="debug-title">📥 最近收到的排名</div>
          <div class="debug-data">
            <pre>{{ lastRankingData ? JSON.stringify(lastRankingData, null, 2) : '暂无' }}</pre>
          </div>
        </div>

        <div class="debug-section">
          <div class="debug-title">📋 日志 (最近10条)</div>
          <div class="debug-logs">
            <div v-for="(log, index) in debugLogs" :key="index" class="log-item" :class="log.type">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-msg">{{ log.msg }}</span>
            </div>
          </div>
        </div>

        <div class="debug-actions">
          <button @click="testShake">模拟摇动</button>
          <button @click="testSend">测试发送</button>
          <button @click="clearLogs">清空日志</button>
        </div>
      </div>
    </div>

    <div class="shake-content">
      <!-- 无场次 -->
      <div v-if="!currentRound" class="no-round">
        <van-empty description="暂无进行中的游戏" />
        <p class="tips">请等待主持人开启游戏</p>
      </div>

      <!-- 有场次 -->
      <template v-else>
        <!-- 奖品信息 -->
        <div class="prize-card" v-if="currentRound.prize">
          <van-image
            width="80"
            height="80"
            radius="8"
            :src="currentRound.prize.image"
            fit="cover"
          />
          <div class="prize-info">
            <h3>{{ currentRound.roundName }}</h3>
            <p>{{ currentRound.prize.name }}</p>
            <van-tag type="warning">{{
              formatPrizeLevel(currentRound.prize.level)
            }}</van-tag>
          </div>
        </div>

        <!-- 等待开始 -->
        <div v-if="gameStatus === 'idle'" class="status-box idle">
          <van-icon name="clock-o" size="64" color="#999" />
          <p>等待游戏开始</p>
          <p class="tips">游戏开始后请用力摇动手机</p>
        </div>

        <!-- 游戏进行中 -->
        <div v-else-if="gameStatus === 'playing'" class="status-box playing">
          <div class="countdown">
            <CountDown
              ref="countdownRef"
              :time="remainTime"
              large
              @change="onTimeChange"
              @finish="onGameEnd"
            />
          </div>

          <div class="score-display">
            <span class="label">我的次数</span>
            <span class="score">{{ shakeCount }}</span>
          </div>

          <div class="phone-icon" :class="{ shaking: isShaking }">
            <van-icon name="phone-o" size="48" color="#fff" />
          </div>
          <p class="tips">用力摇动手机！</p>

          <!-- 我的排名 -->
          <div v-if="myRank > 0" class="my-rank">
            当前排名：<span>第 {{ myRank }} 名</span>
          </div>
        </div>

        <!-- 实时排名 -->
        <div v-if="ranking.length" class="ranking-section">
          <div class="section-title">实时排名 TOP10</div>
          <div class="ranking-list">
            <div
              v-for="item in ranking"
              :key="item.userId"
              class="ranking-item"
              :class="{ 'is-me': item.userId === userStore.userId }"
            >
              <span class="rank" :class="'rank-' + item.rank">{{
                item.rank
              }}</span>
              <van-image
                round
                width="32"
                height="32"
                :src="item.user?.avatar"
                fit="cover"
              />
              <span class="name">{{
                item.user?.realName || item.user?.nickname
              }}</span>
              <span class="score">{{ item.score }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import CountDown from "@/components/common/CountDown.vue";
import {
  useGameStore,
  useUserStore,
  useWebSocketStore,
} from "@/store";
import { formatPrizeLevel } from "@/utils/format";
import { destroyShakeDetector, getShakeDetector } from "@/utils/shake";
import { computed, onMounted, onUnmounted, ref, reactive } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userStore = useUserStore();
const gameStore = useGameStore();
const wsStore = useWebSocketStore();

const countdownRef = ref(null);
const isShaking = ref(false);

let shakeDetector = null;
let scoreTimer = null;
let shakeTimer = null;
let rankingUnsubscribe = null;

// ============ 调试相关 ============
const debugCollapsed = ref(false);
const shakeDetectorReady = ref(false);
const sendCount = ref(0);
const lastShakeTime = ref('');
const lastSendTime = ref('');
const lastSendData = ref(null);
const lastRankingData = ref(null);
const debugLogs = ref([]);

// 添加调试日志
const addLog = (msg, type = 'info') => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  debugLogs.value.unshift({ time, msg, type });
  if (debugLogs.value.length > 10) {
    debugLogs.value.pop();
  }
};

// WebSocket 连接状态
const wsConnected = computed(() => {
  // 根据你的 wsStore 实现调整
  return wsStore.connected || wsStore.isConnected || false;
});

// 清空日志
const clearLogs = () => {
  debugLogs.value = [];
  addLog('日志已清空', 'info');
};

// 模拟摇动
const testShake = () => {
  addLog('模拟摇动触发', 'info');
  const newCount = gameStore.shakeCount + 1;
  gameStore.setShakeCount(newCount);
  triggerShakeAnimation();
  lastShakeTime.value = new Date().toLocaleTimeString();
};

// 测试发送
const testSend = () => {
  addLog('手动测试发送', 'info');
  sendScoreToServer();
};

// ============ 原有逻辑 ============

// 计算属性
const currentRound = computed(() => gameStore.currentRound);
const gameStatus = computed(() => gameStore.gameStatus);
const shakeCount = computed(() => gameStore.shakeCount);
const remainTime = computed(() => gameStore.remainTime);
const ranking = computed(() => gameStore.ranking);
const myRank = computed(() => gameStore.myRank);

// 初始化摇一摇
const initShake = async () => {
  addLog('正在初始化摇动检测器...', 'info');
  try {
    shakeDetector = getShakeDetector({
      threshold: 12,
      onShake: (count) => {
        addLog(`检测到摇动! 次数: ${count}`, 'success');
        gameStore.setShakeCount(count);
        triggerShakeAnimation();
        lastShakeTime.value = new Date().toLocaleTimeString();
      },
    });
    await shakeDetector.start();
    shakeDetectorReady.value = true;
    addLog('摇动检测器启动成功 ✓', 'success');
  } catch (error) {
    shakeDetectorReady.value = false;
    addLog(`摇动检测器启动失败: ${error.message}`, 'error');
  }
};

// 摇动动画
const triggerShakeAnimation = () => {
  isShaking.value = true;
  if (shakeTimer) clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => {
    isShaking.value = false;
  }, 200);
};

// 发送分数到服务器
const sendScoreToServer = () => {
  if (gameStore.shakeCount > 0 && gameStore.roundId) {
    const data = {
      roundId: gameStore.roundId,
      score: gameStore.shakeCount,
    };
    
    addLog(`发送数据: roundId=${data.roundId}, score=${data.score}`, 'info');
    
    try {
      wsStore.send("shake_score", data);
      sendCount.value++;
      lastSendTime.value = new Date().toLocaleTimeString();
      lastSendData.value = data;
      addLog(`发送成功 ✓ (第${sendCount.value}次)`, 'success');
    } catch (error) {
      addLog(`发送失败: ${error.message}`, 'error');
    }
  } else {
    addLog(`跳过发送: shakeCount=${gameStore.shakeCount}, roundId=${gameStore.roundId}`, 'warn');
  }
};

// 定时上报分数（通过 WebSocket）
const startScoreTimer = () => {
  addLog('启动定时上报 (500ms间隔)', 'info');
  scoreTimer = setInterval(() => {
    sendScoreToServer();
  }, 500);
};

// 监听排名更新
const subscribeRankingUpdate = () => {
  addLog('订阅排名更新...', 'info');
  rankingUnsubscribe = wsStore.subscribe("ranking_update", (data) => {
    addLog(`收到排名更新: ${data.ranking?.length || 0}条`, 'success');
    lastRankingData.value = data;
    
    if (data.roundId !== gameStore.roundId) {
      addLog(`roundId不匹配，忽略: ${data.roundId} vs ${gameStore.roundId}`, 'warn');
      return;
    }

    gameStore.updateRanking(data.ranking || []);

    const myRankItem = data.ranking?.find((r) => r.userId === userStore.userId);
    if (myRankItem) {
      gameStore.updateMyRank(myRankItem.rank);
      addLog(`我的排名: 第${myRankItem.rank}名`, 'info');
    }
  });
};

// 时间变化
const onTimeChange = (time) => {
  gameStore.updateRemainTime(time);
};

// 游戏结束
const onGameEnd = () => {
  addLog('游戏结束，最后上报分数', 'info');
  // 最后上报一次
  sendScoreToServer();

  gameStore.endGame();
  router.replace("/shake/result");
};

onMounted(() => {
  addLog('页面加载完成', 'info');
  addLog(`gameStatus: ${gameStatus.value}`, 'info');
  addLog(`roundId: ${gameStore.roundId}`, 'info');
  addLog(`userId: ${userStore.userId}`, 'info');
  
  // 如果游戏正在进行中，初始化摇一摇
  if (gameStatus.value === "playing") {
    initShake();
    startScoreTimer();
  }
  subscribeRankingUpdate();
});

onUnmounted(() => {
  addLog('页面卸载', 'info');
  if (scoreTimer) clearInterval(scoreTimer);
  if (shakeTimer) clearTimeout(shakeTimer);
  if (rankingUnsubscribe) rankingUnsubscribe();
  destroyShakeDetector();
});
</script>

<style lang="scss" scoped>
.shake-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);

  :deep(.van-nav-bar) {
    background: transparent;
    .van-nav-bar__title,
    .van-nav-bar__arrow {
      color: #fff;
    }
  }
}

/* 调试面板样式 */
.debug-panel {
  position: fixed;
  top: 46px;
  left: 0;
  right: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  font-size: 12px;
  max-height: 60vh;
  overflow-y: auto;
  
  &.collapsed {
    max-height: none;
  }
  
  .debug-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: #333;
    cursor: pointer;
    position: sticky;
    top: 0;
  }
  
  .debug-content {
    padding: 8px 12px;
  }
  
  .debug-section {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #444;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .debug-title {
    font-weight: bold;
    margin-bottom: 6px;
    color: #4fc3f7;
  }
  
  .debug-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    
    .value {
      color: #ffeb3b;
      font-weight: bold;
    }
    
    .status-ok {
      color: #4caf50;
    }
    
    .status-error {
      color: #f44336;
    }
  }
  
  .debug-data {
    background: #1a1a1a;
    padding: 6px;
    border-radius: 4px;
    max-height: 100px;
    overflow-y: auto;
    
    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-all;
      color: #aaa;
      font-size: 11px;
    }
  }
  
  .debug-logs {
    max-height: 120px;
    overflow-y: auto;
    
    .log-item {
      display: flex;
      gap: 8px;
      padding: 2px 0;
      border-bottom: 1px solid #333;
      
      &.success .log-msg { color: #4caf50; }
      &.error .log-msg { color: #f44336; }
      &.warn .log-msg { color: #ff9800; }
      &.info .log-msg { color: #aaa; }
      
      .log-time {
        color: #666;
        flex-shrink: 0;
      }
      
      .log-msg {
        word-break: break-all;
      }
    }
  }
  
  .debug-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    
    button {
      flex: 1;
      padding: 6px 8px;
      border: none;
      border-radius: 4px;
      background: #4fc3f7;
      color: #000;
      font-size: 12px;
      cursor: pointer;
      
      &:active {
        opacity: 0.8;
      }
    }
  }
}

.shake-content {
  padding: 16px;
  padding-top: 60px; /* 给调试面板留空间 */
}

.no-round {
  background: #fff;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;

  .tips {
    color: #999;
    font-size: 14px;
    margin-top: 12px;
  }
}

.prize-card {
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;

  .prize-info {
    flex: 1;
    h3 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    p {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
  }
}

.status-box {
  background: #fff;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 16px;

  p {
    font-size: 16px;
    color: #333;
    margin-top: 16px;
  }
  .tips {
    font-size: 14px;
    color: #999;
    margin-top: 8px;
  }
}

.status-box.playing {
  .countdown {
    margin-bottom: 24px;
  }

  .score-display {
    margin-bottom: 24px;
    .label {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    .score {
      font-size: 56px;
      font-weight: bold;
      color: #ff5722;
    }
  }

  .phone-icon {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #ff5722, #ff8a65);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    transition: transform 0.1s;

    &.shaking {
      animation: shake 0.2s ease-in-out;
    }
  }

  .my-rank {
    margin-top: 16px;
    font-size: 14px;
    color: #666;
    span {
      color: #ff5722;
      font-weight: bold;
    }
  }
}

@keyframes shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
}

.ranking-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;

  .section-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  .ranking-item {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &.is-me {
      background: #fff5f0;
      margin: 0 -16px;
      padding: 10px 16px;
      border-radius: 8px;
    }

    .rank {
      width: 28px;
      height: 28px;
      line-height: 28px;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      color: #999;
      margin-right: 12px;

      &.rank-1 {
        color: #f5a623;
      }
      &.rank-2 {
        color: #8e8e93;
      }
      &.rank-3 {
        color: #cd7f32;
      }
    }

    .name {
      flex: 1;
      margin-left: 10px;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .score {
      font-size: 14px;
      font-weight: bold;
      color: #ff5722;
    }
  }
}
</style>