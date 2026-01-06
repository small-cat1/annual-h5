<template>
  <div class="result-page" :class="{ 'is-winner': isWinner }">
    <van-nav-bar title="游戏结果" left-arrow @click-left="goHome" />

    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <van-loading size="48" />
      <p>加载中...</p>
    </div>

    <div v-else class="result-content">
      <!-- 中奖 -->
      <div v-if="isWinner" class="winner-box">
        <div class="trophy">🏆</div>
        <h1>恭喜获奖！</h1>
        <div class="prize-info" v-if="winPrize">
          <van-image
            width="120"
            height="120"
            radius="12"
            :src="winPrize.image"
            fit="cover"
          />
          <h3>{{ winPrize.name }}</h3>
        </div>
        <div class="score-info">
          <p>
            摇动次数：<span>{{ myScore }}</span> 次
          </p>
          <p>
            最终排名：<span>第 {{ myRank }} 名</span>
          </p>
        </div>
        <van-button type="primary" block round @click="viewPrize">
          查看我的奖品
        </van-button>
      </div>

      <!-- 未中奖 -->
      <div v-else class="loser-box">
        <div class="emoji">💪</div>
        <h1>继续加油！</h1>
        <p class="tips">很遗憾，本轮未能获奖</p>
        <div class="score-info">
          <p>
            摇动次数：<span>{{ myScore }}</span> 次
          </p>
          <p>
            最终排名：<span>第 {{ myRank }} 名</span>
          </p>
        </div>
        <p class="encourage">下一轮还有机会，请继续参与！</p>
        <van-button type="primary" block round @click="goHome">
          返回首页
        </van-button>
      </div>

      <!-- 排行榜 -->
      <div class="ranking-section">
        <div class="section-header">
          <span class="title">本轮排行榜</span>
        </div>
        <div class="ranking-list">
          <div
            v-for="(item, index) in ranking"
            :key="item.userId"
            class="ranking-item"
            :class="{
              'is-me': item.userId == userId,
              'is-winner': index < winnerCount,
            }"
          >
            <span class="rank">{{ formatRank(index + 1) }}</span>
            <van-image
              round
              width="32"
              height="32"
              :src="item.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <span class="name">{{
              item.user?.realName || item.user?.nickname || "未知"
            }}</span>
            <span class="score">{{ item.score }} 次</span>
            <van-tag v-if="index < winnerCount" type="danger" size="small">
              获奖
            </van-tag>
          </div>
        </div>
        <van-empty v-if="ranking.length === 0" description="暂无数据" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { getRoundResult } from "@/api/shake";
import { useGameDispatcher } from "@/composables/useGameDispatcher";
import { useGameStore, useUserStore } from "@/store";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const gameStore = useGameStore();
const userStore = useUserStore();
const gameDispatcher = useGameDispatcher();

const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";
const userId = userStore.userId;

// 状态
const loading = ref(true);
const ranking = ref([]);
const myRank = ref(0);
const myScore = ref(0);
const isWinner = ref(false);
const winPrize = ref(null);
const winnerCount = ref(3);

// 格式化排名
const formatRank = (rank) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return rank;
};

// 跳转
const viewPrize = () => {
  // 重置状态，准备下一场
  gameDispatcher.resetForNextRound();
  router.push("/prize");
};

const goHome = () => {
  // 重置状态，准备下一场
  gameDispatcher.resetForNextRound();
  router.replace("/");
};

// 获取结果
const fetchResult = async () => {
  // 优先从 gameStore 获取 roundId
  const roundId = gameStore.roundId;

  if (!roundId) {
    loading.value = false;
    return;
  }

  try {
    // 从 gameStore 获取场次信息
    winnerCount.value = gameStore.winnerCount || 3;
    winPrize.value = gameStore.prize;

    // 获取结果
    const res = await getRoundResult(roundId);
    if (res.code === 0 && res.data) {
      ranking.value = res.data.ranking || [];
      myRank.value = res.data.myRank || 0;
      myScore.value = gameStore.shakeCount || 0;
      isWinner.value = res.data.isWinner || false;

      // 如果中奖，获取奖品信息
      if (res.data.winInfo) {
        winPrize.value = res.data.winInfo.prize;
      }
    }
  } catch (error) {
    console.error("获取结果失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchResult();
});
</script>

<style lang="scss" scoped>
.result-page {
  min-height: 100vh;
  background: #f5f5f5;

  &.is-winner {
    background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);

    :deep(.van-nav-bar) {
      background: transparent;

      .van-nav-bar__title,
      .van-nav-bar__arrow {
        color: #fff;
      }
    }
  }
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;

  p {
    margin-top: 16px;
    color: #666;
  }
}

.result-content {
  padding: 20px 16px;
}

.winner-box,
.loser-box {
  background: #fff;
  border-radius: 16px;
  padding: 40px 24px;
  text-align: center;
  margin-bottom: 16px;

  .trophy,
  .emoji {
    font-size: 64px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin-bottom: 20px;
  }

  .tips {
    font-size: 14px;
    color: #666;
    margin-bottom: 16px;
  }

  .prize-info {
    margin-bottom: 24px;

    h3 {
      font-size: 18px;
      color: #333;
      margin: 12px 0 8px;
    }
  }

  .score-info {
    background: #f5f5f5;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;

    p {
      font-size: 14px;
      color: #666;
      margin: 8px 0;

      span {
        font-weight: bold;
        color: #ff5722;
      }
    }
  }

  .encourage {
    font-size: 14px;
    color: #4caf50;
    margin-bottom: 24px;
  }
}

.ranking-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;

  .section-header {
    margin-bottom: 16px;

    .title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
  }

  .ranking-list {
    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      &.is-me {
        background: #fff5f0;
        margin: 0 -16px;
        padding: 12px 16px;
        border-radius: 8px;
      }

      &.is-winner {
        .name {
          color: #ff5722;
        }
      }

      .rank {
        width: 40px;
        font-size: 16px;
        font-weight: bold;
        color: #ff5722;
      }

      .name {
        flex: 1;
        margin-left: 12px;
        font-size: 14px;
        color: #333;
      }

      .score {
        font-size: 14px;
        color: #666;
        margin-right: 8px;
      }
    }
  }
}
</style>
