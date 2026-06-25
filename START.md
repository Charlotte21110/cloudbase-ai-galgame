# Galgame CloudBase AI · 快速启动手册

> 三端项目：**微信小程序（主） + H5 + iOS/Android App**
> 技术栈：**UniApp (Vue 3 + Vite + TypeScript) + @cloudbase/js-sdk + @cloudbase/adapter-uni-app**

---

## 一、技术栈选型说明

| 项 | 选择 | 说明 |
|----|------|------|
| 跨端框架 | **UniApp (Vue 3)** | 一套代码出微信小程序 / H5 / iOS / Android，不用 Flutter |
| 构建工具 | **Vite** | 官方最新模板已用 Vite |
| CloudBase SDK | **`@cloudbase/js-sdk` + `@cloudbase/adapter-uni-app`** | 不是 node-sdk（那是后端用的），也不是 `wx-server-sdk`；这是浏览器/小程序通用的 JS SDK，再套 UniApp 适配器，三端共用一份调用代码 |
| 后端 | CloudBase（云函数 + 云数据库 + 云存储 + 身份认证） | 不用自建服务器 |

> 为什么不用 `wx.cloud` / `wx-server-sdk`？
> - `wx.cloud` 只在微信小程序里能跑，**H5 和 App 用不了**，不满足三端要求。
> - `wx-server-sdk` 是云函数**服务端**用的，不是端上代码。
> - `@cloudbase/js-sdk` 是 CloudBase 官方多端 SDK，配合 `adapter-uni-app` 适配器，**微信小程序 / H5 / App 三端通用**。

---

## 二、首次准备（一次性）

### 1. 安装依赖（已在后台启动）
```bash
# 如果已自动跑完可跳过；想手动重装：
npm install
```
查看安装进度：`tail -f /tmp/galgame-npm-install.log`

### 2. 开通 CloudBase 环境（免费额度够用）
- 打开 https://tcb.cloud.tencent.com/
- 微信扫码登录 → 新建环境（按量计费的免费额度版即可）
- 复制 **环境 ID（envId）**
- 进入 `环境-应用配置 / API 密钥` 页面：https://tcb.cloud.tencent.com/dev?envId=你的环境ID#/env/apikey
  - 复制 **Publishable Key**（端上访问云资源用，安全可公开）

### 3. 填入配置
编辑 `src/utils/cloudbase.ts`，或者在项目根创建 `.env.local`：
```env
VITE_ENV_ID=你的环境ID
VITE_PUBLISHABLE_KEY=你的Publishable Key
```

### 4. 填小程序 AppID
编辑 `src/manifest.json` → `mp-weixin.appid` 填上你的微信小程序 AppID。
（没有 AppID 也可以先用测试号跑，但云开发部分功能会受限）

---

## 三、三端运行方法

### 🟢 微信小程序端（主推）
```bash
npm run dev:mp-weixin
```
编译结果输出到：`dist/dev/mp-weixin/`

然后：
1. 打开 **微信开发者工具**
2. `项目 → 导入项目 → 目录选择` 上一步的 `dist/dev/mp-weixin/`
3. 填入 AppID（与 manifest.json 一致），就能在小程序模拟器里跑了
4. 上传：点开发者工具右上角"上传" → 按版本号上传 → 在小程序后台提交审核发布

> ⚠️ 微信小程序后台 **request 合法域名** 需加上：`https://*.tcb-api.tencentcloudapi.com`、`https://tcb-api.tencentcloudapi.com` 等 CloudBase 相关域名（具体见 CloudBase 控制台"环境-安全配置"）。

### 🟢 H5 / 电脑浏览器端
```bash
npm run dev:h5         # 开发：默认 http://localhost:5173
npm run build:h5       # 生产构建到 dist/build/h5/
```
H5 部署到 CloudBase 静态托管：
```bash
npx @cloudbase/cli login          # 首次需登录
npx @cloudbase/cli hosting deploy dist/build/h5 -e 你的envId
```

### 🟢 移动 App 端（iOS + Android）
需要用 **HBuilderX**（DCloud 官方 IDE）：
1. 下载 HBuilderX：https://www.dcloud.io/hbuilderx.html
2. `文件 → 打开目录` 选当前项目
3. `发行 → 原生 App-云打包` 选择 iOS / Android，按引导走
4. 出 ipa / apk 包

> App 端首次需要配置 `appSign` + `appSecret`，编辑 `src/utils/cloudbase.ts` 里的对应字段，密钥从 CloudBase 控制台的 App 安全配置获取。

---

## 四、目录速览

```
├── src/
│   ├── pages/                    页面（首页 / demo / login / profile）
│   ├── components/               公共组件
│   ├── utils/cloudbase.ts        ★ 云开发初始化 + 登录/认证封装
│   ├── App.vue · main.ts
│   ├── pages.json                页面路由
│   └── manifest.json             ★ 小程序 AppID / App 包配置
├── cloudfunctions/               云函数（部署到 CloudBase）
│   └── hello/
├── cloudbaserc.json              ★ CloudBase CLI 配置，记得把 envId 填上
├── vite.config.ts
└── package.json
```

---

## 五、常用脚本速查

| 命令 | 作用 |
|------|------|
| `npm run dev:mp-weixin` | 启动微信小程序开发编译（watch 模式） |
| `npm run dev:h5` | 启动 H5 开发服务器 |
| `npm run build:mp-weixin` | 生产构建小程序 |
| `npm run build:h5` | 生产构建 H5 |
| `npm run type-check` | TypeScript 类型检查 |

---

## 六、下一步建议

1. ✅ 等 `npm install` 跑完 → `npm run dev:mp-weixin` 看能不能编译出 `dist/dev/mp-weixin`
2. 注册 CloudBase 环境，把 envId / Publishable Key 填上
3. 在 `src/pages/` 里删掉示例页，开始写你的 Galgame 业务页面
4. 业务逻辑写云函数放到 `cloudfunctions/`，用 `npx @cloudbase/cli fn deploy` 部署
