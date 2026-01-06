<template>
  <div class="prize-list-page">
    <van-nav-bar title="我的奖品" left-arrow @click-left="$router.back()" />

    <div class="prize-content">
      <!-- 奖品列表 -->
      <div v-if="prizeList.length" class="prize-list">
        <div
          v-for="item in prizeList"
          :key="item.id"
          class="prize-card"
          @click="viewDetail(item)"
        >
          <van-image
            width="80"
            height="80"
            radius="8"
            :src="getUrl(item.prize.image)"
            fit="cover"
          />
          <div class="prize-info">
            <h3 class="prize-name">{{ item.prize?.name }}</h3>
            <div class="prize-meta">
              <van-tag :type="getLevelTagType(item.prize?.level)" size="small">
                {{ formatPrizeLevel(item.prize?.level) }}
              </van-tag>
              <span class="win-type">{{ formatWinType(item.winType) }}</span>
            </div>
            <p class="win-time">
              中奖时间：{{ formatDate(item.createdAt, "MM-DD HH:mm") }}
            </p>
          </div>
          <div class="prize-status">
            <van-tag :type="item.status === 1 ? 'success' : 'warning'">
              {{ item.status === 1 ? "已领取" : "未领取" }}
            </van-tag>
            <van-icon name="arrow" color="#999" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <van-empty
          image="https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png"
          description="暂无中奖记录"
        >
          <van-button round type="primary" @click="goShake">
            去摇一摇
          </van-button>
        </van-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getMyWinnings } from "@/api/prize";
import { useActivityStore } from "@/store";
import {
  formatDate,
  formatPrizeLevel,
  formatWinType,
  getUrl,
} from "@/utils/format";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const activityStore = useActivityStore();

const prizeList = ref([]);
const loading = ref(false);

const getLevelTagType = (level) => {
  const types = {
    1: "danger",
    2: "warning",
    3: "primary",
    4: "success",
    5: "default",
  };
  return types[level] || "default";
};

const viewDetail = (item) => {
  router.push(`/prize/${item.id}`);
};

const goShake = () => {
  router.push("/shake");
};

const fetchPrizeList = async () => {
  // 修复：从 localStorage 获取 activityId 并初始化
  if (!activityStore.activityId) {
    const activityId = localStorage.getItem("activityId");
    if (activityId) {
      await activityStore.init(activityId);
    }
  }

  if (!activityStore.activityId) return;

  loading.value = true;
  try {
    const res = await getMyWinnings(activityStore.activityId);
    prizeList.value = res.data || [];
  } catch (error) {
    console.error("获取奖品列表失败:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPrizeList();
});
</script>

<style lang="scss" scoped>
.prize-list-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.prize-content {
  padding: 16px;
}

.prize-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prize-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .prize-info {
    flex: 1;
    margin-left: 12px;

    .prize-name {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }

    .prize-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .win-type {
        font-size: 12px;
        color: #666;
      }
    }

    .win-time {
      font-size: 12px;
      color: #999;
    }
  }

  .prize-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
}

.empty-state {
  padding: 60px 0;
}
</style>
