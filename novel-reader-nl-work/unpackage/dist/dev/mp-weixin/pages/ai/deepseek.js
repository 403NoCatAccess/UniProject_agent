"use strict";
const common_vendor = require("../../common/vendor.js");
const common_deepSeekApi = require("../../common/deepSeekApi.js");
const common_request = require("../../common/request.js");
const pageTitle = () => "../../components/pageTitle.js";
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
      cropsLoaded: false,
      // 作物数据是否加载完成
      bluetoothConnected: false,
      // 蓝牙连接状态
      // 作物数据库（从后端获取）
      cropDatabase: {},
      // 存储从后端获取的作物数据
      // 作物培育状态
      cropName: "",
      // 当前培育的作物名称
      suitableTemp: 0,
      // 适宜温度
      suitableHumidity: 0,
      // 适宜湿度
      currentStatus: "待机中",
      // 当前状态（正在调节/调节完毕）
      currentTemp: null,
      // 当前温度（从蓝牙获取）
      currentHumidity: null,
      // 当前湿度（从蓝牙获取）
      // 定时器
      tempHumidityTimer: null,
      // 温湿度模拟定时器
      adjustmentTimer: null,
      // 调节状态定时器
      adjustmentStartTime: null
      // 调节开始时间
    };
  },
  computed: {
    // 根据状态设置样式
    statusClass() {
      if (!this.bluetoothConnected)
        return "status-disconnected";
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
    this.loadCropsData().then(() => {
      this.loadChatHistory();
    });
    this.setupKeyboardListener();
    this.$nextTick(() => {
      const query = common_vendor.index.createSelectorQuery().in(this);
      query.select(".fixed-top").boundingClientRect((data) => {
        if (data) {
          this.fixedTopHeight = data.height;
        }
      }).exec();
    });
    common_vendor.index.$on("bluetooth-status", this.handleBluetoothStatus);
    common_vendor.index.$on("sensor-data", this.handleSensorData);
    this.restoreBluetoothState();
  },
  beforeDestroy() {
    clearInterval(this.tempHumidityTimer);
    clearInterval(this.adjustmentTimer);
    common_vendor.index.offKeyboardHeightChange();
    common_vendor.index.$off("bluetooth-status", this.handleBluetoothStatus);
    common_vendor.index.$off("sensor-data", this.handleSensorData);
  },
  methods: {
    // 恢复蓝牙状态
    restoreBluetoothState() {
      const savedState = common_vendor.index.getStorageSync("bluetoothState");
      if (savedState) {
        this.bluetoothConnected = savedState.connectedDevice !== null;
        if (savedState.sensorData) {
          this.currentTemp = savedState.sensorData.temp / 10;
          this.currentHumidity = savedState.sensorData.humidity;
        }
      }
    },
    // 处理蓝牙状态变化
    handleBluetoothStatus(status) {
      this.bluetoothConnected = status.connected;
      if (!status.connected) {
        this.currentTemp = null;
        this.currentHumidity = null;
        this.currentStatus = "蓝牙断开";
      } else {
        this.currentStatus = "待机中";
      }
    },
    // 处理传感器数据
    handleSensorData(data) {
      if (data.temp !== void 0) {
        this.currentTemp = data.temp;
      }
      if (data.humidity !== void 0) {
        this.currentHumidity = data.humidity;
      }
      if (this.currentStatus === "正在调节") {
        const tempDiff = Math.abs(this.currentTemp - this.suitableTemp);
        const humidityDiff = Math.abs(this.currentHumidity - this.suitableHumidity);
        if (tempDiff <= 1 && humidityDiff <= 1) {
          this.currentStatus = "调节完毕";
          this.sendControlCommand("stop");
        }
        if (this.adjustmentStartTime) {
          const now = Date.now();
          const duration = now - this.adjustmentStartTime;
          const timeout = 10 * 60 * 1e3;
          if (duration > timeout) {
            this.currentStatus = "调节超时";
            this.sendControlCommand("stop");
          }
        }
      }
    },
    // 加载作物数据
    async loadCropsData() {
      try {
        const response = await common_request.api.get("/api/crops");
        console.log("原始API响应:", response);
        this.cropDatabase = response.reduce((acc, crop) => {
          let commonNames = [];
          try {
            if (crop.commonNames) {
              commonNames = JSON.parse(crop.commonNames);
            }
          } catch (e) {
            console.warn("解析commonNames失败:", crop.commonNames, e);
            if (crop.scientificName) {
              commonNames = [crop.scientificName];
            }
          }
          if (!Array.isArray(commonNames)) {
            commonNames = [];
          }
          commonNames.forEach((name) => {
            if (name && typeof name === "string") {
              acc[name] = {
                // 使用正确的字段名 optimalTemperature 和 optimalHumidity
                temp: crop.optimalTemperature,
                humidity: crop.optimalHumidity
              };
            }
          });
          return acc;
        }, {});
        console.log("转换后的作物数据:", JSON.parse(JSON.stringify(this.cropDatabase)));
        console.log("示例数据 - 番茄:", this.cropDatabase["番茄"]);
        this.cropsLoaded = true;
      } catch (error) {
        console.error("加载作物数据失败:", error);
        this.cropDatabase = {
          "番茄": { temp: 25, humidity: 60 },
          "生菜": { temp: 18, humidity: 70 }
          // ...其他备份数据
        };
        this.cropsLoaded = true;
        common_vendor.index.showToast({
          title: "作物数据加载失败，使用本地备份",
          icon: "none"
        });
      }
    },
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
      const aiResponse = await common_deepSeekApi.callDeepSeekApi(userMessage, this.cropDatabase);
      return aiResponse;
    },
    // 执行命令
    executeCommands(commands) {
      if (!this.bluetoothConnected) {
        common_vendor.index.showToast({
          title: "蓝牙未连接，无法执行命令",
          icon: "none"
        });
        return;
      }
      commands.forEach((command) => {
        console.log("执行命令:", command);
        switch (command.command) {
          case "set_target":
            const [temp, humidity] = command.params.split(",");
            this.setTargetEnvironment(parseFloat(temp), parseFloat(humidity));
            this.sendControlToDevice(parseFloat(temp), parseFloat(humidity));
            break;
          case "start_adjustment":
            this.sendControlCommand("start");
            this.currentStatus = "正在调节";
            this.adjustmentStartTime = Date.now();
            break;
          case "stop_adjustment":
            this.sendControlCommand("stop");
            this.currentStatus = "调节完毕";
            this.adjustmentStartTime = null;
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
    },
    // 发送控制指令到下位机（设置目标温湿度）
    sendControlToDevice(temp, humidity) {
      common_vendor.index.$emit("ble-command", {
        type: "set_target",
        temp,
        humidity
      });
      common_vendor.index.showToast({
        title: "已发送环境设置到下位机",
        icon: "success"
      });
    },
    // 发送控制命令（启动/停止调节）
    sendControlCommand(cmdType) {
      common_vendor.index.$emit("ble-command", { type: cmdType });
      common_vendor.index.showToast({
        title: `已发送${cmdType === "start" ? "启动" : "停止"}调节命令`,
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
    h: common_vendor.t($data.currentTemp !== null ? $data.currentTemp.toFixed(1) + "°C" : "--"),
    i: common_vendor.t($data.currentHumidity !== null ? $data.currentHumidity.toFixed(1) + "%" : "--"),
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
    o: $data.loading || !$data.cropsLoaded,
    p: $data.yourMessage,
    q: common_vendor.o(($event) => $data.yourMessage = $event.detail.value),
    r: common_vendor.o((...args) => $options.sendMessage && $options.sendMessage(...args)),
    s: !$data.loading,
    t: !$data.cropsLoaded,
    v: $data.loading,
    w: common_vendor.p({
      status: "loading"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
