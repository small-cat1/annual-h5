# 年会互动 H5 前端

基于 Vue 3 + Vite + Vant 4 的年会互动H5应用。

## 功能模块

- 🔐 **微信授权登录** - 微信OAuth2.0授权，一键登录
- 📝 **员工报名** - 填写信息报名，支持审核流程
- ✅ **现场签到** - 点击签到，实时展示签到墙
- 💬 **弹幕互动** - 发送弹幕，大屏实时显示
- 📱 **摇一摇抽奖** - 摇动手机参与游戏，实时排名
- 🎁 **我的奖品** - 查看中奖记录，扫码领奖
- 🖥️ **大屏展示** - 签到墙、弹幕墙、排行榜、抽奖大屏

## 技术栈

- **框架**: Vue 3 + Composition API
- **构建**: Vite 5
- **UI组件**: Vant 4
- **路由**: Vue Router 4
- **状态管理**: Pinia + 持久化
- **HTTP**: Axios
- **WebSocket**: 原生封装
- **样式**: SCSS + postcss-px-to-viewport
- **二维码**: qrcode.vue

## 目录结构

```
annual-h5/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口
│   │   ├── auth.js        # 授权接口
│   │   ├── user.js        # 用户接口
│   │   ├── activity.js    # 活动接口
│   │   ├── checkIn.js     # 签到接口
│   │   ├── danmaku.js     # 弹幕接口
│   │   ├── shake.js       # 摇一摇接口
│   │   └── prize.js       # 奖品接口
│   ├── assets/            # 资源文件
│   │   ├── images/        # 图片
│   │   ├── styles/        # 样式
│   │   └── fonts/         # 字体
│   ├── components/        # 公共组件
│   │   └── common/        # 通用组件
│   ├── hooks/             # 组合式函数
│   │   ├── useAuth.js     # 授权Hook
│   │   ├── useUser.js     # 用户Hook
│   │   ├── useWebSocket.js # WebSocket Hook
│   │   ├── useShake.js    # 摇一摇Hook
│   │   └── useCountDown.js # 倒计时Hook
│   ├── router/            # 路由配置
│   │   ├── index.js       # 路由实例
│   │   ├── routes.js      # 路由表
│   │   └── guards.js      # 路由守卫
│   ├── store/             # 状态管理
│   │   └── modules/       # 状态模块
│   ├── utils/             # 工具函数
│   │   ├── request.js     # Axios 封装
│   │   ├── auth.js        # Token 管理
│   │   ├── storage.js     # 本地存储
│   │   ├── wechat.js      # 微信 SDK
│   │   ├── websocket.js   # WebSocket
│   │   ├── shake.js       # 摇一摇检测
│   │   ├── format.js      # 格式化
│   │   └── validate.js    # 验证规则
│   ├── views/             # 页面视图
│   │   ├── auth/          # 授权页面
│   │   ├── register/      # 报名页面
│   │   ├── home/          # 首页
│   │   ├── checkin/       # 签到页面
│   │   ├── danmaku/       # 弹幕页面
│   │   ├── shake/         # 摇一摇页面
│   │   ├── prize/         # 奖品页面
│   │   ├── screen/        # 大屏页面
│   │   └── error/         # 错误页面
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
├── index.html             # HTML 模板
├── package.json           # 项目配置
└── vite.config.js         # Vite 配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览构建

```bash
npm run preview
```

## 环境变量配置

### 开发环境 (.env.development)

```env
VITE_APP_BASE_API=/api
VITE_APP_WS_URL=ws://localhost:9001
```

### 生产环境 (.env.production)

```env
VITE_APP_BASE_API=https://your-domain.com/api
VITE_APP_WS_URL=wss://your-domain.com
```

> 注意：微信AppID等配置从后端接口 `/h5/config/wechat` 获取，无需在前端配置

## 页面路由

| 路径 | 页面 | 权限 |
|------|------|------|
| /auth/login | 登录页 | 无需登录 |
| /auth/callback | 授权回调 | 无需登录 |
| /register | 报名页 | 需登录 |
| /register/status | 审核状态 | 需登录 |
| / | 首页 | 需登录+报名 |
| /checkin | 签到页 | 需登录+报名 |
| /danmaku | 弹幕互动 | 需登录+报名 |
| /shake | 摇一摇 | 需登录+报名 |
| /shake/playing | 游戏进行中 | 需登录+报名 |
| /shake/result | 游戏结果 | 需登录+报名 |
| /prize | 我的奖品 | 需登录+报名 |
| /prize/:id | 奖品详情 | 需登录+报名 |
| /screen | 大屏入口 | 无需登录 |
| /screen/checkin | 签到墙 | 无需登录 |
| /screen/danmaku | 弹幕墙 | 无需登录 |
| /screen/shake | 摇一摇排行 | 无需登录 |
| /screen/draw | 抽奖大屏 | 无需登录 |

## 注意事项

1. **微信环境**: 摇一摇功能需要在微信内使用，且需要用户授权设备运动权限（iOS 13+）
2. **HTTPS**: 生产环境必须使用 HTTPS，否则微信授权和设备API无法使用
3. **微信配置**: 需要在微信公众平台配置JS安全域名和网页授权域名
4. **WebSocket**: 确保后端WebSocket服务正常运行

## 后端接口

本项目需要配合后端API使用，接口文档请参考后端项目说明。

## License

MIT