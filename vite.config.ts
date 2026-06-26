import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
// 说明：
// - dev 模式 base 用 '/'，本地访问就是 http://localhost:5173/#/pages/...
// - build 模式 base 用 '/star/'，产物里资源路径都是 /star/assets/xxx，
//   把 dist/build/h5/ 整个上传到 COS 的 star/ 子目录即可，访问 https://你的域名/star/
export default defineConfig(({ command }) => ({
  plugins: [uni()],
  base: command === "build" ? "/star/" : "/",
  // optimizeDeps: {
  //   exclude: ['@cloudbase/adapter-uni-app'],
  // },
  server: {
    host: "0.0.0.0",
    proxy: {
      "/__auth": {
        target: "https://envId-appid.tcloudbaseapp.com/",
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  },
}));
