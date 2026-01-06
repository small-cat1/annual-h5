<template>
  <div class="shake-page">
    <van-nav-bar title="摇一摇" left-arrow @click-left="$router.back()" />

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
  useActivityStore,
  useGameStore,
  useUserStore,
  useWebSocketStore,
} from "@/store";
import { formatPrizeLevel } from "@/utils/format";
import { destroyShakeDetector, getShakeDetector } from "@/utils/shake";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userStore = useUserStore();
const activityStore = useActivityStore();
const gameStore = useGameStore();
const wsStore = useWebSocketStore();

const countdownRef = ref(null);
const isShaking = ref(false);

let shakeDetector = null;
let scoreTimer = null;
let shakeTimer = null;
let rankingUnsubscribe = null;

// 计算属性
const currentRound = computed(() => gameStore.currentRound);
const gameStatus = computed(() => gameStore.gameStatus);
const shakeCount = computed(() => gameStore.shakeCount);
const remainTime = computed(() => gameStore.remainTime);
const ranking = computed(() => gameStore.ranking);
const myRank = computed(() => gameStore.myRank);

// 初始化摇一摇
const initShake = async () => {
  shakeDetector = getShakeDetector({
    threshold: 12,
    onShake: (count) => {
      gameStore.setShakeCount(count);
      triggerShakeAnimation();
    },
  });
  await shakeDetector.start();
};

// 摇动动画
const triggerShakeAnimation = () => {
  isShaking.value = true;
  if (shakeTimer) clearTimeout(shakeTimer);
  shakeTimer = setTimeout(() => {
    isShaking.value = false;
  }, 200);
};

// 定时上报分数（通过 WebSocket）
const startScoreTimer = () => {
  scoreTimer = setInterval(() => {
    if (gameStore.shakeCount > 0 && gameStore.roundId) {
      wsStore.send("shake_score", {
        roundId: gameStore.roundId,
        score: gameStore.shakeCount,
      });
    }
  }, 500);
};

// 监听排名更新
const subscribeRankingUpdate = () => {
  rankingUnsubscribe = wsStore.subscribe("ranking_update", (data) => {
    if (data.roundId !== gameStore.roundId) return;

    gameStore.updateRanking(data.ranking || []);

    const myRankItem = data.ranking?.find((r) => r.userId === userStore.userId);
    if (myRankItem) {
      gameStore.updateMyRank(myRankItem.rank);
    }
  });
};

// 时间变化
const onTimeChange = (time) => {
  gameStore.updateRemainTime(time);
};

// 游戏结束
const onGameEnd = () => {
  // 最后上报一次
  if (gameStore.shakeCount > 0 && gameStore.roundId) {
    wsStore.send("shake_score", {
      roundId: gameStore.roundId,
      score: gameStore.shakeCount,
    });
  }

  gameStore.endGame();
  router.replace("/shake/result");
};

onMounted(() => {
  // 如果游戏正在进行中，初始化摇一摇
  if (gameStatus.value === "playing") {
    initShake();
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
