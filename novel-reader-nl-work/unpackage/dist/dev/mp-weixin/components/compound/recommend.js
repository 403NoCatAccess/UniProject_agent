"use strict";
const common_vendor = require("../../common/vendor.js");
const listHeader = () => "../listHeader.js";
const _sfc_main = {
  components: {
    listHeader
  },
  props: {
    Rebooks: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    toBookDetail(bookId) {
      common_vendor.index.navigateTo({
        url: `/pages/bookDetail/bookDetail?bookId=${bookId}`
      });
    }
  }
};
if (!Array) {
  const _component_list_header = common_vendor.resolveComponent("list-header");
  _component_list_header();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.p({
      title: "猜你喜欢"
    }),
    b: common_vendor.f($props.Rebooks, (item, index, i0) => {
      return {
        a: item.cover,
        b: common_vendor.t(item.name),
        c: common_vendor.o(($event) => $options.toBookDetail(item.bookId), index),
        d: index
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
