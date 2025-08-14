"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      statusBarHeight: this.$statusBarHeight
    };
  },
  props: {
    title: {
      type: String,
      default: ""
    },
    Theme: {
      type: String,
      default: ""
    }
  },
  methods: {
    quit() {
      common_vendor.index.navigateBack({
        data: 1
      });
    },
    changeToAiChat() {
      console.log("跳转到聊天界面...");
      common_vendor.index.navigateTo({
        url: "/pages/ai/deepseek"
      });
    },
    changeToIndex() {
      common_vendor.index.switchTab({
        url: "/pages/index/index"
      });
    }
  }
};
if (!Array) {
  const _component_my_icon = common_vendor.resolveComponent("my-icon");
  _component_my_icon();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: `$(statusBarHeight)px`,
    b: common_vendor.o($options.quit),
    c: common_vendor.p({
      iconId: "icon-jiantou-copy"
    }),
    d: common_vendor.o($options.changeToIndex),
    e: common_vendor.p({
      iconId: "icon-shouye"
    }),
    f: common_vendor.t($props.title),
    g: common_vendor.p({
      iconId: "icon-yanjing"
    }),
    h: common_vendor.o((...args) => $options.changeToAiChat && $options.changeToAiChat(...args))
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
