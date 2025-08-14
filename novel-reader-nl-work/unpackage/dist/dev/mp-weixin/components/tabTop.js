"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    tabIndex: {
      type: Number,
      default: 0
    },
    tabArr: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    changeTabIndex(index) {
      this.$emit("getTabIndex", index);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($props.tabArr, (item, index, i0) => {
      return {
        a: common_vendor.t(item),
        b: common_vendor.n($props.tabIndex === index ? "font-weight-bold" : ""),
        c: $props.tabIndex === index,
        d: common_vendor.o(($event) => $options.changeTabIndex(index), index),
        e: index
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
