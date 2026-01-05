<template>
  <section class="danmaku-panel panel">
    <div class="panel-header">
      <span class="panel-icon">💬</span>
      <h2>实时弹幕</h2>
      <span class="danmaku-count">{{ danmakuList.length }} 条</span>
    </div>

    <div class="panel-body">
      <div class="danmaku-list" ref="listRef">
        <TransitionGroup name="danmaku">
          <div v-for="item in danmakuList" :key="item.id" class="danmaku-item">
            <div class="danmaku-avatar">
              <img :src="item.user?.avatar || defaultAvatar" alt="" />
            </div>
            <div class="danmaku-content">
              <span class="danmaku-user">{{
                item.user?.nickname || "匿名"
              }}</span>
              <span class="danmaku-text">{{ item.content }}</span>
            </div>
            <span class="danmaku-time">{{ formatDate(item.createdAt) }}</span>
          </div>
        </TransitionGroup>
        <div v-if="danmakuList.length === 0" class="empty-state">
          <span class="empty-icon">💬</span>
          <p>暂无弹幕</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { getDanmakuList } from "@/api/console/danmaku";
import { formatDate } from "@/utils/format";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
const props = defineProps({
  activityId: {
    type: [Number, String],
    required: true,
  },
  limit: {
    type: Number,
    default: 20,
  },
  pollInterval: {
    type: Number,
    default: 3000,
  },
});

const defaultAvatar = "https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg";

const danmakuList = ref([]);
const listRef = ref(null);
let pollTimer = null;

// 获取弹幕列表
const fetchDanmakuList = async () => {
  if (!props.activityId) return;

  try {
    const res = await getDanmakuList(props.activityId, { limit: props.limit });
    if (res.code === 0) {
      const newList = res.data?.list || [];
      // 检查是否有新弹幕
      if (newList.length > 0 && danmakuList.value.length > 0) {
        if (newList[0].id !== danmakuList.value[0]?.id) {
          danmakuList.value = newList;
          scrollToTop();
        }
      } else {
        danmakuList.value = newList;
      }
    }
  } catch (e) {
    console.error("获取弹幕列表失败", e);
  }
};

// 滚动到顶部
const scrollToTop = () => {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = 0;
    }
  });
};

// 开始轮询
const startPolling = () => {
  stopPolling();
  fetchDanmakuList();
  pollTimer = setInterval(fetchDanmakuList, props.pollInterval);
};

// 停止轮询
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

// 监听activityId变化
watch(
  () => props.activityId,
  (newVal) => {
    if (newVal) {
      startPolling();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.activityId) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

// // 暴露方法供外部调用
// defineExpose({
//   refresh: fetchDanmakuList
// })
</script>

<style lang="scss" scoped>
$primary-gold: #ffd700;
$text-light: #fff5e6;

.danmaku-panel {
  background: rgba(40, 15, 15, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  height: 100%;
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
    color: $primary-gold;
  }

  .danmaku-count {
    font-size: 12px;
    opacity: 0.7;
    color: $text-light;
  }
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

.danmaku-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 215, 0, 0.3);
    border-radius: 2px;
  }
}

.danmaku-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 215, 0, 0.05);
  }

  .danmaku-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid rgba(255, 215, 0, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .danmaku-content {
    flex: 1;
    min-width: 0;

    .danmaku-user {
      display: block;
      font-size: 12px;
      color: $primary-gold;
      margin-bottom: 4px;
    }

    .danmaku-text {
      display: block;
      font-size: 14px;
      line-height: 1.4;
      word-break: break-all;
      color: $text-light;
    }
  }

  .danmaku-time {
    font-size: 11px;
    opacity: 0.5;
    white-space: nowrap;
    color: $text-light;
  }
}

.danmaku-enter-active,
.danmaku-leave-active {
  transition: all 0.3s ease;
}

.danmaku-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.danmaku-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  opacity: 0.6;
  color: $text-light;

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}
</style>
