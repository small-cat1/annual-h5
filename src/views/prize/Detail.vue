<template>
  <div class="prize-detail-page">
    <van-nav-bar title="奖品详情" left-arrow @click-left="$router.back()" />
    
    <div class="detail-content" v-if="prizeInfo">
      <!-- 奖品图片 -->
      <div class="prize-image">
        <van-image
          width="200"
          height="200"
          radius="16"
          :src="prizeInfo.prize?.image"
          fit="cover"
        />
        <van-tag class="level-tag" :type="getLevelTagType(prizeInfo.prize?.level)">
          {{ formatPrizeLevel(prizeInfo.prize?.level) }}
        </van-tag>
      </div>
      
      <!-- 奖品信息 -->
      <div class="prize-info">
        <h1 class="prize-name">{{ prizeInfo.prize?.name }}</h1>
        <div class="info-list">
          <div class="info-item">
            <span class="label">中奖方式</span>
            <span class="value">{{ formatWinType(prizeInfo.winType) }}</span>
          </div>
          <div class="info-item">
            <span class="label">中奖时间</span>
            <span class="value">{{ formatDate(prizeInfo.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">领奖状态</span>
            <span class="value" :class="{ received: prizeInfo.status === 1 }">
              {{ prizeInfo.status === 1 ? '已领取' : '未领取' }}
            </span>
          </div>
          <div class="info-item" v-if="prizeInfo.status === 1">
            <span class="label">领奖时间</span>
            <span class="value">{{ formatDate(prizeInfo.receiveTime) }}</span>
          </div>
        </div>
      </div>
      
      <!-- 领奖二维码 -->
      <div class="qrcode-section" v-if="prizeInfo.status !== 1">
        <h3>领奖二维码</h3>
        <p class="tips">请出示此二维码给工作人员扫码核销</p>
        <div class="qrcode-wrap">
          <qrcode-vue
            :value="qrcodeValue"
            :size="200"
            level="H"
          />
        </div>
        <p class="qrcode-id">领奖码：{{ prizeInfo.id }}</p>
      </div>
      
      <!-- 已领取提示 -->
      <div class="received-section" v-else>
        <van-icon name="passed" size="64" color="#4caf50" />
        <h3>奖品已领取</h3>
        <p>领取时间：{{ formatDate(prizeInfo.receiveTime) }}</p>
      </div>
    </div>
    
    <!-- 加载中 -->
    <div v-else class="loading-wrap">
      <van-loading type="spinner" size="36" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { getWinningDetail } from '@/api/prize'
import { formatDate, formatPrizeLevel, formatWinType } from '@/utils/format'

const route = useRoute()

const prizeInfo = ref(null)

const getLevelTagType = (level) => {
  const types = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'default'
  }
  return types[level] || 'default'
}

// 二维码内容
const qrcodeValue = computed(() => {
  if (!prizeInfo.value) return ''
  return JSON.stringify({
    type: 'prize_receive',
    winnerId: prizeInfo.value.id,
    prizeId: prizeInfo.value.prizeId,
    userId: prizeInfo.value.userId
  })
})

const fetchDetail = async () => {
  const winnerId = route.params.id
  if (!winnerId) return
  
  try {
    const res = await getWinningDetail(winnerId)
    prizeInfo.value = res.data
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="scss" scoped>
.prize-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.detail-content {
  padding: 20px 16px;
}

.prize-image {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  
  .level-tag {
    position: absolute;
    top: 8px;
    right: calc(50% - 108px);
  }
}

.prize-info {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  
  .prize-name {
    font-size: 22px;
    font-weight: bold;
    color: #333;
    text-align: center;
    margin-bottom: 20px;
  }
  
  .info-list {
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .label {
        font-size: 14px;
        color: #666;
      }
      
      .value {
        font-size: 14px;
        color: #333;
        
        &.received {
          color: #4caf50;
        }
      }
    }
  }
}

.qrcode-section {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  
  h3 {
    font-size: 18px;
    color: #333;
    margin-bottom: 8px;
  }
  
  .tips {
    font-size: 14px;
    color: #999;
    margin-bottom: 20px;
  }
  
  .qrcode-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  
  .qrcode-id {
    font-size: 12px;
    color: #999;
  }
}

.received-section {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  
  h3 {
    font-size: 20px;
    color: #4caf50;
    margin: 16px 0 8px;
  }
  
  p {
    font-size: 14px;
    color: #666;
  }
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
</style>
