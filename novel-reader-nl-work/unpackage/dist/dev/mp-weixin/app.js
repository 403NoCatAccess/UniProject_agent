"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const common_request = require("./common/request.js");
if (!Math) {
  "./pages/loading/loading.js";
  "./pages/index/index.js";
  "./pages/sort/sort.js";
  "./pages/collection/collection.js";
  "./pages/mine/mine.js";
  "./pages/bookDetail/bookDetail.js";
  "./pages/detail/readingPage.js";
  "./pages/searchResults/searchResults.js";
  "./pages/ai/deepseek.js";
  "./pages/music/music.js";
  "./pages/bluetooth/bluetooth.js";
}
const _sfc_main = {
  onLaunch() {
    const currentVersion = "1.0.1";
    const savedVersion = common_vendor.index.getStorageSync("static_version");
    const staticLoaded = common_vendor.index.getStorageSync("static_loaded");
    if (!staticLoaded || savedVersion !== currentVersion) {
      common_vendor.index.reLaunch({ url: "/pages/loading/loading" });
    } else {
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    }
  }
};
const myIcon = () => "./components/myIcon.js";
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  app.component("my-icon", myIcon);
  app.config.globalProperties.$statusBarHeight = common_vendor.index.getSystemInfoSync().statusBarHeight;
  app.config.globalProperties.$http = common_request.request;
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
