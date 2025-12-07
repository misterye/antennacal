# Antennacal Web 重构开发文档

## 1. 项目概述

本项目旨在将原本的微信小程序 `antennacal` 重构为一个纯前端的 Web 应用（Single Page Application），使其能够部署在 Netlify、Tencent EdgeOne 或 Vercel 等静态托管平台上。

目标技术栈：
- **框架**: Vue 3
- **构建工具**: Vite
- **语言**: JavaScript
- **地图库**: Leaflet (用于替代微信小程序地图组件)
- **部署**: 静态站点生成 (Static Site Generation)

## 2. 核心功能迁移

| 功能模块 | 原小程序实现 | Web 端实现方案 |
| :--- | :--- | :--- |
| **星源选择** | `picker` 组件 + `satelliteData` 对象 | HTML `<select>` 元素 + 响应式数据 |
| **位置获取** | `wx.getLocation` | 浏览器 `navigator.geolocation` API |
| **参数计算** | `index.js` 中的 `calculate` 函数 | 移植核心算法到 Vue 组件或工具类中 |
| **地图显示** | `map` 组件 | Leaflet.js 开源地图库 |
| **方位指示** | `markers` 属性 (icon + rotate) | Leaflet Marker + Custom Icon (CSS transform rotation) |

## 3. 目录结构规划 (antennacal-web)

建议在根目录下新建 `antennacal-web` 文件夹，保持与原项目平级，结构如下：

```
antennacal-web/
├── public/
│   └── marker.png       # 移植原项目的 marker 图片
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 组件
│   │   └── MapView.vue  # 封装地图组件
│   ├── utils/
│   │   └── calculate.js # 抽离计算逻辑
│   ├── App.vue          # 主应用页面
│   ├── main.js          # 入口文件
│   └── style.css        # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 4. 开发步骤详解

### 步骤 1: 初始化项目
1. 在工作区根目录创建 `antennacal-web` 项目。
2. 安装必要的依赖：`vue`, `leaflet`。

### 步骤 2: 资源与工具类迁移
1. 将 `antennacal/images/marker.png` 复制到 `antennacal-web/public/`。
2. 将 `antennacal/pages/index/index.js` 中的 `satelliteData` 和 `calculate` 逻辑提取并转换为 ES Module 格式，存放在 `src/utils/calculate.js`。

### 步骤 3: UI 界面重构 (App.vue)
1. 参照 `index.wxml` 和 `index.wxss`，使用 HTML/CSS 重写界面。
2. 实现卫星选择下拉框。
3. 实现经纬度输入框及“获取位置”按钮（调用 Geolocation API）。
4. 实现“计算参数”按钮及结果显示区域。

### 步骤 4: 地图功能实现 (MapView.vue)
1. 引入 Leaflet CSS 和 JS。
2. 初始化地图，中心点设为用户输入的位置。
3. 添加 Marker，并根据计算出的方位角（Azimuth）设置 Marker 图标的旋转角度。
4. **注意**: 微信小程序的 `rotate` 属性通常是顺时针旋转，Leaflet 的 icon rotation 可能需要通过 CSS `transform: rotate(...)` 来实现。

### 步骤 5: 联调与测试
1. 验证计算结果与小程序端是否一致。
2. 验证地图标记的方向是否正确指向卫星方位。
3. 检查响应式布局在移动端浏览器的表现。

### 步骤 6: 构建与部署准备
1. 运行 `npm run build` 生成 `dist` 目录。
2. 确保构建产物可直接用于静态托管。

## 5. 技术难点与解决方案

- **CORS 问题**: 地图瓦片服务（如 OpenStreetMap）通常支持 CORS，可以直接使用。
- **定位权限**: 浏览器定位需要 HTTPS 环境（本地 localhost 除外）。部署后需确保使用 HTTPS。
- **地图旋转**: Leaflet 默认 Marker 不支持 `rotate` 属性，需要通过 `L.divIcon` 自定义 HTML 或使用 CSS 旋转图标图片来实现。

## 6. 后续执行命令

```bash
# 1. 创建项目
npm create vite@latest antennacal-web -- --template vue

# 2. 进入目录并安装依赖
cd antennacal-web
npm install
npm install leaflet

# 3. 启动开发服务器
npm run dev
```
