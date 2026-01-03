<template>
  <div class="result-page" :class="{ 'is-winner': gameStore.isWinner }">
    <van-nav-bar 
      title="游戏结果" 
      left-arrow 
      @click-left="$router.back()"
    />
    
    <div class="result-content">
      <!-- 中奖 -->
      <div v-if="gameStore.isWinner" class="winner-box celebrate">
        <div class="trophy">🏆</div>
        <h1>恭喜获奖！</h1>
        <div class="prize-info" v-if="gameStore.winInfo">
          <van-image
            width="120"
            height="120"
            radius="12"
            :src="gameStore.winInfo.prize?.image"
            fit="cover"
          />
          <h3>{{ gameStore.winInfo.prize?.name }}</h3>
          <van-tag type="warning">{{ formatPrizeLevel(gameStore.winInfo.prize?.level) }}</van-tag>
        </div>
        <div class="score-info">
          <p>摇动次数：<span>{{ gameStore.shakeCount }}</span> 次</p>
          <p>最终排名：<span>第 {{ gameStore.myRank }} 名</span></p>
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
          <p>摇动次数：<span>{{ gameStore.shakeCount }}</span> 次</p>
          <p>最终排名：<span>第 {{ gameStore.myRank }} 名</span></p>
        </div>
        <p class="encourage">下一轮还有机会，请继续参与！</p>
        <van-button type="primary" block round @click="goBack">
          返回等待
        </van-button>
      </div>
      
      <!-- 排行榜 -->
      <div class="ranking-section">
        <div class="section-header">
          <span class="title">本轮排行榜</span>
        </div>
        <div class="ranking-list">
          <div 
            v-for="(item, index) in gameStore.ranking" 
            :key="item.userId"
            class="ranking-item"
            :class="{ 
              'is-me': item.userId === userStore.userId,
              'is-winner': index < gameStore.currentRound?.winnerCount
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
            <span class="name">{{ item.user?.realName || item.user?.nickname }}</span>
            <span class="score">{{ item.score }} 次</span>
            <van-tag v-if="index < gameStore.currentRound?.winnerCount" type="danger" size="small">
              获奖
            </van-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useGameStore } from '@/store'
import { formatPrizeLevel, formatRank } from '@/utils/format'
import { getRoundResult } from '@/api/shake'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const viewPrize = () => {
  router.push('/prize')
}

const goBack = () => {
  gameStore.resetGame()
  router.replace('/shake')
}

// 获取最终结果
const fetchResult = async () => {
  if (!gameStore.roundId) return
  
  try {
    const res = await getRoundResult(gameStore.roundId)
    gameStore.updateRanking(res.data.ranking || [])
    gameStore.updateMyRank(res.data.myRank)
    gameStore.setWinInfo(res.data.isWinner, res.data.winInfo)
  } catch (error) {
    console.error('获取结果失败:', error)
  }
}

onMounted(() => {
  fetchResult()
})
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
