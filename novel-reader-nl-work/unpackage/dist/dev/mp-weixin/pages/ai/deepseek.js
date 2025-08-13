"use strict";
const common_vendor = require("../../common/vendor.js");
const common_deepSeekApi = require("../../common/deepSeekApi.js");
const pageTitle = () => "../../components/pageTitle.js";
const CROP_DATABASE = {
  "番茄": { temp: 25, humidity: 60 },
  "生菜": { temp: 18, humidity: 70 },
  "黄瓜": { temp: 28, humidity: 65 },
  "草莓": { temp: 22, humidity: 75 },
  "辣椒": { temp: 30, humidity: 55 },
  "玫瑰": { temp: 20, humidity: 65 },
  "郁金香": { temp: 18, humidity: 60 },
  "小麦": { temp: 15, humidity: 50 }
};
const _sfc_main = {
  components: {
    pageTitle
  },
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
      yourMessage: "",
      // 用户输入的消息
      chatHistory: [],
      // 聊天历史记录
      loading: false,
      // 加载状态
      scrollTop: 0,
      // 滚动条位置
      fixedTopHeight: 0,
      // 顶部固定区域高度（动态计算）
      // 作物培育状态
      cropName: "",
      // 当前培育的作物名称
      suitableTemp: 0,
      // 适宜温度
      suitableHumidity: 0,
      // 适宜湿度
      currentStatus: "待机中",
      // 当前状态（正在调节/调节完毕）
      currentTemp: 24,
      // 当前温度（模拟数据）
      currentHumidity: 55,
      // 当前湿度（模拟数据）
      // 定时器
      tempHumidityTimer: null,
      // 温湿度模拟定时器
      adjustmentTimer: null
      // 调节状态定时器
    };
  },
  computed: {
    // 根据状态设置样式
    statusClass() {
      return this.currentStatus === "正在调节" ? "status-adjusting" : "status-ok";
    }
  },
  watch: {
    // 监听聊天记录变化，保持最新10条记录
    chatHistory(newVal) {
      if (newVal.length > 10) {
        this.chatHistory = newVal.slice(-10);
      }
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    this.loadChatHistory();
    this.startTempHumiditySimulation();
    this.setupKeyboardListener();
    this.$nextTick(() => {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".fixed-top").boundingClientRect((data) => {
        if (data) {
          this.fixedTopHeight = data.height;
        }
      }).exec();
    });
  },
  beforeDestroy() {
    clearInterval(this.tempHumidityTimer);
    clearInterval(this.adjustmentTimer);
    common_vendor.index.offKeyboardHeightChange();
  },
  methods: {
    // 设置键盘监听
    setupKeyboardListener() {
      common_vendor.index.onKeyboardHeightChange((res) => {
        if (res.height > 0) {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      });
    },
    // 滚动到底部
    scrollToBottom() {
      this.scrollTop = Math.random() * 1e4;
    },
    // 加载聊天历史记录
    loadChatHistory() {
      common_vendor.index.getStorage({
        key: "chatHistory",
        success: (res) => {
          if (res.data) {
            this.chatHistory = res.data;
            if (this.chatHistory.length > 10) {
              this.chatHistory = this.chatHistory.slice(-10);
            }
          }
        },
        fail: () => {
          console.log("获取聊天记录失败");
        }
      });
    },
    // 保存聊天历史记录（只保存最新10条）
    saveChatHistory() {
      const saveMessages = this.chatHistory.slice(-10);
      common_vendor.index.setStorage({
        key: "chatHistory",
        data: saveMessages,
        success: () => {
          console.log("聊天记录保存成功");
        },
        fail: () => {
          console.log("聊天记录保存失败");
        }
      });
    },
    // 开始温湿度模拟
    startTempHumiditySimulation() {
      this.tempHumidityTimer = setInterval(() => {
        this.currentTemp += (Math.random() - 0.5) * 2;
        this.currentHumidity += (Math.random() - 0.5) * 2;
        this.currentTemp = Math.max(10, Math.min(40, this.currentTemp));
        this.currentHumidity = Math.max(30, Math.min(90, this.currentHumidity));
        this.checkAdjustmentNeeded();
      }, 5e3);
    },
    // 检查是否需要调节环境（误差范围改为1%）
    checkAdjustmentNeeded() {
      if (!this.cropName)
        return;
      const tempDiff = Math.abs(this.currentTemp - this.suitableTemp);
      const humidityDiff = Math.abs(this.currentHumidity - this.suitableHumidity);
      const tempThreshold = this.suitableTemp * 0.01;
      const humidityThreshold = this.suitableHumidity * 0.01;
      if (tempDiff > tempThreshold || humidityDiff > humidityThreshold) {
        if (this.currentStatus !== "正在调节") {
          this.currentStatus = "正在调节";
          this.startAdjustment();
        }
      } else if (this.currentStatus !== "调节完毕") {
        this.currentStatus = "调节完毕";
        clearInterval(this.adjustmentTimer);
        this.adjustmentTimer = null;
      }
    },
    // 开始调节过程
    startAdjustment() {
      if (this.adjustmentTimer)
        return;
      this.adjustmentTimer = setInterval(() => {
        if (this.currentTemp < this.suitableTemp) {
          this.currentTemp += 0.5;
        } else if (this.currentTemp > this.suitableTemp) {
          this.currentTemp -= 0.5;
        }
        if (this.currentHumidity < this.suitableHumidity) {
          this.currentHumidity += 0.5;
        } else if (this.currentHumidity > this.suitableHumidity) {
          this.currentHumidity -= 0.5;
        }
        this.checkAdjustmentNeeded();
      }, 1e3);
    },
    // 发送消息给DeepSeek
    async sendMessage() {
      if (this.yourMessage.trim() === "") {
        return;
      }
      this.loading = true;
      const userMessage = this.yourMessage;
      this.chatHistory.push({ type: "user", text: userMessage });
      this.yourMessage = "";
      try {
        const aiResponse = await this.processCropRequest(userMessage);
        console.log("DeepSeek API响应:", aiResponse);
        if (aiResponse.cropName) {
          this.cropName = aiResponse.cropName;
        }
        this.chatHistory.push({ type: "ai", text: aiResponse.response });
        if (aiResponse.commands && aiResponse.commands.length > 0) {
          this.executeCommands(aiResponse.commands);
        }
        this.saveChatHistory();
      } catch (error) {
        console.error("处理作物请求失败:", error);
        this.chatHistory.push({
          type: "ai",
          text: "抱歉，处理您的请求时出错，请稍后再试。"
        });
      } finally {
        this.loading = false;
      }
    },
    // 处理作物请求 - 调用DeepSeek API
    async processCropRequest(userMessage) {
      const aiResponse = await common_deepSeekApi.callDeepSeekApi(userMessage, CROP_DATABASE);
      return aiResponse;
    },
    // 执行命令
    executeCommands(commands) {
      commands.forEach((command) => {
        console.log("执行命令:", command);
        switch (command.command) {
          case "set_target":
            const [temp, humidity] = command.params.split(",");
            this.setTargetEnvironment(parseFloat(temp), parseFloat(humidity));
            break;
          case "start_adjustment":
            this.startAdjustment();
            break;
          case "stop_adjustment":
            this.stopAdjustment();
            break;
          default:
            console.warn("未知命令:", command.command);
        }
      });
    },
    // 设置目标环境
    setTargetEnvironment(temp, humidity) {
      this.suitableTemp = temp;
      this.suitableHumidity = humidity;
      this.sendControlToDevice(temp, humidity);
      this.currentStatus = "正在调节";
      this.startAdjustment();
    },
    // 停止调节
    stopAdjustment() {
      this.currentStatus = "调节完毕";
      clearInterval(this.adjustmentTimer);
      this.adjustmentTimer = null;
    },
    // 发送控制指令到下位机
    sendControlToDevice(temp, humidity) {
      console.log(`发送温湿度设置到ESP32: 温度=${temp}°C, 湿度=${humidity}%`);
      this.$emit("control-device", { temp, humidity });
      common_vendor.index.showToast({
        title: "已发送环境设置到下位机",
        icon: "success"
      });
    }
  }
};
if (!Array) {
  const _component_page_title = common_vendor.resolveComponent("page-title");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_component_page_title + _easycom_uni_load_more2)();
}
const _easycom_uni_load_more = () => "../../components/uni-load-more/uni-load-more.js";
if (!Math) {
  _easycom_uni_load_more();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.statusBarHeight + "px",
    b: common_vendor.p({
      title: "智能体助手",
      Theme: "geryTheme"
    }),
    c: common_vendor.t($data.cropName || "未设定"),
    d: common_vendor.t($data.suitableTemp.toFixed(1)),
    e: common_vendor.t($data.suitableHumidity.toFixed(1)),
    f: common_vendor.t($data.currentStatus),
    g: common_vendor.n($options.statusClass),
    h: common_vendor.t($data.currentTemp.toFixed(1)),
    i: common_vendor.t($data.currentHumidity.toFixed(1)),
    j: common_vendor.f($data.chatHistory, (message, index, i0) => {
      return {
        a: common_vendor.t(message.text),
        b: index,
        c: common_vendor.n(message.type === "user" ? "user-message" : "ai-message")
      };
    }),
    k: $data.scrollTop,
    l: `${$data.fixedTopHeight}px`,
    m: $data.loading ? "AI输入中..." : "请输入要培育的作物名称（如：番茄、生菜）",
    n: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    o: $data.yourMessage,
    p: common_vendor.o(($event) => $data.yourMessage = $event.detail.value),
    q: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    r: !$data.loading,
    s: $data.loading,
    t: common_vendor.p({
      status: "loading"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
