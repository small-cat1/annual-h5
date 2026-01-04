<template>
  <div class="game-page">
    <!-- 背景装饰 -->
    <div class="bg-decorations">
      <div class="spotlight spotlight-1"></div>
      <div class="spotlight spotlight-2"></div>
    </div>

    <!-- 顶部标题栏 -->
    <header class="game-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span>←</span>
          返回控制台
        </button>
      </div>

      <div class="header-center">
        <img
          v-if="activityStore.config.logo"
          :src="activityStore.config.logo"
          class="activity-logo"
        />
        <span v-else class="logo-icon">🎮</span>
        <h1>{{ activityStore.config.title || "摇一摇大作战" }}</h1>
      </div>

      <div class="header-right">
        <!-- 场次选择 -->
        <div class="round-selector">
          <select
            v-model="selectedRoundId"
            class="round-select"
            :disabled="gameStatus === 1 || showCountdown"
          >
            <option value="">选择场次</option>
            <option
              v-for="round in availableRounds"
              :key="round.id"
              :value="round.id"
            >
              {{ round.roundName }}
            </option>
          </select>
        </div>

        <!-- 控制按钮组 -->
        <div class="control-btn-group">
          <!-- 未开始/已选择场次：开始按钮 -->
          <button
            v-if="gameStatus === -1 || gameStatus === 0"
            class="btn btn-gold"
            :class="{ 'btn-glow': selectedRoundId && gameStatus === 0 }"
            :disabled="!selectedRoundId || showCountdown"
            @click="showPasswordDialog = true"
          >
            <span class="btn-icon">▶️</span>
            开始游戏
          </button>

          <!-- 进行中：停止按钮 -->
          <button
            v-else-if="gameStatus === 1"
            class="btn btn-danger"
            @click="handleStop"
          >
            <span class="btn-icon">⏹️</span>
            立即结束
          </button>

          <!-- 已结束：查看名单 + 下一场 -->
          <template v-else-if="gameStatus === 2">
            <button class="btn btn-primary" @click="showWinnerModal = true">
              <span class="btn-icon">📋</span>
              中奖名单
            </button>
            <button class="btn btn-gold" @click="handleNextRound">
              <span class="btn-icon">➡️</span>
              下一场
            </button>
          </template>
        </div>

        <!-- 状态指示 / 倒计时 -->
        <div class="status-area">
          <!-- 5秒准备倒计时 -->
          <div v-if="showCountdown" class="countdown-display ready-countdown">
            <span class="countdown-value countdown-big">{{
              prepareCountdown
            }}</span>
          </div>

          <!-- 游戏进行中倒计时 -->
          <div v-else-if="gameStatus === 1" class="countdown-display">
            <div class="countdown-ring-mini">
              <svg viewBox="0 0 40 40">
                <circle class="ring-bg" cx="20" cy="20" r="18" />
                <circle
                  class="ring-progress"
                  cx="20"
                  cy="20"
                  r="18"
                  :style="{ strokeDashoffset: countdownOffset }"
                />
              </svg>
            </div>
            <span class="countdown-value">{{ remainTime }}s</span>
          </div>

          <!-- 普通状态 -->
          <span v-else class="status-tag" :class="statusClass">
            <span class="status-dot"></span>
            {{ statusText }}
          </span>
        </div>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="game-main">
      <!-- 左侧：奖品 + 排行榜 -->
      <section class="left-section">
        <!-- 奖品展示 -->
        <div class="prize-card" v-if="currentRound?.prize">
          <div class="prize-badge">本轮奖品</div>
          <div class="prize-content">
            <div class="prize-image-wrap">
              <img :src="currentRound.prize.image" class="prize-image" />
              <div class="prize-shine"></div>
            </div>
            <div class="prize-info">
              <h3 class="prize-name">{{ currentRound.prize.name }}</h3>
              <div class="prize-meta">
                <span class="meta-tag level">{{
                  getPrizeLevel(currentRound.prize.level)
                }}</span>
                <span class="meta-tag count"
                  >× {{ currentRound.winnerCount }}</span
                >
              </div>
            </div>
          </div>
          <!-- 进行中的冲刺提示 -->
          <div v-if="gameStatus === 1" class="sprint-tip">
            <span class="sprint-icon">🔥</span>
            <span>疯狂摇动中...</span>
            <span class="sprint-icon">🔥</span>
          </div>
        </div>

        <!-- 空状态奖品卡片 -->
        <div class="prize-card prize-empty" v-else>
          <div class="empty-icon">🎁</div>
          <p>请先选择游戏场次</p>
        </div>

        <!-- 实时排行榜 -->
        <div class="ranking-panel">
          <div class="panel-header">
            <span class="panel-icon">🏆</span>
            <h2>实时排行榜</h2>
            <span class="player-count" v-if="playerCount > 0">
              <span class="count-num">{{ playerCount }}</span> 人参与
            </span>
          </div>

          <div class="ranking-body">
            <!-- 排行榜列表 -->
            <div class="ranking-list" v-if="rankingList.length > 0">
              <TransitionGroup name="ranking">
                <div
                  v-for="(item, index) in rankingList"
                  :key="item.userId"
                  class="ranking-item"
                  :class="{
                    'is-winner': index < (currentRound?.winnerCount || 3),
                    'is-shaking': gameStatus === 1 && item.isActive,
                  }"
                >
                  <div class="rank-badge" :class="'rank-' + (index + 1)">
                    <span v-if="index === 0">🥇</span>
                    <span v-else-if="index === 1">🥈</span>
                    <span v-else-if="index === 2">🥉</span>
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <img
                    :src="item.user?.avatar || defaultAvatar"
                    class="ranking-avatar"
                  />
                  <div class="ranking-info">
                    <span class="ranking-name">{{
                      item.user?.realName || item.user?.nickname || "未知"
                    }}</span>
                    <span class="ranking-dept">{{
                      item.user?.department || ""
                    }}</span>
                  </div>
                  <div class="ranking-score">
                    <span
                      class="score-value"
                      :class="{ 'score-up': item.scoreUp }"
                      >{{ item.score }}</span
                    >
                    <span class="score-label">次</span>
                  </div>
                  <!-- 分数增加动画 -->
                  <div v-if="item.scoreDelta > 0" class="score-delta">
                    +{{ item.scoreDelta }}
                  </div>
                </div>
              </TransitionGroup>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <span class="empty-icon">📊</span>
              <p>{{ currentRound ? "等待玩家参与..." : "请先选择场次" }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：弹幕面板 -->
      <section class="right-section">
        <DanmakuPanel
          :activity-id="activityStore.activityId"
          :limit="50"
          :poll-interval="2000"
          class="danmaku-full"
        />
      </section>
    </main>

    <!-- 密码输入弹窗 -->
    <Teleport to="body">
      <div
        class="modal-overlay"
        v-if="showPasswordDialog"
        @click.self="showPasswordDialog = false"
      >
        <div class="modal modal-password">
          <div class="modal-header">
            <h3>🔐 输入场次密码</h3>
            <button class="modal-close" @click="showPasswordDialog = false">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>场次密码</label>
              <input
                type="password"
                v-model="password"
                placeholder="请输入场次密码"
                @keyup.enter="handleStart"
                autofocus
              />
            </div>
            <p class="form-tip">密码由管理员在后台设置</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showPasswordDialog = false">
              取消
            </button>
            <button
              class="btn btn-gold"
              @click="handleStart"
              :disabled="!password || startLoading"
            >
              {{ startLoading ? "验证中..." : "确认开始" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 中奖名单弹窗 -->
    <Teleport to="body">
      <div
        class="modal-overlay"
        v-if="showWinnerModal"
        @click.self="showWinnerModal = false"
      >
        <div class="modal modal-winners">
          <div class="modal-header">
            <h3>🏆 {{ currentRound?.roundName }} - 中奖名单</h3>
            <button class="modal-close" @click="showWinnerModal = false">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div class="winner-prize-info" v-if="currentRound?.prize">
              <img :src="currentRound.prize.image" class="winner-prize-img" />
              <span class="winner-prize-name">{{
                currentRound.prize.name
              }}</span>
            </div>
            <div class="winner-list-full">
              <div
                v-for="(winner, index) in winners"
                :key="winner.userId"
                class="winner-row"
              >
                <span class="winner-rank" :class="'rank-' + (index + 1)">{{
                  index + 1
                }}</span>
                <img
                  :src="winner.user?.avatar || defaultAvatar"
                  class="winner-avatar"
                />
                <div class="winner-info">
                  <span class="winner-name">{{
                    winner.user?.realName || winner.user?.nickname
                  }}</span>
                  <span class="winner-dept">{{
                    winner.user?.department || ""
                  }}</span>
                </div>
                <span class="winner-score">{{ winner.score }} 次</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="showWinnerModal = false">
              确定
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 游戏结束庆祝弹窗 -->
    <Teleport to="body">
      <div
        class="modal-overlay celebration-overlay"
        v-if="showCelebration"
        @click.self="closeCelebration"
      >
        <div class="celebration-content">
          <div class="confetti-container">
            <div
              v-for="i in 50"
              :key="i"
              class="confetti"
              :style="getConfettiStyle(i)"
            ></div>
          </div>
          <div class="celebration-main">
            <div class="celebration-icon">🎉</div>
            <h2>游戏结束!</h2>
            <p>恭喜以下 {{ winners.length }} 位幸运儿获奖</p>
            <div class="winner-showcase">
              <div
                v-for="(winner, index) in winners.slice(0, 5)"
                :key="winner.userId"
                class="winner-card"
                :style="{ animationDelay: index * 0.15 + 's' }"
              >
                <div class="winner-rank-badge">{{ index + 1 }}</div>
                <img
                  :src="winner.user?.avatar || defaultAvatar"
                  class="winner-avatar"
                />
                <span class="winner-name">{{
                  winner.user?.realName || winner.user?.nickname
                }}</span>
                <span class="winner-score">{{ winner.score }}次</span>
              </div>
            </div>
            <div class="celebration-actions">
              <button class="btn btn-gold btn-large" @click="closeCelebration">
                查看完整名单
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { closeCheckIn } from "@/api/console/checkin";
import {
  getCurrentRound,
  getGameStatus,
  getRanking,
  getRoundList,
  getWinners,
  startGame,
  stopGame,
} from "@/api/console/game";
import DanmakuPanel from "@/components/DanmakuPanel.vue";
import { useActivityStore } from "@/store/modules/activity";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const activityStore = useActivityStore();

const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";

// 场次相关
const roundList = ref([]);
const selectedRoundId = ref("");
const currentRound = ref(null);

// 游戏状态 -1:未选择 0:已选择待开始 1:进行中 2:已结束
const gameStatus = ref(-1);
const playerCount = ref(0);
const remainTime = ref(0);
const totalTime = ref(30);

// 5秒准备倒计时
const showCountdown = ref(false);
const prepareCountdown = ref(5);

// 排行榜与中奖
const rankingList = ref([]);
const prevRankingMap = ref({});
const winners = ref([]);

// 弹窗
const showPasswordDialog = ref(false);
const showWinnerModal = ref(false);
const showCelebration = ref(false);
const password = ref("");
const startLoading = ref(false);

// 定时器
let pollTimer = null;
let countdownTimer = null;

// 可选场次（未结束的）
const availableRounds = computed(() => {
  return roundList.value.filter((r) => r.status !== 2);
});

// 状态样式
const statusClass = computed(() => {
  const map = {
    "-1": "",
    0: "is-ready",
    1: "is-playing",
    2: "is-finished",
  };
  return map[gameStatus.value] || "";
});

// 状态文字
const statusText = computed(() => {
  const map = {
    "-1": "选择场次",
    0: "准备就绪",
    1: "进行中",
    2: "已结束",
  };
  return map[gameStatus.value] || "未知";
});

// 倒计时环进度
const countdownOffset = computed(() => {
  const circumference = 2 * Math.PI * 18;
  const progress = remainTime.value / totalTime.value;
  return circumference * (1 - progress);
});

// 获取奖品等级名称
const getPrizeLevel = (level) => {
  const map = {
    1: "特等奖",
    2: "一等奖",
    3: "二等奖",
    4: "三等奖",
    5: "参与奖",
  };
  return map[level] || "奖品";
};

// 彩带样式
const getConfettiStyle = (i) => {
  const colors = [
    "#ffd700",
    "#e63946",
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
  ];
  return {
    left: Math.random() * 100 + "%",
    backgroundColor: colors[i % colors.length],
    animationDelay: Math.random() * 3 + "s",
    animationDuration: Math.random() * 2 + 2 + "s",
  };
};

// 获取场次列表
const fetchRoundList = async () => {
  try {
    const res = await getRoundList(activityStore.activityId);
    if (res.code === 0) {
      roundList.value = res.data?.list || [];
    }
  } catch (e) {
    console.error("获取场次列表失败", e);
  }
};

// 检查是否有进行中的场次（页面刷新恢复状态）
const checkCurrentRound = async () => {
  try {
    const res = await getCurrentRound(activityStore.activityId);
    if (res.code === 0 && res.data?.round) {
      // 有进行中的场次，恢复状态
      currentRound.value = res.data.round;
      selectedRoundId.value = res.data.round.id;
      gameStatus.value = res.data.status;
      remainTime.value = res.data.remaining || 0;
      totalTime.value = res.data.round.duration || 30;

      if (res.data.ranking) {
        rankingList.value = res.data.ranking;
      }

      // 如果游戏进行中，开始轮询
      if (res.data.status === 1) {
        startPolling();
      }

      return true;
    }
    return false;
  } catch (e) {
    console.error("检查当前场次失败", e);
    return false;
  }
};

// 获取游戏状态
const fetchGameStatus = async () => {
  if (!currentRound.value) return;

  try {
    const res = await getGameStatus(currentRound.value.id);
    if (res.code === 0) {
      const data = res.data;
      const prevStatus = gameStatus.value;
      gameStatus.value = data.status;
      playerCount.value = data.playerCount || 0;
      remainTime.value = data.remaining || 0;

      // 游戏刚结束
      if (data.status === 2 && prevStatus === 1) {
        await fetchWinners();
        showCelebration.value = true;
        stopPolling();
      }
    }
  } catch (e) {
    console.error("获取游戏状态失败", e);
  }
};

// 获取排行榜（带分数变化动画）
const fetchRanking = async () => {
  if (!currentRound.value) return;

  try {
    const res = await getRanking(currentRound.value.id, 20);
    if (res.code === 0) {
      const newList = res.data?.list || [];

      // 计算分数变化
      newList.forEach((item) => {
        const prev = prevRankingMap.value[item.userId];
        if (prev) {
          const delta = item.score - prev.score;
          item.scoreDelta = delta > 0 ? delta : 0;
          item.scoreUp = delta > 0;
          item.isActive = delta > 0;
        } else {
          item.scoreDelta = 0;
          item.scoreUp = false;
          item.isActive = true;
        }

        setTimeout(() => {
          item.scoreUp = false;
          item.scoreDelta = 0;
        }, 500);
      });

      prevRankingMap.value = {};
      newList.forEach((item) => {
        prevRankingMap.value[item.userId] = { score: item.score };
      });

      rankingList.value = newList;

      if (res.data?.playerCount !== undefined) {
        playerCount.value = res.data.playerCount;
      }
    }
  } catch (e) {
    console.error("获取排行榜失败", e);
  }
};

// 获取中奖名单
const fetchWinners = async () => {
  if (!currentRound.value) return;

  try {
    const res = await getWinners(currentRound.value.id);
    if (res.code === 0) {
      winners.value = res.data?.list || [];
    }
  } catch (e) {
    console.error("获取中奖名单失败", e);
  }
};

// 开始游戏
const handleStart = async () => {
  if (!password.value || startLoading.value) return;

  startLoading.value = true;
  try {
    const res = await startGame(currentRound.value.id, password.value);
    if (res.code === 0) {
      showPasswordDialog.value = false;
      password.value = "";

      // 关闭签到
      try {
        await closeCheckIn(activityStore.activityId);
      } catch (e) {
        console.warn("关闭签到失败", e);
      }

      // 开始5秒倒计时
      startPrepareCountdown();
    } else {
      alert(res.msg || "密码错误");
    }
  } catch (e) {
    console.error("开始游戏失败", e);
    alert("开始游戏失败");
  } finally {
    startLoading.value = false;
  }
};

// 5秒准备倒计时
const startPrepareCountdown = () => {
  showCountdown.value = true;
  prepareCountdown.value = 5;

  countdownTimer = setInterval(() => {
    prepareCountdown.value--;
    if (prepareCountdown.value <= 0) {
      clearInterval(countdownTimer);
      showCountdown.value = false;

      // 正式开始游戏
      gameStatus.value = 1;
      remainTime.value = totalTime.value;
      startPolling();
    }
  }, 1000);
};

// 停止游戏
const handleStop = async () => {
  if (!confirm("确定要立即结束游戏吗？")) return;

  try {
    const res = await stopGame(currentRound.value.id);
    if (res.code === 0) {
      gameStatus.value = 2;
      stopPolling();
      if (res.data?.winners) {
        winners.value = res.data.winners;
      } else {
        await fetchWinners();
      }
      showCelebration.value = true;
    }
  } catch (e) {
    console.error("停止游戏失败", e);
  }
};

// 下一场
const handleNextRound = () => {
  resetGame();
  fetchRoundList();
};

// 重置游戏状态
const resetGame = () => {
  stopPolling();
  currentRound.value = null;
  gameStatus.value = -1;
  selectedRoundId.value = "";
  rankingList.value = [];
  winners.value = [];
  prevRankingMap.value = {};
  playerCount.value = 0;
};

// 关闭庆祝弹窗
const closeCelebration = () => {
  showCelebration.value = false;
  showWinnerModal.value = true;
};

// 开始轮询
const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(() => {
    fetchGameStatus();
    if (gameStatus.value === 1) {
      fetchRanking();
    }
  }, 1000);
};

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

// 返回
const goBack = () => {
  router.push("/screen");
};

// 监听场次选择变化
watch(selectedRoundId, (newId) => {
  if (newId && gameStatus.value === -1) {
    const round = roundList.value.find((r) => r.id === Number(newId));
    if (round) {
      currentRound.value = round;
      totalTime.value = round.duration || 30;
      gameStatus.value = 0; // 已选择，待开始
    }
  }
});

// 初始化
onMounted(async () => {
  // 确保活动配置已加载
  if (!activityStore.isReady) {
    await activityStore.init();
  }

  // 获取场次列表
  await fetchRoundList();

  // 检查是否有进行中的场次（恢复状态）
  await checkCurrentRound();
});

// 清理
onUnmounted(() => {
  stopPolling();
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style lang="scss" scoped>
// 主题色变量
$primary-red: #e63946;
$primary-gold: #ffd700;
$dark-red: #9b1b30;
$bg-card: rgba(40, 15, 15, 0.95);
$text-light: #fff5e6;
$text-gold: #ffd700;

.game-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0505 0%, #1a0a0a 50%, #150808 100%);
  color: $text-light;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.bg-decorations {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.spotlight {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;

  &.spotlight-1 {
    top: -150px;
    left: 10%;
    background: $primary-red;
    animation: float-slow 10s ease-in-out infinite;
  }

  &.spotlight-2 {
    bottom: -150px;
    right: 10%;
    background: $primary-gold;
    animation: float-slow 12s ease-in-out infinite reverse;
  }
}

@keyframes float-slow {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(40px, 30px);
  }
}

// 顶部标题栏
.game-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 24px;
  background: linear-gradient(
    to right,
    rgba(154, 27, 48, 0.85),
    rgba(40, 15, 15, 0.85)
  );
  border-bottom: 2px solid rgba(255, 215, 0, 0.2);
  backdrop-filter: blur(10px);
}

.header-left {
  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(-3px);
    }
  }
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;

  .activity-logo {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: contain;
  }

  .logo-icon {
    font-size: 28px;
  }

  h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    background: linear-gradient(135deg, #fff, $primary-gold);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    white-space: nowrap;
  }
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

// 场次选择器
.round-selector {
  .round-select {
    padding: 10px 36px 10px 16px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23ffd700' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 20px;
    min-width: 140px;

    &:focus {
      outline: none;
      border-color: $primary-gold;
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    option {
      background: #1a0a0a;
      color: #fff;
    }
  }
}

.control-btn-group {
  display: flex;
  gap: 8px;
}

// 状态区域
.status-area {
  min-width: 100px;
  display: flex;
  justify-content: center;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(230, 57, 70, 0.2);
  border: 1px solid rgba(230, 57, 70, 0.4);
  border-radius: 20px;

  &.ready-countdown {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.4);

    .countdown-big {
      font-size: 28px;
      animation: pulse-big 1s ease-in-out infinite;
    }
  }

  .countdown-ring-mini {
    width: 32px;
    height: 32px;

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);

      .ring-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 3;
      }
      .ring-progress {
        fill: none;
        stroke: $primary-gold;
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 113.1;
        transition: stroke-dashoffset 1s linear;
      }
    }
  }

  .countdown-value {
    font-size: 18px;
    font-weight: 700;
    color: $primary-gold;
    min-width: 40px;
  }
}

