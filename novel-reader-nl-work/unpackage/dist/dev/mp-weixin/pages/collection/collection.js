"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_path = require("../../utils/path.js");
const _sfc_main = {
  data() {
    return {
      collection: []
      // 初始化空数组，用于存储从本地获取的收藏书籍
    };
  },
  methods: {
    // 路径转换方法
    convertStaticPath(path) {
      return utils_path.convertStaticPath(path);
    },
    // 从本地存储中加载收藏的书籍
    loadCollection() {
      common_vendor.index.getStorage({
        key: "collectedBooks",
        success: (res) => {
          this.collection = res.data || [];
        },
        fail: () => {
          this.collection = [];
        }
      });
    },
    // 移除收藏的书籍
    removeFromCollection(bookId) {
      common_vendor.index.getStorage({
        key: "collectedBooks",
        success: (res) => {
          let collectedBooks = res.data || [];
          const index = collectedBooks.findIndex((book) => book.id === bookId);
          if (index !== -1) {
            collectedBooks.splice(index, 1);
            common_vendor.index.setStorage({
              key: "collectedBooks",
              data: collectedBooks,
              success: () => {
                this.loadCollection();
                common_vendor.index.showToast({
                  title: "移除成功",
                  icon: "success"
                });
              },
              fail: () => {
                common_vendor.index.showToast({
                  title: "移除失败",
                  icon: "none"
                });
              }
            });
          }
        },
        fail: () => {
          common_vendor.index.showToast({
            title: "获取收藏列表失败",
            icon: "none"
          });
        }
      });
    }
  },
  onShow() {
    this.loadCollection();
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.collection, (book, k0, i0) => {
      return {
        a: $options.convertStaticPath(book.cover),
        b: common_vendor.t(book.name),
        c: common_vendor.t(book.author),
        d: common_vendor.o(($event) => $options.removeFromCollection(book.id), book.id),
        e: book.id
      };
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cd17183b"]]);
wx.createPage(MiniProgramPage);
