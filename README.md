# 辰星 · 长夜轮回（Galgame CloudBase AI）

一款基于 **UniApp + 腾讯云开发 CloudBase** 的跨端剧情互动文字游戏（Galgame / Visual Novel）。玩家在「长夜」降临的虚构城市中与角色相遇，通过一系列关键抉择推进分支剧情，最终由引擎根据选择判定结局，并由 AI 生成专属的结局报告与纪念图。

项目采用「传统文字游戏骨架 + AI 点睛」的架构：剧情结构、选项分值、流程跳转、配图等沉浸感要素全部由内置 JSON 剧本与纯函数引擎驱动，AI 只负责在关键节点生成有温度的、每次不同的角色回应，且所有 AI 调用都有内置兜底，失败时主流程零中断。

- **前端框架**：UniApp（Vue 3 + Vite + TypeScript），一套代码多端运行
- **支持平台**：微信小程序、H5、App（iOS / Android）
- **后端**：腾讯云开发 CloudBase（云函数、云数据库、云存储、身份认证、AI 能力）
- **运行环境**：无需自建服务器，前端匿名登录即可游玩，不存储任何用户数据

---

## 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [技术架构](#技术架构)
- [游戏引擎设计](#游戏引擎设计)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [部署上线](#部署上线)
- [云函数说明](#云函数说明)
- [常用脚本](#常用脚本)
- [相关链接](#相关链接)

---

## 项目简介

「辰星」是一座悬浮于星海之上的城市，每七十年迎来一次「长夜」：星辰熄灭、黎明不至、沉睡者尽数遗忘。玩家是在这一夜醒来的人，将与选定的角色共同走过这一夜，每一次选择都会真实地改变故事走向。

项目内置多套主题各异的完整剧本，覆盖商战、校园、武侠、都市、亲情、乐队等不同类型的故事世界；支持中英文双语切换。所有剧本以 JSON 描述，替换一个文件即可新增一套剧情，无需改动引擎代码。

### 界面预览

| 选角色 | 剧情进行中 | 结局报告 |
|:---:|:---:|:---:|
| ![选角色](https://qcloudimg.tencent-cloud.cn/raw/4cd2e8c7910b65b5310d9e24795561af.png) | ![剧情进行中](https://qcloudimg.tencent-cloud.cn/raw/876c980433ad613150346bfd99b23be0.png) | ![结局报告](https://qcloudimg.tencent-cloud.cn/raw/fd0703f71eaabcc28c8d5021a20f19e3.png) |

## 核心特性

- **节点图剧本引擎**：剧本是一张「图」而非一条线。每个节点可跳转到任意其他节点，支持分支与汇合，可编写复杂的多结局叙事。
- **选择即塑造**：每个选项会改变羁绊值、关系人格标签，并留下「印记」，供后续剧情条件化回收（业力回收机制）。
- **人格结局判定（两级漏斗）**：若玩家在关键抉择中多次选择同一类人格，将锁定对应特殊结局；否则回退到羁绊值阈值匹配的普通结局。
- **AI 点睛**：选择后的角色回应台词 + 内心 OS、开放题回应、结局判词、结局 Q 版纪念图，均由大模型在云端生成，每次游玩不同。
- **兜底优先**：所有 AI 调用均设置超时与内置兜底文案，AI 失败时玩家完全无感，主流程零中断。
- **零后端运维**：AI 调用、统计等后端逻辑全部托管在 CloudBase 云函数，前端不接触任何模型凭证。
- **隐私友好**：仅使用匿名登录，不落库用户个人信息，刷新即重开一局。

## 技术架构

### 前端

| 模块 | 说明 |
|------|------|
| 框架 | UniApp（Vue 3 Composition API） |
| 构建 | Vite |
| 语言 | TypeScript |
| 云开发 SDK | `@cloudbase/js-sdk` + `@cloudbase/adapter-uni-app`（多端共用一份调用代码） |
| 多语言 | vue-i18n，内置中英文语言包 |

### 后端（CloudBase）

- **云函数 `galgame-ai`**：承载全部 AI 调用。Prompt 模板保存在服务端，前端只传业务参数，通过 SDK `callFunction` 调用（自带鉴权），避免接口被外部裸调用。
- **云函数 `galgame-stats`**：全站匿名统计，基于云数据库单行文档做原子自增，含枚举白名单校验。
- **云数据库 / 云存储**：用于统计与图片等业务资源。
- **身份认证**：使用 CloudBase 匿名登录，无需注册即可游玩。

### 架构总览

![架构图](https://qcloudimg.tencent-cloud.cn/raw/bba8e53a54c2033ca757cc498c280435.png)

### 调用链路

```
前端页面 → src/utils/cloudbase.ts（SDK 初始化/匿名登录）
         → src/utils/cloudfn.ts → callFunction('galgame-ai')
         → 云函数内 @cloudbase/node-sdk app.ai() 调用大模型
         → 返回结果 → 失败则走内置兜底文案
```

## 游戏引擎设计

核心代码位于 `src/game/`，为纯 TypeScript 实现，不依赖 AI，保证基础体验稳定。

- **`types.ts`**：核心类型定义。`Script` 描述一部剧本，`GameNode` 是剧情节点（`story` 纯剧情 / `choice` 关键抉择 / `open` 开放题），`Ending` 定义结局及其触发条件。
- **`engine.ts`**：引擎纯函数。包括文案占位符替换（`{name}` / `{ta}` / `{TA}`）、羁绊值夹紧、`when` 条件求值（支持 `tag:` / `score:` / `flag:` / `top:` 及取反）、结局判定与契合度换算。
- **`store.ts`**：游戏会话状态（`reactive` 单例，仅内存不落库）。负责开局、应用选项、跳转节点、过滤条件台词、结算结局。
- **`ai.ts`**：AI 客户端封装，统一处理匿名登录、超时、失败兜底。

### 结局判定

1. **特殊结局**：剧本中带 `trigger` 的结局优先匹配，如某标签被选够一定次数，或某一标签成为「主导人格」（被选次数最多且达到阈值）。
2. **普通结局**：无主导人格时，按最终羁绊值匹配剧本中配置的 `min` 阈值，取满足条件的最高档。
3. **兜底**：始终返回最后一个可匹配结局，保证任何游玩路径都能正常结算。

## 项目结构

```
├── src/
│   ├── pages/                     # 页面（游戏主流程 + 模板示例页）
│   │   └── game/                  # pick → opening → play → gender → ending → report → stats
│   ├── game/                      # 游戏核心
│   │   ├── engine.ts              # 引擎纯函数（计分/条件/结局判定）
│   │   ├── store.ts               # 会话状态
│   │   ├── ai.ts                  # AI 客户端封装
│   │   ├── types.ts               # 核心类型
│   │   └── data/                  # 数据源（JSON 唯一真源）
│   │       ├── characters.json    # 角色库
│   │       ├── scripts.json       # 默认剧本
│   │       ├── scripts/           # 各主题剧本（中英双语）
│   │       └── endingCG.json      # 结局图库（兜底）
│   ├── components/                # 公共组件
│   ├── locale/                    # i18n 语言包
│   ├── utils/                     # cloudbase.ts / cloudfn.ts / db.ts / ai.ts
│   ├── App.vue · main.ts · pages.json · manifest.json
├── cloudfunctions/                # 云函数
│   ├── galgame-ai/                # AI 调用（line / openLine / report / image）
│   ├── galgame-stats/             # 全站匿名统计
│   └── hello/ · common/           # 模板自带示例
├── cloudbaserc.json               # CloudBase CLI 部署配置
├── vite.config.ts · tsconfig.json
└── package.json
```

## 快速开始

### 环境要求

- Node.js 16+
- 一个腾讯云开发（CloudBase）账号，并创建环境（可在 [CloudBase 控制台](https://tcb.cloud.tencent.com/) 免费开通）
- 本地开发微信小程序需安装微信开发者工具；App 端需 HBuilderX

### 1. 安装依赖

```bash
npm install
```

### 2. 配置云开发环境

在项目根目录创建 `.env.local`（或直接编辑 `src/utils/cloudbase.ts` 中的 `ENV_ID`）：

```env
VITE_ENV_ID=你的云开发环境ID
VITE_PUBLISHABLE_KEY=你的Publishable Key
```

- 环境 ID（envId）与环境密钥可在 [CloudBase 控制台](https://tcb.cloud.tencent.com/dev?envId=你的环境ID#/env/apikey) 获取。
- 小程序端还需在 `src/manifest.json` 的 `mp-weixin.appid` 填入微信小程序 AppID。
- 若需启用 AI 能力，请确认环境已开通相应大模型，并按需通过环境变量配置 `GALGAME_TEXT_MODEL` / `GALGAME_IMAGE_MODEL`（见 `cloudfunctions/galgame-ai/index.js` 顶部）。

### 3. 配置安全域名（H5 端）

在 CloudBase 控制台【环境配置 → 安全来源 → 安全域名】中添加：

- 开发：`http://localhost:5173`
- 生产：你的实际部署域名

微信小程序端需在微信公众平台后台配置 CloudBase 相关 request / uploadFile / downloadFile 合法域名。

### 4. 本地开发

```bash
# H5（浏览器，默认 http://localhost:5173）
npm run dev:h5

# 微信小程序（编译输出 dist/dev/mp-weixin，用微信开发者工具导入）
npm run dev:mp-weixin
```

### 5. 类型检查

```bash
npm run type-check
```

## 部署上线

### H5 静态托管

```bash
npm run build:h5                 # 产物在 dist/build/h5/
npx @cloudbase/cli login         # 首次登录
npx @cloudbase/cli hosting deploy dist/build/h5 -e 你的环境ID
```

也可直接使用 `tcb framework deploy` 按 `cloudbaserc.json` 中的配置一键部署。

### 微信小程序

```bash
npm run build:mp-weixin          # 产物在 dist/build/mp-weixin/
```

用微信开发者工具打开 `dist/build/mp-weixin`，填写 AppID 后上传代码并提交审核发布。

### 云函数

```bash
npx @cloudbase/cli fn deploy galgame-ai -e 你的环境ID
npx @cloudbase/cli fn deploy galgame-stats -e 你的环境ID
```

`cloudbaserc.json` 已预置两个云函数的部署配置（Node.js 18.15，自动安装依赖）。

## 云函数说明

### galgame-ai

通过 `action` 分发，提供四类 AI 能力：

| action | 说明 |
|--------|------|
| `line` | 选择后角色回应台词 + 内心 OS（带反差感） |
| `openLine` | 开放题，玩家输入一段话，角色以人设口吻回应 |
| `report` | 结局总结判词（MBTI 式人格点评风格） |
| `image` | 结局 Q 版纪念图（文生图，服务端 node-sdk 生成） |

Prompt 模板全部在云函数内拼接，前端仅透传业务参数与语言标记；支持中英文。

### galgame-stats

提供 `incStats` / `getStats` / `initStats` 三个 action，基于云数据库 `galgame_stats` 集合中唯一文档 `global` 做原子自增统计（性别、角色、剧本、人格、设备、浏览器等维度），所有枚举字段均做白名单校验。

## 常用脚本

| 命令 | 作用 |
|------|------|
| `npm run dev:h5` | 启动 H5 开发服务器 |
| `npm run dev:mp-weixin` | 微信小程序开发编译（watch） |
| `npm run build:h5` | 构建 H5 生产包 |
| `npm run build:mp-weixin` | 构建微信小程序生产包 |
| `npm run type-check` | TypeScript 类型检查 |

## 相关链接

- [腾讯云开发 CloudBase 控制台](https://tcb.cloud.tencent.com/)
- [CloudBase 文档](https://docs.cloudbase.net/)
- [CloudBase AI+ 文档](https://docs.cloudbase.net/ai/ai-plus)
- [CloudBase AI ToolKit](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)
- [UniApp 官方文档](https://uniapp.dcloud.io/)

---

> 本项目基于 CloudBase UniApp 模板初始化，由 [CloudBase AI ToolKit](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit) 生态支持开发。