@keyframes pulse-big {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(100, 100, 100, 0.2);

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #888;
  }

  &.is-ready {
    background: rgba(255, 167, 38, 0.2);
    color: #ffa726;
    .status-dot {
      background: #ffa726;
    }
  }
  &.is-playing {
    background: rgba(76, 175, 80, 0.2);
    color: #66bb6a;
    .status-dot {
      background: #66bb6a;
      animation: pulse 0.5s infinite;
    }
  }
  &.is-finished {
    background: rgba(158, 158, 158, 0.2);
    color: #bdbdbd;
    .status-dot {
      background: #9e9e9e;
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}

// 主体内容
.game-main {
  position: relative;
  z-index: 10;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px 24px;
  height: calc(100vh - 70px);
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

// 奖品卡片
.prize-card {
  background: linear-gradient(
    135deg,
    rgba(255, 215, 0, 0.1),
    rgba(40, 15, 15, 0.9)
  );
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 16px;
  padding: 16px 20px;
  position: relative;
  overflow: hidden;

  .prize-badge {
    position: absolute;
    top: 0;
    right: 20px;
    padding: 4px 12px;
    background: linear-gradient(135deg, $primary-gold, #ffaa00);
    color: #1a0a0a;
    font-size: 12px;
    font-weight: 600;
    border-radius: 0 0 8px 8px;
  }

  .prize-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .prize-image-wrap {
    position: relative;
    flex-shrink: 0;

    .prize-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 12px;
      border: 2px solid rgba(255, 215, 0, 0.3);
    }

    .prize-shine {
      position: absolute;
      inset: -3px;
      border-radius: 15px;
      background: linear-gradient(
        135deg,
        transparent 40%,
        rgba(255, 215, 0, 0.4) 50%,
        transparent 60%
      );
      background-size: 200% 200%;
      animation: shine 2s linear infinite;
    }
  }

  .prize-info {
    flex: 1;
    .prize-name {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px;
      color: $text-gold;
    }
    .prize-meta {
      display: flex;
      gap: 8px;
    }
    .meta-tag {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      &.level {
        background: rgba(230, 57, 70, 0.2);
        color: #ff6b6b;
      }
      &.count {
        background: rgba(255, 215, 0, 0.2);
        color: $primary-gold;
      }
    }
  }

  .sprint-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 215, 0, 0.1);
    font-size: 14px;
    color: #ff6b6b;
    animation: sprint-pulse 0.5s ease-in-out infinite;
    .sprint-icon {
      animation: fire-dance 0.3s ease-in-out infinite alternate;
    }
  }

  &.prize-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    opacity: 0.6;
    .empty-icon {
      font-size: 40px;
      margin-bottom: 8px;
    }
    p {
      margin: 0;
      font-size: 14px;
    }
  }
}

