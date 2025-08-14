"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_path = require("../../utils/path.js");
const pageTitle = () => "../../components/pageTitle.js";
const _sfc_main = {
  components: {
    pageTitle
  },
  data() {
    return {
      bookName: "",
      AllBooks: [],
      TargetbookArr: [],
      SearchSuccess: false,
      statusBarHeight: this.$statusBarHeight
    };
  },
  methods: {
    isFound() {
      this.$http.get("/index/loadData").then((res) => {
        let bookdata = res.data.bookResources;
        this.SearchSuccess = false;
        bookdata.forEach((itemSort) => {
          itemSort.books.forEach((itembooks) => {
            itembooks.indexImg = utils_path.convertStaticPath(itembooks.indexImg);
            this.AllBooks.push(itembooks);
            console.log("itembooks->", itembooks);
          });
        });
        this.AllBooks.forEach((EveryBook) => {
          console.log("bookname->", EveryBook.name);
          if (EveryBook.name.includes(this.bookName) || EveryBook.description.includes(this.bookName) || EveryBook.author.includes(this.bookName) || EveryBook.briefIntroduction.includes(this.bookName)) {
            this.TargetbookArr.push(EveryBook);
            this.SearchSuccess = true;
            console.log("查找到Targetbook->", this.TargetbookArr);
          }
        });
      });
    },
    toBookDetail(bookId) {
      common_vendor.index.navigateTo({
        url: `/pages/bookDetail/bookDetail?bookId=${bookId}`
      });
    }
  },
  onLoad(options) {
    this.bookName = decodeURIComponent(options.bookName);
    console.log("接收到的书名:", this.bookName);
    this.isFound();
  }
};
if (!Array) {
  const _component_page_title = common_vendor.resolveComponent("page-title");
  _component_page_title();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: `${$data.statusBarHeight}px`,
    b: common_vendor.p({
      title: `搜索结果:${$data.bookName}`,
      Theme: "geryTheme"
    }),
    c: common_vendor.f($data.TargetbookArr, (book, bindex, i0) => {
      return {
        a: book.indexImg,
        b: common_vendor.t(book.name),
        c: common_vendor.t(book.description),
        d: common_vendor.o(($event) => $options.toBookDetail(13), bindex),
        e: bindex
      };
    }),
    d: $data.SearchSuccess,
    e: !$data.SearchSuccess
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
