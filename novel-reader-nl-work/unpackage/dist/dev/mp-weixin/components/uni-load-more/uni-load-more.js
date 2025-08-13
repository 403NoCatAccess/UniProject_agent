"use strict";
const common_vendor = require("../../common/vendor.js");
const platform = common_vendor.index.getSystemInfoSync().platform;
const _sfc_main = {
  name: "UniLoadMore",
  props: {
    status: {
      // 上拉的状态：more-loading前；loading-loading中；noMore-没有更多了
      type: String,
      default: "more"
    },
    showIcon: {
      type: Boolean,
      default: true
    },
    iconType: {
      type: String,
      default: "auto"
    },
    iconSize: {
      type: Number,
      default: 24
    },
    color: {
      type: String,
      default: "#777777"
    },
    contentText: {
      type: Object,
      default() {
        return {
          contentdown: "上拉显示更多",
          contentrefresh: "正在加载...",
          contentnomore: "没有更多数据了"
        };
      }
    }
  },
  data() {
    return {
      webviewHide: false,
      platform
    };
  },
  computed: {
    iconSnowWidth() {
      return (Math.floor(this.iconSize / 24) || 1) * 2;
    }
  },
  mounted() {
  },
  methods: {
    onClick() {
      this.$emit("clickLoadMore", {
        detail: {
          status: this.status
        }
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.webviewHide && ($props.iconType === "circle" || $props.iconType === "auto" && $data.platform === "android") && $props.status === "loading" && $props.showIcon
  }, !$data.webviewHide && ($props.iconType === "circle" || $props.iconType === "auto" && $data.platform === "android") && $props.status === "loading" && $props.showIcon ? {
    b: $props.color,
    c: $props.iconSize / 12,
    d: $props.color,
    e: $props.iconSize / 12,
    f: $props.color,
    g: $props.iconSize / 12,
    h: $props.iconSize + "px",
    i: $props.iconSize + "px"
  } : !$data.webviewHide && $props.status === "loading" && $props.showIcon ? {
    k: $props.iconSize + "px",
    l: $props.iconSize + "px"
  } : {}, {
    j: !$data.webviewHide && $props.status === "loading" && $props.showIcon,
    m: common_vendor.t($props.status === "more" ? $props.contentText.contentdown : $props.status === "loading" ? $props.contentText.contentrefresh : $props.contentText.contentnomore),
    n: $props.color,
    o: common_vendor.o((...args) => $options.onClick && $options.onClick(...args))
  });
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7896609e"]]);
wx.createComponent(Component);
