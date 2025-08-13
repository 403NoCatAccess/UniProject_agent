"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_path = require("../../utils/path.js");
const searchBox = () => "../../components/searchBox.js";
const rotationChart = () => "../../components/rotationChart.js";
const recommend = () => "../../components/compound/recommend.js";
const bookList = () => "../../components/bookList.js";
const listHeader = () => "../../components/listHeader.js";
const _sfc_main = {
  components: {
    searchBox,
    rotationChart,
    recommend,
    listHeader,
    bookList
  },
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
      swiperImages: [],
      functionSortArr: [],
      Rebooks: [],
      // 原始推荐书籍数据
      bookList: [],
      // 原始书籍列表数据
      safeRebooks: [],
      // 转换后的推荐书籍
      safeBookList: [],
      // 转换后的书籍列表
      bookName: 0,
      loading: false,
      showError: false,
      errorMessage: ""
    };
  },
  methods: {
    async findswiperImages() {
      try {
        console.log("[findswiperImages] 开始加载数据");
        this.loading = true;
        this.showError = false;
        const networkType = await new Promise((resolve) => {
          common_vendor.wx$1.getNetworkType({
            success: (res2) => resolve(res2.networkType),
            fail: () => resolve(null)
          });
        });
        if (!networkType || networkType === "none") {
          throw new Error("网络连接不可用，请检查网络设置");
        }
        console.log("[findswiperImages] 网络状态正常:", networkType);
        const app = getApp();
        if (!app.globalData || !app.globalData.staticBasePath) {
          throw new Error("资源路径未初始化");
        }
        console.log("[findswiperImages] 使用的资源路径:", app.globalData.staticBasePath);
        const maxRetries = 3;
        let retryCount = 0;
        let res;
        while (retryCount < maxRetries) {
          try {
            console.log(`[findswiperImages] 尝试API请求 (${retryCount + 1}/${maxRetries})`);
            res = await this.$http.get("/index/loadData", {
              timeout: 1e4
            });
            break;
          } catch (e) {
            retryCount++;
            if (retryCount >= maxRetries) {
              console.error("[findswiperImages] API请求失败次数达到上限");
              throw e;
            }
            console.warn(`[findswiperImages] API请求失败，${2}秒后重试`);
            await new Promise((resolve) => setTimeout(resolve, 2e3));
          }
        }
        console.log("[findswiperImages] API请求成功");
        if (!res.data || typeof res.data !== "object") {
          throw new Error("API返回数据格式错误");
        }
        const data = res.data;
        console.log("[findswiperImages] API响应数据:", data);
        console.log("[findswiperImages] 开始批量路径转换");
        this.swiperImages = data.swiperImages.map((item) => ({
          ...item,
          src: utils_path.convertStaticPath(item.param8)
        }));
        this.functionSortArr = data.functionSortArr.map((item) => ({
          ...item,
          iconId: item.param1,
          iconColor: item.param2,
          name: item.param7,
          src: utils_path.convertStaticPath(item.param8)
        }));
        this.Rebooks = data.Rebooks;
        this.safeRebooks = data.Rebooks.map((book) => ({
          ...book,
          cover: utils_path.convertStaticPath(book.cover)
        }));
        this.bookList = data.bookResources;
        this.safeBookList = data.bookResources.map((category) => ({
          ...category,
          books: category.books.map((book) => ({
            ...book,
            indexImg: utils_path.convertStaticPath(book.indexImg)
          }))
        }));
        console.log("[findswiperImages] 路径转换完成");
        console.log("转换后的推荐书籍:", this.safeRebooks);
        console.log("转换后的书籍列表:", this.safeBookList);
      } catch (err) {
        console.error("[findswiperImages] 数据加载失败:", err);
        let errorMsg = "未知错误";
        if (typeof err === "string") {
          errorMsg = err;
        } else if (err && err.message) {
          errorMsg = err.message;
        } else if (err && err.errMsg) {
          errorMsg = err.errMsg;
        }
        this.errorMessage = errorMsg;
        this.showError = true;
        common_vendor.index.showToast({
          title: `加载失败: ${errorMsg}`,
          icon: "none",
          duration: 3e3
        });
      } finally {
        this.loading = false;
        console.log("[findswiperImages] 加载过程结束");
      }
    },
    retryLoad() {
      console.log("[retryLoad] 用户点击重试");
      this.showError = false;
      this.findswiperImages();
    },
    switchToPage(index) {
      const pages = [
        "/pages/music/music",
        "/pages/sort/sort",
        "/pages/collection/collection",
        "/pages/mine/mine"
      ];
      if (pages[index]) {
        common_vendor.index.navigateTo({
          url: pages[index]
        });
      }
    },
    handleSearch(bookName) {
      this.bookName = bookName;
      console.log("搜索书名:", this.bookName);
    }
  },
  onShow() {
    this.findswiperImages();
  }
};
if (!Array) {
  const _component_search_box = common_vendor.resolveComponent("search-box");
  const _component_rotation_chart = common_vendor.resolveComponent("rotation-chart");
  const _component_my_icon = common_vendor.resolveComponent("my-icon");
  const _component_recommend = common_vendor.resolveComponent("recommend");
  const _component_list_header = common_vendor.resolveComponent("list-header");
  const _component_book_list = common_vendor.resolveComponent("book-list");
  (_component_search_box + _component_rotation_chart + _component_my_icon + _component_recommend + _component_list_header + _component_book_list)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: `${$data.statusBarHeight}px`,
    b: common_vendor.o($options.handleSearch),
    c: $data.loading
  }, $data.loading ? {} : {}, {
    d: $data.showError
  }, $data.showError ? {
    e: common_vendor.t($data.errorMessage),
    f: common_vendor.o((...args) => $options.retryLoad && $options.retryLoad(...args))
  } : {
    g: common_vendor.p({
      imgArr: $data.swiperImages
    }),
    h: common_vendor.f($data.functionSortArr, (item, index, i0) => {
      return {
        a: "ecdb1d8c-2-" + i0,
        b: common_vendor.p({
          iconId: item.iconId,
          iconColor: item.iconColor,
          iconSize: "65rpx"
        }),
        c: common_vendor.t(item.name),
        d: index
      };
    }),
    i: common_vendor.p({
      Rebooks: $data.safeRebooks
    }),
    j: common_vendor.f($data.safeBookList, (item, index, i0) => {
      return {
        a: "ecdb1d8c-4-" + i0,
        b: common_vendor.p({
          title: item.category.cname
        }),
        c: "ecdb1d8c-5-" + i0,
        d: common_vendor.p({
          bookListArr: item.books
        }),
        e: index
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
