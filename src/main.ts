import { createSSRApp } from "vue";
import App from "./App.vue";
import i18n from "./locale";
// import { initCloudBase } from "./utils/cloudbase";
import showCaptcha from "./components/show-captcha.vue";
import LangSwitch from "./components/lang-switch.vue";
import UniPopup from "@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue"
import UniLoadMore from "@dcloudio/uni-ui/lib/uni-load-more/uni-load-more.vue"
import UniTransition from "@dcloudio/uni-ui/lib/uni-transition/uni-transition.vue"


export function createApp() {
  const app = createSSRApp(App);

  app.use(i18n);

  app.component("show-captcha", showCaptcha);
  app.component("lang-switch", LangSwitch);
  app.component("uni-popup", UniPopup);
  app.component("uni-load-more", UniLoadMore);
  app.component("uni-transition", UniTransition);
  
  return {
    app,
  };
}
