import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import Vant from "vant";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Vant 样式
import "vant/lib/index.css";

// 全局样式
import "./assets/styles/index.scss";

// 创建应用
const app = createApp(App);

// Pinia 状态管理
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(Vant); // 添加这行
// 路由
app.use(router);

// 挂载
app.mount("#app");
