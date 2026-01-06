<template>
  <div class="shake-page">
    <van-nav-bar title="摇一摇" left-arrow @click-left="$router.back()" />

    <!-- iOS 授权弹窗 -->
    <van-overlay :show="showPermissionModal" @click="() => {}">
      <div class="permission-modal">
        <div class="modal-icon">📱</div>
        <h3>需要传感器权限</h3>
        <p>摇一摇游戏需要使用手机的运动传感器，请点击下方按钮授权</p>
        <van-button type="primary" block round @click="handlePermissionClick">
          允许使用传感器
        </van-button>
        <p class="tips">点击后请在系统弹窗中选择"允许"</p>
      </div>
    </van-overlay>

    <!-- 调试面板 - 上线时删除这一行即可 -->
    <DebugPanel v-bind="debugProps" />

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
import DebugPanel from "@/components/common/DebugPanel.vue";
import { useGameStore, useUserStore, useWebSocketStore } from "@/store";
import { formatPrizeLevel } from "@/utils/format";
import { destroyShakeDetector, getShakeDetector } from "@/utils/shake";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
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

// ============ 调试相关（独立封装） ============
const debugLogs = ref([]);
const debugStates = reactive({
  "📱 权限": {},
  "🎮 游戏": {},
  "🌐 网络": {},
});
const debugActions = ref([]);

