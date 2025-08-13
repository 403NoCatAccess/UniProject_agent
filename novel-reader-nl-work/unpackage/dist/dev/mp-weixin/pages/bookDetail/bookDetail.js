"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_path = require("../../utils/path.js");
const common_unit = require("../../common/unit.js");
const pageTitle = () => "../../components/pageTitle.js";
const tabTop = () => "../../components/tabTop.js";
const _sfc_main = {
  components: {
    pageTitle,
    tabTop
  },
  data() {
    return {
      book: {
        name: "",
        briefInteoduction: "图书简介...",
        author: "",
        cover: ""
      },
      isCollected: false,
      // 用于记录当前书籍是否已收藏,
      tabIndex: 0,
      chapterCatalog: [],
      calHeight: 0,
      statusBarHeight: this.$statusBarHeight
    };
  },
  props: {
    bookId: {
      type: String
    }
  },
  methods: {
    getBookById(bookId) {
      this.$http.get("/book/" + bookId).then((res) => {
        let data = res.data;
        this.book = data;
        this.book.cover = utils_path.convertStaticPath(this.book.cover);
        this.checkIfCollected(data.id);
      });
    },
    getTabIndex(tabIndex) {
      this.tabIndex = tabIndex;
    },
    getCatalogListByBookId(bookId) {
      this.$http.get("/ChapterCatalog/" + bookId).then((res) => {
        let data = res.data;
        this.chapterCatalog = data;
      });
    },
    toReadingPage(catalogId) {
      common_vendor.index.navigateTo({
        url: `/pages/detail/readingPage?catalogId=${catalogId}&bookId=${this.bookId}&bookName=${this.book.name}`
      });
    },
    ////收藏
    toggleCollection() {
      if (this.isCollected) {
        this.removeFromCollection(this.book.id);
      } else {
        this.addToCollection(this.book.id, this.book.name, this.book.author, this.book.cover);
      }
    },
    addToCollection(bookId, bookName, author, cover) {
      common_vendor.index.getStorage({
        key: "collectedBooks",
        success: (res) => {
          let collectedBooks = res.data || [];
          collectedBooks.push({ id: bookId, name: bookName, author, cover });
          this.saveCollectedBooks(collectedBooks);
        },
        fail: () => {
          let collectedBooks = [{ id: bookId, name: bookName, author, cover }];
          this.saveCollectedBooks(collectedBooks);
        }
      });
      this.isCollected = true;
    },
    removeFromCollection(bookId) {
      common_vendor.index.getStorage({
        key: "collectedBooks",
        success: (res) => {
          let collectedBooks = res.data || [];
          const index = collectedBooks.findIndex((book) => book.id === bookId);
          if (index !== -1) {
            collectedBooks.splice(index, 1);
            this.saveCollectedBooks(collectedBooks);
          }
        },
        fail: () => {
          console.log("Failed to load collected books.");
        }
      });
      this.isCollected = false;
    },
    saveCollectedBooks(collectedBooks) {
      common_vendor.index.setStorage({
        key: "collectedBooks",
        data: collectedBooks,
        success: () => {
          console.log("Collected books saved successfully.");
        },
        fail: () => {
          console.log("Failed to save collected books.");
        }
      });
    },
    checkIfCollected(bookId) {
      common_vendor.index.getStorage({
        key: "collectedBooks",
        success: (res) => {
          let collectedBooks = res.data || [];
          this.isCollected = collectedBooks.some((book) => book.id === bookId);
        },
        fail: () => {
          this.isCollected = false;
        }
      });
    }
  },
  mounted() {
    common_unit.unit.calSurplusHeight({
      pageID: this,
      pos: "cal",
      success: (val) => this.calHeight = val
    });
    console.log("bookDetail-this.calHeight->", this.calHeight);
  },
  onShow(options) {
    let bookId = parseInt(this.bookId);
    this.getBookById(bookId);
    this.getCatalogListByBookId(bookId);
  }
};
if (!Array) {
  const _component_page_title = common_vendor.resolveComponent("page-title");
  const _component_tab_top = common_vendor.resolveComponent("tab-top");
  (_component_page_title + _component_tab_top)();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: `${$data.statusBarHeight}px`,
    b: common_vendor.p({
      title: "图书详情",
      Theme: "geryTheme"
    }),
    c: $data.book.cover,
    d: common_vendor.t($data.book.name),
    e: common_vendor.t($data.book.author),
    f: common_vendor.t($data.isCollected ? "取消收藏" : "收藏"),
    g: common_vendor.n($data.isCollected ? "btn-collected" : ""),
    h: common_vendor.o((...args) => $options.toggleCollection && $options.toggleCollection(...args)),
    i: common_vendor.o($options.getTabIndex),
    j: common_vendor.p({
      tabArr: ["详情", "目录"],
      tabIndex: $data.tabIndex
    }),
    k: common_vendor.t($data.book.briefIntroduction),
    l: $data.tabIndex === 0,
    m: `${$data.calHeight}rpx`,
    n: common_vendor.f($data.chapterCatalog, (item, index, i0) => {
      return {
        a: common_vendor.t(item.title),
        b: common_vendor.o(($event) => $options.toReadingPage(item.id), item.id),
        c: item.id
      };
    }),
    o: $data.tabIndex === 1,
    p: `${$data.calHeight}rpx`
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