@keyframes shine {
  0% {
    background-position: -100% -100%;
  }
  100% {
    background-position: 200% 200%;
  }
}
@keyframes sprint-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
@keyframes fire-dance {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(-2px) scale(1.1);
  }
}

// 排行榜面板
.ranking-panel {
  flex: 1;
  background: $bg-card;
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    background: linear-gradient(
      to right,
      rgba(154, 27, 48, 0.4),
      rgba(40, 15, 15, 0.4)
    );
    border-bottom: 1px solid rgba(255, 215, 0, 0.1);
    flex-shrink: 0;
    .panel-icon {
      font-size: 18px;
    }
    h2 {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      flex: 1;
      color: $text-gold;
    }
    .player-count {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      .count-num {
        font-weight: 700;
        color: $primary-gold;
      }
    }
  }

  .ranking-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid transparent;
  transition: all 0.3s;
  position: relative;

  &.is-winner {
    background: linear-gradient(
      135deg,
      rgba(255, 215, 0, 0.1),
      rgba(255, 215, 0, 0.05)
    );
    border-color: rgba(255, 215, 0, 0.3);
  }
  &.is-shaking {
    animation: shake-item 0.3s ease-in-out;
  }

  .rank-badge {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
    &.rank-1 {
      background: linear-gradient(135deg, #ffd700, #ffaa00);
      color: #1a0a0a;
    }
    &.rank-2 {
      background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
      color: #1a0a0a;
    }
    &.rank-3 {
      background: linear-gradient(135deg, #cd7f32, #b8860b);
      color: #fff;
    }
  }

  .ranking-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 215, 0, 0.2);
    flex-shrink: 0;
  }
  .ranking-info {
    flex: 1;
    min-width: 0;
    .ranking-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ranking-dept {
      display: block;
      font-size: 11px;
      opacity: 0.6;
    }
  }
  .ranking-score {
    display: flex;
    align-items: baseline;
    gap: 3px;
    flex-shrink: 0;
    .score-value {
      font-size: 20px;
      font-weight: 700;
      color: $primary-gold;
      transition: transform 0.2s;
      &.score-up {
        animation: score-bounce 0.3s ease-out;
        color: #ff6b6b;
      }
    }
    .score-label {
      font-size: 11px;
      opacity: 0.6;
    }
  }
  .score-delta {
    position: absolute;
    right: 50px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    font-weight: 700;
    color: #4caf50;
    animation: delta-fly 0.5s ease-out forwards;
  }
}

