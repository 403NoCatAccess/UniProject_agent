"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      searchText: ""
      //绑定要搜索的书名
    };
  },
  methods: {
    handleSearch() {
      common_vendor.index.navigateTo({
        url: `/pages/searchResults/searchResults?bookName=${this.searchText}`
        // 跳转到搜索结果页面，并传递书名作为查询参数
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
    a: common_vendor.p({
      ["icon-Id"]: "icon-tubiao11",
      ["icong-Color"]: "text-light-muted",
      ["icon-Size"]: "25rpx"
    }),
    b: common_vendor.o((...args) => $options.handleSearch && $options.handleSearch(...args)),
    c: $data.searchText,
    d: common_vendor.o(($event) => $data.searchText = $event.detail.value)
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