const debug = {
  log(msg, type = "info") {
    const now = new Date();
    const time = `${now.getMinutes()}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
    debugLogs.value.unshift({ time, msg, type });
    if (debugLogs.value.length > 15) debugLogs.value.pop();
    console.log(`[Shake] [${type}] ${msg}`);
  },
  setState(section, key, value) {
    if (debugStates[section]) {
      debugStates[section][key] = value;
    }
  },
};

// 传递给 DebugPanel 的 props
const debugProps = computed(() => ({
  enabled: true, // 上线时改为 false 或删除组件
  logs: debugLogs.value,
  states: debugStates,
  actions: debugActions.value,
}));

// 注册调试按钮
debugActions.value = [
  {
    label: "模拟摇动",
    handler: () => {
      debug.log("模拟摇动", "info");
      gameStore.setShakeCount(gameStore.shakeCount + 1);
      triggerShakeAnimation();
    },
  },
  {
    label: "测试发送",
    handler: () => {
      debug.log("手动发送", "info");
      sendScoreToServer();
    },
  },
  {
    label: "清空日志",
    handler: () => {
      debugLogs.value = [];
      debug.log("日志已清空", "info");
    },
  },
];

// ============ 权限相关 ============
const showPermissionModal = ref(false);
const permissionStatus = ref("unknown");
const shakeDetectorReady = ref(false);

const needsPermission = () => {
  return (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  );
};

const checkPermissionStatus = () => {
  if (!("DeviceMotionEvent" in window)) return "unsupported";
  if (!needsPermission()) return "granted";
  return "unknown";
};

const handlePermissionClick = async () => {
  debug.log("用户点击授权按钮", "info");

  if (needsPermission()) {
    try {
      const permission = await DeviceMotionEvent.requestPermission();
      debug.log(
        `权限结果: ${permission}`,
        permission === "granted" ? "success" : "error"
      );
      permissionStatus.value = permission;
      debug.setState("📱 权限", "状态", permission);

      if (permission === "granted") {
        showPermissionModal.value = false;
        await initShake();
      }
    } catch (error) {
      debug.log(`授权异常: ${error.message}`, "error");
      permissionStatus.value = "denied";
      debug.setState("📱 权限", "状态", "denied");
    }
  } else {
    permissionStatus.value = "granted";
    debug.setState("📱 权限", "状态", "granted");
    showPermissionModal.value = false;
    await initShake();
  }
};

// ============ 业务逻辑 ============
const currentRound = computed(() => gameStore.currentRound);
const gameStatus = computed(() => gameStore.gameStatus);
const shakeCount = computed(() => gameStore.shakeCount);
const remainTime = computed(() => gameStore.remainTime);
const ranking = computed(() => gameStore.ranking);
const myRank = computed(() => gameStore.myRank);

const initShake = async () => {
  debug.log("初始化摇动检测器...", "info");

  try {
    shakeDetector = getShakeDetector({
      threshold: 12,
      onShake: (count) => {
        debug.log(`摇动! 次数: ${count}`, "success");
        gameStore.setShakeCount(count);
        triggerShakeAnimation();
        debug.setState("🎮 游戏", "摇动次数", count);
      },
      onDebug: (msg, type) => debug.log(msg, type),
    });

    await shakeDetector.start();
    shakeDetectorReady.value = true;
    debug.log("检测器启动成功 ✓", "success");
    debug.setState("📱 权限", "检测器", "已启动");
  } catch (error) {
    shakeDetectorReady.value = false;
    debug.log(`启动失败: ${error.message}`, "error");
    debug.setState("📱 权限", "检测器", "启动失败");
  }
};

const triggerShakeAnimation = () => {
  isShaking.value = true;
  if (shakeTimer) clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => {
    isShaking.value = false;
  }, 200);
};

const sendScoreToServer = () => {
  if (gameStore.shakeCount > 0 && gameStore.roundId) {
    const data = { roundId: gameStore.roundId, score: gameStore.shakeCount };
    try {
      wsStore.send("shake_score", data);
      debug.log(`发送成功: score=${data.score}`, "success");
    } catch (error) {
      debug.log(`发送失败: ${error.message}`, "error");
    }
  }
};

const startScoreTimer = () => {
  debug.log("启动定时上报", "info");
  scoreTimer = setInterval(sendScoreToServer, 500);
};

const subscribeRankingUpdate = () => {
  rankingUnsubscribe = wsStore.subscribe("ranking_update", (data) => {
    if (data.roundId !== gameStore.roundId) return;
    gameStore.updateRanking(data.ranking || []);
    const myRankItem = data.ranking?.find((r) => r.userId === userStore.userId);
    if (myRankItem) {
      gameStore.updateMyRank(myRankItem.rank);
      debug.setState("🎮 游戏", "我的排名", `第${myRankItem.rank}名`);
    }
  });
};

const onTimeChange = (time) => gameStore.updateRemainTime(time);

const onGameEnd = () => {
  debug.log("游戏结束", "info");
  sendScoreToServer();
  gameStore.endGame();
  router.replace("/shake/result");
};

// ============ 生命周期 ============
onMounted(async () => {
  debug.log("页面加载", "info");
  debug.setState("📱 权限", "HTTPS", window.location.protocol === "https:");
  debug.setState("📱 权限", "需要授权", needsPermission());
  debug.setState(
    "🌐 网络",
    "WebSocket",
    wsStore.connected ? "已连接" : "未连接"
  );
  debug.setState("🎮 游戏", "roundId", gameStore.roundId || "无");
  debug.setState("🎮 游戏", "摇动次数", 0);

  const status = checkPermissionStatus();
  permissionStatus.value = status;
  debug.setState("📱 权限", "状态", status);

  if (gameStatus.value === "playing") {
    if (status === "granted") {
      await initShake();
    } else if (status === "unknown" && needsPermission()) {
      showPermissionModal.value = true;
    }
    startScoreTimer();
  }

  subscribeRankingUpdate();
});

onUnmounted(() => {
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

.permission-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  background: #fff;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;

  .modal-icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  h3 {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
    color: #333;
  }
  p {
    font-size: 14px;
    color: #666;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  .tips {
    font-size: 12px;
    color: #999;
    margin-top: 16px;
    margin-bottom: 0;
  }
  :deep(.van-button) {
    background: linear-gradient(135deg, #ff5722, #ff8a65);
    border: none;
  }
}

.shake-content {
  padding: 16px;
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
