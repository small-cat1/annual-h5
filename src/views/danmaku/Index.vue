<template>
  <div class="danmaku-page">
    <!-- 星空背景 -->
    <div class="stars-bg">
      <div v-for="n in 50" :key="n" class="star" :style="getStarStyle(n)" />
    </div>

    <!-- 顶部导航 -->
    <van-nav-bar title="弹幕互动" left-arrow @click-left="$router.back()">
      <template #right>
        <span class="online-count">
          <i class="dot" />
          在线
        </span>
      </template>
    </van-nav-bar>

    <!-- 弹幕显示区域 -->
    <div class="danmaku-area" ref="danmakuAreaRef">
      <!-- 飞行弹幕 -->
      <div
        v-for="item in displayDanmaku"
        :key="item.uniqueId"
        class="danmaku-item"
        :class="[`size-${item.size}`, { 'is-self': item.isSelf }]"
        :style="getDanmakuStyle(item)"
      >
        <div class="danmaku-bubble" :style="{ '--bubble-color': item.color }">
          <img v-if="item.avatar" class="avatar" :src="item.avatar" alt="" />
          <span class="text">{{ item.content }}</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!displayDanmaku.length && !loading" class="empty-state">
        <div class="empty-icon">🎉</div>
        <p>暂无弹幕</p>
        <p class="sub">快来发送第一条弹幕吧~</p>
      </div>

      <!-- 发送成功特效 -->
      <Transition name="send-effect">
        <div v-if="showSendEffect" class="send-effect">
          <span>🚀</span>
        </div>
      </Transition>
    </div>

    <!-- 底部输入区域 -->
    <div class="input-area safe-area-bottom">
      <!-- 快捷弹幕 -->
      <div class="quick-danmaku">
        <div
          v-for="(text, index) in quickTexts"
          :key="index"
          class="quick-item"
          @click="sendQuickDanmaku(text)"
        >
          {{ text }}
        </div>
      </div>

      <!-- 颜色选择 -->
      <div class="color-picker">
        <div
          v-for="color in colorOptions"
          :key="color.value"
          class="color-item"
          :class="{ active: selectedColor === color.value }"
          :style="{ background: color.gradient || color.value }"
          @click="selectedColor = color.value"
        >
          <van-icon v-if="selectedColor === color.value" name="success" />
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-box">
        <div class="input-wrapper">
          <input
            v-model="content"
            type="text"
            placeholder="发送弹幕，一起互动吧~"
            maxlength="30"
            :disabled="!canSend"
            @keyup.enter="handleSend"
          />
          <span class="char-count">{{ content.length }}/30</span>
        </div>
        <button
          class="send-btn"
          :class="{ active: content.trim() && canSend }"
          :disabled="!canSend || !content.trim() || sending"
          @click="handleSend"
        >
          <van-icon v-if="sending" name="loading" class="loading" />
          <template v-else>发送</template>
        </button>
      </div>

      <p class="tips" v-if="activityStore.config?.danmakuAudit">
        <van-icon name="info-o" /> 弹幕需要审核后才能显示
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
const selectedColor = ref("#FF6B6B");
const sending = ref(false);
const loading = ref(false);
const danmakuList = ref([]);
const displayDanmaku = ref([]);
const danmakuAreaRef = ref(null);
const showSendEffect = ref(false);

let uniqueId = 0;

let loopTimer = null;
let loopIndex = 0;
// 快捷弹幕
const quickTexts = [
  "我要暴富！",
  "🎉🎉🎉",
  "公司太棒了！",
  "加油！",
  "新年快乐",
  "马上发财",
];