@keyframes shake-item {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
@keyframes score-bounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes delta-fly {
  0% {
    opacity: 1;
    transform: translateY(-50%);
  }
  100% {
    opacity: 0;
    transform: translateY(-100%);
  }
}

.ranking-move,
.ranking-enter-active,
.ranking-leave-active {
  transition: all 0.4s ease;
}
.ranking-enter-from,
.ranking-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.right-section {
  min-height: 0;
  .danmaku-full {
    height: 100%;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  opacity: 0.6;
  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }
  p {
    font-size: 14px;
    margin: 0;
  }
}

// 按钮样式
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  .btn-icon {
    font-size: 16px;
  }
  &.btn-primary {
    background: linear-gradient(135deg, $primary-red, $dark-red);
    color: #fff;
  }
  &.btn-gold {
    background: linear-gradient(135deg, $primary-gold, #ffaa00);
    color: #1a0a0a;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    &:hover {
      box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
    }
  }
  &.btn-danger {
    background: linear-gradient(135deg, #ff4444, #cc0000);
    color: #fff;
  }
  &.btn-outline {
    background: transparent;
    border: 1px solid rgba(255, 215, 0, 0.4);
    color: $primary-gold;
  }
  &.btn-large {
    padding: 14px 28px;
    font-size: 16px;
  }
  &.btn-glow {
    animation: btn-glow 2s ease-in-out infinite;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes btn-glow {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 24px rgba(255, 215, 0, 0.6),
      0 0 40px rgba(255, 215, 0, 0.2);
  }
}

// 弹窗样式
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: linear-gradient(135deg, #2d1515, #1a0a0a);
  border-radius: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  min-width: 380px;
  max-width: 90vw;
  animation: slideUp 0.3s;
  &.modal-winners {
    min-width: 480px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
  h3 {
    font-size: 17px;
    font-weight: 600;
    margin: 0;
    color: $primary-gold;
  }
  .modal-close {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}
.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 215, 0, 0.1);
}

.form-group {
  margin-bottom: 16px;
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }
  input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 215, 0, 0.2);
    border-radius: 10px;
    color: #fff;
    font-size: 15px;
    &:focus {
      outline: none;
      border-color: $primary-gold;
    }
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}
.form-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.winner-prize-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 12px;
  .winner-prize-img {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    object-fit: cover;
  }
  .winner-prize-name {
    font-size: 16px;
    font-weight: 600;
    color: $primary-gold;
  }
}

