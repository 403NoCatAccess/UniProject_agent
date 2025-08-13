"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: this.$statusBarHeight
    };
  },
  methods: {
    changeToAiChat() {
      console.log("跳转到聊天界面...");
      common_vendor.index.navigateTo({
        url: "/pages/ai/deepseek"
      });
    },
    changeToBluetooth() {
      console.log("跳转到蓝牙上位机...");
      common_vendor.index.navigateTo({
        url: "/pages/bluetooth/bluetooth"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: `${$data.statusBarHeight}px`,
    b: common_vendor.o((...args) => $options.changeToAiChat && $options.changeToAiChat(...args)),
    c: common_vendor.o((...args) => $options.changeToBluetooth && $options.changeToBluetooth(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
