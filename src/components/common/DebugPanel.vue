<template>
  <div v-if="enabled" class="debug-panel" :class="{ collapsed }">
    <div class="debug-header" @click="collapsed = !collapsed">
      <span>🔧 调试</span>
      <span>{{ collapsed ? "展开" : "收起" }}</span>
    </div>
    <div v-show="!collapsed" class="debug-content">
      <!-- 自定义状态 -->
      <div
        v-for="(section, sectionKey) in states"
        :key="sectionKey"
        class="debug-section"
      >
        <div class="debug-title">{{ sectionKey }}</div>
        <div v-for="(value, key) in section" :key="key" class="debug-row">
          <span>{{ key }}:</span>
          <span :class="getStatusClass(value)">{{ formatValue(value) }}</span>
        </div>
      </div>

      <!-- 日志 -->
      <div class="debug-section">
        <div class="debug-title">📋 日志</div>
        <div class="debug-logs">
          <div
            v-for="(log, i) in logs"
            :key="i"
            class="log-item"
            :class="log.type"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-msg">{{ log.msg }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="actions.length" class="debug-actions">
        <button
          v-for="action in actions"
          :key="action.label"
          @click="action.handler"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// 调试工具的全局状态
import { inject, provide, reactive } from "vue";

const DEBUG_KEY = Symbol("debug");

// 创建调试工具实例
export function createDebugger(options = {}) {
  const enabled = ref(options.enabled ?? true);
  const logs = ref([]);
  const states = reactive({});
  const actions = ref([]);

  const addLog = (msg, type = "info") => {
    if (!enabled.value) return;
    const now = new Date();
    const time = `${now.getMinutes()}:${now
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
    logs.value.unshift({ time, msg, type });
    if (logs.value.length > 15) logs.value.pop();
    console.log(`[Debug] [${type}] ${msg}`);
  };

  const setState = (section, key, value) => {
    if (!states[section]) {
      states[section] = {};
    }
    states[section][key] = value;
  };

  const setStates = (section, obj) => {
    states[section] = { ...states[section], ...obj };
  };

  const registerAction = (label, handler) => {
    actions.value.push({ label, handler });
  };

  const clearLogs = () => {
    logs.value = [];
    addLog("日志已清空", "info");
  };

  return {
    enabled,
    logs,
    states,
    actions,
    addLog,
    setState,
    setStates,
    registerAction,
    clearLogs,
  };
}

// 提供调试工具
export function provideDebugger(debugTool) {
  provide(DEBUG_KEY, debugTool);
}

// 使用调试工具
export function useDebugger() {
  const debugTool = inject(DEBUG_KEY, null);
  if (!debugTool) {
    // 返回空实现，避免报错
    return {
      enabled: ref(false),
      logs: ref([]),
      states: {},
      actions: ref([]),
      addLog: () => {},
      setState: () => {},
      setStates: () => {},
      registerAction: () => {},
      clearLogs: () => {},
    };
  }
  return debugTool;
}
</script>

<script setup>
import { ref } from "vue";

const props = defineProps({
  enabled: { type: Boolean, default: true },
  logs: { type: Array, default: () => [] },
  states: { type: Object, default: () => ({}) },
  actions: { type: Array, default: () => [] },
});

const collapsed = ref(true);

const getStatusClass = (value) => {
  if (typeof value === "boolean") {
    return value ? "status-ok" : "status-error";
  }
  if (value === "granted" || value === "已连接" || value === "已启动") {
    return "status-ok";
  }
  if (value === "denied" || value === "未连接" || value === "未启动") {
    return "status-error";
  }
  return "";
};

const formatValue = (value) => {
  if (typeof value === "boolean") {
    return value ? "✅ 是" : "❌ 否";
  }
  return value;
};
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 46px;
  right: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  font-size: 11px;
  border-radius: 0 0 0 8px;
  max-width: 220px;
  max-height: 70vh;
  overflow-y: auto;
}

.debug-panel.collapsed .debug-content {
  display: none;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  padding: 8px 10px;
  background: #222;
  cursor: pointer;
  position: sticky;
  top: 0;
  font-weight: bold;
}

.debug-content {
  padding: 8px 10px;
}

.debug-section {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.debug-section:last-child {
  border-bottom: none;
}

.debug-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #4fc3f7;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  gap: 8px;
}

.debug-row .status-ok {
  color: #4caf50;
}

.debug-row .status-error {
  color: #f44336;
}

.debug-logs {
  max-height: 100px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 6px;
  padding: 1px 0;
  word-break: break-all;
}

.log-item.success .log-msg {
  color: #4caf50;
}

.log-item.error .log-msg {
  color: #f44336;
}

.log-item.warn .log-msg {
  color: #ff9800;
}

.log-item.info .log-msg {
  color: #aaa;
}

.log-time {
  color: #666;
  flex-shrink: 0;
}

.debug-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.debug-actions button {
  flex: 1;
  min-width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  background: #4fc3f7;
  color: #000;
  font-size: 11px;
  cursor: pointer;
}

.debug-actions button:active {
  opacity: 0.8;
}
</style>
