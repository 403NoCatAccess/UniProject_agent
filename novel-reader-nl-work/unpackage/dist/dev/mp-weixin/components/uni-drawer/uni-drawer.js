"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  name: "UniDrawer",
  props: {
    /**
     * 显示状态
     */
    visible: {
      type: Boolean,
      default: false
    },
    /**
     * 显示模式（左、右），只在初始化生效
     */
    mode: {
      type: String,
      default: ""
    },
    /**
     * 蒙层显示状态
     */
    mask: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      visibleSync: false,
      showDrawer: false,
      rightMode: false,
      watchTimer: null
    };
  },
  watch: {
    visible(val) {
      if (val) {
        this.open();
      } else {
        this.close();
      }
    }
  },
  created() {
    this.visibleSync = this.visible;
    setTimeout(() => {
      this.showDrawer = this.visible;
    }, 100);
    this.rightMode = this.mode === "right";
  },
  methods: {
    close() {
      this._change("showDrawer", "visibleSync", false);
    },
    open() {
      this._change("visibleSync", "showDrawer", true);
    },
    _change(param1, param2, status) {
      this[param1] = status;
      if (this.watchTimer) {
        clearTimeout(this.watchTimer);
      }
      this.watchTimer = setTimeout(() => {
        this[param2] = status;
        this.$emit(status ? "open" : "close");
      }, status ? 50 : 300);
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.visibleSync
  }, $data.visibleSync ? {
    b: $data.showDrawer && $props.mask ? 1 : "",
    c: common_vendor.o((...args) => $options.close && $options.close(...args)),
    d: $data.rightMode ? 1 : "",
    e: !$data.rightMode ? 1 : "",
    f: $data.showDrawer ? 1 : "",
    g: $data.showDrawer ? 1 : ""
  } : {});
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-07da3825"]]);
wx.createComponent(Component);