// 颜色选项（带渐变）
const colorOptions = [
  { value: "#FFFFFF", gradient: "linear-gradient(135deg, #fff, #e0e0e0)" },
  { value: "#FF6B6B", gradient: "linear-gradient(135deg, #FF6B6B, #ee5a5a)" },
  { value: "#4ECDC4", gradient: "linear-gradient(135deg, #4ECDC4, #44b3ab)" },
  { value: "#45B7D1", gradient: "linear-gradient(135deg, #45B7D1, #3ca8c1)" },
  { value: "#96E6A1", gradient: "linear-gradient(135deg, #96E6A1, #7ed987)" },
  { value: "#DDA0DD", gradient: "linear-gradient(135deg, #DDA0DD, #cc8fcc)" },
  { value: "#F7DC6F", gradient: "linear-gradient(135deg, #F7DC6F, #f0d04e)" },
  { value: "#BB8FCE", gradient: "linear-gradient(135deg, #BB8FCE, #a77dbf)" },
];

const canSend = computed(() => {
  return activityStore.isOngoing && activityStore.config?.danmakuEnabled;
});

// 生成星星样式
const getStarStyle = (n) => {
  const size = Math.random() * 3 + 1;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${2 + Math.random() * 3}s`,
  };
};

// 获取弹幕样式
const getDanmakuStyle = (item) => {
  return {
    top: `${item.top}%`,
    animationDuration: `${item.duration}s`,
    animationDelay: `${item.delay}s`,
  };
};

// 添加弹幕到显示区域
const addDanmaku = (item, isSelf = false) => {
  const sizes = ["small", "normal", "large"];
  const sizeIndex = isSelf ? 2 : Math.floor(Math.random() * 3);

  const danmaku = {
    ...item,
    uniqueId: `danmaku-${uniqueId++}`,
    top: Math.random() * 75 + 5, // 5% - 80%
    duration: 6 + Math.random() * 4, // 6-10秒
    delay: 0,
    size: sizes[sizeIndex],
    isSelf,
  };

  displayDanmaku.value.push(danmaku);

  // 动画结束后移除
  const totalTime = (danmaku.duration + danmaku.delay) * 1000 + 500;
  setTimeout(() => {
    const index = displayDanmaku.value.findIndex(
      (d) => d.uniqueId === danmaku.uniqueId
    );
    if (index > -1) {
      displayDanmaku.value.splice(index, 1);
    }
  }, totalTime);
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

    // 显示发送特效
    showSendEffect.value = true;
    setTimeout(() => {
      showSendEffect.value = false;
    }, 800);

    if (activityStore.config?.danmakuAudit) {
      showToast("弹幕已提交，等待审核");
    } else {
      // 立即显示自己发的弹幕
      addDanmaku(
        {
          id: Date.now(),
          content: content.value.trim(),
          color: selectedColor.value,
        },
        true
      );
      showSuccessToast("发送成功");
    }

    content.value = "";
  } catch (error) {
    console.error("发送失败:", error);
  } finally {
    sending.value = false;
  }
};

// 发送快捷弹幕
const sendQuickDanmaku = (text) => {
  content.value = text;
  handleSend();
};

// 获取历史弹幕
const fetchDanmaku = async () => {
  if (!activityStore.activityId) return;

  loading.value = true;
  try {
    const res = await getRecentDanmaku({
      activityId: activityStore.activityId,
      page: 1,
      pageSize: 30,
    });
    danmakuList.value = res.data || [];

    // 依次显示历史弹幕
    danmakuList.value.forEach((item, index) => {
      setTimeout(() => {
        addDanmaku(item);
      }, index * 500);
    });

    // 历史弹幕显示完后开始循环
    const startDelay = danmakuList.value.length * 500 + 1000;
    setTimeout(() => {
      startLoop();
    }, startDelay);
  } catch (error) {
    console.error("获取弹幕失败:", error);
  } finally {
    loading.value = false;
  }
};

// WebSocket 订阅
let unsubscribe = null;

const handleNewDanmaku = (data) => {
  console.log("收到新弹幕:", data);
  addDanmaku(data);
};

const subscribeWebSocket = () => {
  if (unsubscribe) unsubscribe();
  unsubscribe = wsStore.subscribe("new_danmaku", handleNewDanmaku);
};

// 开始循环播放
const startLoop = () => {
  stopLoop();
  if (danmakuList.value.length === 0) return;

  const addNext = () => {
    if (danmakuList.value.length === 0) return;

    // 随机添加 1-2 条弹幕
    const count = Math.min(
      Math.floor(Math.random() * 2) + 1,
      danmakuList.value.length
    );

    for (let i = 0; i < count; i++) {
      const item = danmakuList.value[loopIndex % danmakuList.value.length];
      addDanmaku(item);
      loopIndex++;
    }
  };

  // 定时添加弹幕
  loopTimer = setInterval(addNext, 2000);
};

// 停止循环
const stopLoop = () => {
  if (loopTimer) {
    clearInterval(loopTimer);
    loopTimer = null;
  }
};

watch(
  () => wsStore.isConnected,
  (connected) => {
    if (connected) subscribeWebSocket();
  },
  { immediate: true }
);

onMounted(async () => {
  const activityId = localStorage.getItem("activityId");
  if (activityId && !activityStore.activityId) {
    await activityStore.init(activityId);
  }
  fetchDanmaku();
  if (wsStore.isConnected) subscribeWebSocket();
});

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
  stopLoop();
});
</script>

<style lang="scss" scoped>
.danmaku-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

// 星空背景
.stars-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .star {
    position: absolute;
    background: #fff;
    border-radius: 50%;
    animation: twinkle ease-in-out infinite;
    opacity: 0.6;
  }
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

// 导航栏
:deep(.van-nav-bar) {
  background: transparent;

  .van-nav-bar__title,
  .van-nav-bar__arrow {
    color: #fff;
  }
}

.online-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);

  .dot {
    width: 6px;
    height: 6px;
    background: #4caf50;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

// 弹幕区域
.danmaku-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.danmaku-item {
  position: absolute;
  left: 100%;
  animation: flyLeft linear forwards;
  z-index: 1;

  &.is-self .danmaku-bubble {
    box-shadow: 0 0 20px var(--bubble-color);
  }

  &.size-small {
    .danmaku-bubble {
      transform: scale(0.85);
    }
  }

  &.size-large {
    .danmaku-bubble {
      transform: scale(1.1);
    }
  }
}

.danmaku-bubble {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  white-space: nowrap;

  .avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .text {
    font-size: 14px;
    color: var(--bubble-color, #fff);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

@keyframes flyLeft {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(calc(-100vw - 100%));
    opacity: 0;
  }
}

// 空状态
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.6);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    animation: bounce 2s infinite;
  }

  p {
    margin: 4px 0;
    font-size: 14px;
  }

  .sub {
    font-size: 12px;
    opacity: 0.6;
  }
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// 发送特效
.send-effect {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 40px;
  animation: rocketUp 0.8s ease-out forwards;
}

@keyframes rocketUp {
  0% {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-200px) scale(0.5);
  }
}

.send-effect-enter-active,
.send-effect-leave-active {
  transition: all 0.3s;
}

.send-effect-enter-from,
.send-effect-leave-to {
  opacity: 0;
}

// 底部输入区
.input-area {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

// 快捷弹幕
.quick-danmaku {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 10px;

  &::-webkit-scrollbar {
    display: none;
  }

  .quick-item {
    flex-shrink: 0;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.2s;

    &:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// 颜色选择
.color-picker {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 12px;

  .color-item {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;

    .van-icon {
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
      font-weight: bold;
    }

    &.active {
      border-color: #fff;
      transform: scale(1.15);
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
    }

    &:active {
      transform: scale(0.9);
    }
  }
}

// 输入框
.input-box {
  display: flex;
  gap: 10px;

  .input-wrapper {
    flex: 1;
    position: relative;

    input {
      width: 100%;
      height: 40px;
      padding: 0 50px 0 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .char-count {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: rgba(255, 255, 255, 0.4);
    }
  }

  .send-btn {
    width: 64px;
    height: 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 20px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    opacity: 0.5;
    transition: all 0.2s;

    &.active {
      opacity: 1;
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    .loading {
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 10px;
}
</style>
