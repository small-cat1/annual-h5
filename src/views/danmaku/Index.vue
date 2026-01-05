<template>
  <div class="danmaku-page">
    <van-nav-bar title="弹幕互动" left-arrow @click-left="$router.back()" />

    <!-- 弹幕显示区域 -->
    <div class="danmaku-area" ref="danmakuAreaRef">
      <div
        v-for="item in displayDanmaku"
        :key="item.id"
        class="danmaku-item"
        :style="getDanmakuStyle(item)"
      >
        <span class="danmaku-content" :style="{ color: item.color }">
          {{ item.content }}
        </span>
      </div>

      <div v-if="!displayDanmaku.length" class="empty-tips">
        暂无弹幕，快来发送第一条吧~
      </div>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-area safe-area-bottom">
      <!-- 颜色选择 -->
      <div class="color-picker">
        <div
          v-for="color in colorOptions"
          :key="color"
          class="color-item"
          :class="{ active: selectedColor === color }"
          :style="{ backgroundColor: color }"
          @click="selectedColor = color"
        />
      </div>

      <!-- 输入框 -->
      <div class="input-box">
        <van-field
          v-model="content"
          placeholder="发送弹幕..."
          maxlength="50"
          :disabled="!canSend"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="!canSend || !content.trim()"
              :loading="sending"
              @click="handleSend"
            >
              发送
            </van-button>
          </template>
        </van-field>
      </div>

      <p class="tips" v-if="activityStore.config?.danmakuAudit">
        弹幕需要审核后才能显示
      </p>
    </div>
  </div>
</template>

<script setup>
import { getRecentDanmaku, sendDanmaku } from "@/api/danmaku";
import { useActivityStore, useWebSocketStore } from "@/store";
import { showSuccessToast, showToast } from "vant";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const activityStore = useActivityStore();
const wsStore = useWebSocketStore();

const content = ref("");
const selectedColor = ref("#FFFFFF");
const sending = ref(false);
const danmakuList = ref([]);
const displayDanmaku = ref([]);
const danmakuAreaRef = ref(null);

// 颜色选项
const colorOptions = [
  "#FFFFFF",
  "#FF5722",
  "#4CAF50",
  "#2196F3",
  "#FF9800",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
];

const canSend = computed(() => {
  return activityStore.isOngoing && activityStore.config?.danmakuEnabled;
});

// 获取弹幕样式（随机位置和动画）
const getDanmakuStyle = (item) => {
  return {
    top: `${item.top || Math.random() * 80}%`,
    animationDuration: `${8 + Math.random() * 4}s`,
    animationDelay: `${item.delay || 0}s`,
  };
};

// 发送弹幕
const handleSend = async () => {
  if (!content.value.trim() || sending.value) return;

  sending.value = true;
  try {
    await sendDanmaku({
      activityId: activityStore.activityId,
      content: content.value.trim(),
      color: selectedColor.value,
    });

    if (activityStore.config?.danmakuAudit) {
      showToast("弹幕已提交，等待审核");
    } else {
      showSuccessToast("发送成功");
    }

    content.value = "";
  } catch (error) {
    console.error("发送失败:", error);
  } finally {
    sending.value = false;
  }
};

// 添加弹幕到显示区域
const addDanmaku = (item) => {
  const danmaku = {
    ...item,
    id: item.id || Date.now() + Math.random(),
    top: Math.random() * 80,
    delay: 0,
  };

  displayDanmaku.value.push(danmaku);

  // 动画结束后移除
  setTimeout(() => {
    const index = displayDanmaku.value.findIndex((d) => d.id === danmaku.id);
    if (index > -1) {
      displayDanmaku.value.splice(index, 1);
    }
  }, 12000);
};

// 获取历史弹幕
const fetchDanmaku = async () => {
  if (!activityStore.activityId) return;

  try {
    const res = await getRecentDanmaku(activityStore.activityId, 50);
    danmakuList.value = res.data || [];

    // 依次显示历史弹幕
    danmakuList.value.forEach((item, index) => {
      setTimeout(() => {
        addDanmaku(item);
      }, index * 500);
    });
  } catch (error) {
    console.error("获取弹幕失败:", error);
  }
};

// WebSocket 订阅取消函数
let unsubscribe = null;

// 处理新弹幕
const handleNewDanmaku = (data) => {
  console.log("收到新弹幕:", data);
  addDanmaku(data);
};

// 订阅 WebSocket 弹幕消息
const subscribeWebSocket = () => {
  if (unsubscribe) {
    unsubscribe();
  }
  unsubscribe = wsStore.subscribe("new_danmaku", handleNewDanmaku);
};

// 监听 WebSocket 连接状态
watch(
  () => wsStore.isConnected,
  (connected) => {
    if (connected) {
      subscribeWebSocket();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // 修复：从 localStorage 获取 activityId 并初始化
  const activityId = localStorage.getItem("activityId");
  if (activityId && !activityStore.activityId) {
    await activityStore.init(activityId);
  }

  // 获取历史弹幕
  fetchDanmaku();

  // 如果 WebSocket 已连接，立即订阅
  if (wsStore.isConnected) {
    subscribeWebSocket();
  }
});

onUnmounted(() => {
  // 只取消订阅，不关闭连接（连接是全局的）
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style lang="scss" scoped>
.danmaku-page {
  min-height: 100vh;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;

  :deep(.van-nav-bar) {
    background: transparent;

    .van-nav-bar__title,
    .van-nav-bar__arrow {
      color: #fff;
    }
  }
}

.danmaku-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  padding: 20px;

  .danmaku-item {
    position: absolute;
    left: 100%;
    white-space: nowrap;
    animation: danmakuMove 10s linear forwards;

    .danmaku-content {
      font-size: 16px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      padding: 4px 12px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 20px;
    }
  }

  .empty-tips {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
}

@keyframes danmakuMove {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - 100vw));
  }
}

.input-area {
  background: rgba(0, 0, 0, 0.5);
  padding: 12px 16px;

  .color-picker {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    justify-content: center;

    .color-item {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;

      &.active {
        border-color: #fff;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      }
    }
  }

  .input-box {
    :deep(.van-field) {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 24px;

      .van-field__control {
        color: #fff;

        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
  }

  .tips {
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 8px;
  }
}
</style>
