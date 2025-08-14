"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = {
  props: {
    bookListArr: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    navigateToDetail(bookId) {
      console.log("[navigateToDetail] 跳转到书籍详情", bookId);
      common_vendor.index.navigateTo({
        url: `/pages/bookDetail/bookDetail?bookId=${bookId}`
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($props.bookListArr, (book, bindex, i0) => {
      return {
        a: book.indexImg,
        b: common_vendor.t(book.name),
        c: common_vendor.t(book.description),
        d: common_vendor.o(($event) => $options.navigateToDetail(book.bookId), bindex),
        e: bindex
      };
    })
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createComponent(Component);