.winner-list-full {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 350px;
  overflow-y: auto;
  .winner-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    .winner-rank {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      &.rank-1 {
        background: linear-gradient(135deg, #ffd700, #ffaa00);
        color: #1a0a0a;
      }
      &.rank-2 {
        background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
        color: #1a0a0a;
      }
      &.rank-3 {
        background: linear-gradient(135deg, #cd7f32, #b8860b);
        color: #fff;
      }
    }
    .winner-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    .winner-info {
      flex: 1;
      min-width: 0;
      .winner-name {
        display: block;
        font-size: 14px;
      }
      .winner-dept {
        display: block;
        font-size: 11px;
        opacity: 0.6;
      }
    }
    .winner-score {
      font-size: 14px;
      color: $primary-gold;
      font-weight: 500;
    }
  }
}

// 庆祝弹窗
.celebration-overlay {
  background: rgba(0, 0, 0, 0.9);
}
.celebration-content {
  position: relative;
  text-align: center;
}
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  .confetti {
    position: absolute;
    top: -10px;
    width: 10px;
    height: 10px;
    animation: confetti-fall linear infinite;
  }
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.celebration-main {
  position: relative;
  z-index: 1;
  .celebration-icon {
    font-size: 80px;
    display: block;
    margin-bottom: 16px;
    animation: celebrate 1s ease-in-out infinite;
  }
  h2 {
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 8px;
    background: linear-gradient(135deg, $primary-gold, #fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  p {
    font-size: 15px;
    opacity: 0.8;
    margin-bottom: 24px;
  }
}
@keyframes celebrate {
  0%,
  100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.1) rotate(-5deg);
  }
  75% {
    transform: scale(1.1) rotate(5deg);
  }
}

.winner-showcase {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  .winner-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    background: rgba(255, 215, 0, 0.1);
    border: 1px solid rgba(255, 215, 0, 0.3);
    border-radius: 16px;
    animation: pop-in 0.5s ease-out backwards;
    .winner-rank-badge {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, $primary-gold, #ffaa00);
      color: #1a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
    }
    .winner-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid $primary-gold;
    }
    .winner-name {
      font-size: 14px;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .winner-score {
      font-size: 12px;
      color: $primary-gold;
    }
  }
}
@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.celebration-actions {
  .btn {
    min-width: 180px;
  }
}

// 响应式
@media (max-width: 1200px) {
  .game-main {
    grid-template-columns: 1fr;
  }
  .right-section {
    display: none;
  }
}
@media (max-width: 768px) {
  .game-header {
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 16px;
    .header-center {
      order: -1;
      width: 100%;
      justify-content: center;
    }
    .header-right {
      width: 100%;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
  .modal {
    min-width: 90vw;
  }
}
</style>
