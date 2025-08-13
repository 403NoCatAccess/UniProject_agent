"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const pageTitle = () => "../../components/pageTitle.js";
const ENVIRONMENTAL_SENSING_SERVICE = "0000181A-0000-1000-8000-00805F9B34FB";
const TEMPERATURE_CHARACTERISTIC = "00002A6E-0000-1000-8000-00805F9B34FB";
const HUMIDITY_CHARACTERISTIC = "00002A6F-0000-1000-8000-00805F9B34FB";
const _sfc_main = {
  components: {
    pageTitle
  },
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
      showPrivacyPopup: true,
      bluetoothInitialized: false,
      scanning: false,
      connecting: false,
      devices: [],
      connectedDevice: null,
      statusMessage: "请同意隐私协议并初始化蓝牙",
      serviceId: "",
      characteristicId: "",
      deviceId: "",
      // 传感器数据
      sensorData: {
        temp: null,
        // 温度原始值（整数）
        humidity: null
        // 湿度原始值（整数）
      },
      lastUpdateTime: null,
      // 最后更新时间
      // 接收数据日志
      receivedData: []
    };
  },
  methods: {
    // 格式化温度显示
    formatTemperature(value) {
      const integerPart = Math.floor(value / 10);
      const decimalPart = value % 10;
      return `${integerPart}.${decimalPart}°C`;
    },
    // 格式化湿度显示
    formatHumidity(value) {
      return `${value}%`;
    },
    // 处理同意隐私协议
    handleAgreePrivacy() {
      this.showPrivacyPopup = false;
      this.statusMessage = "请初始化蓝牙";
    },
    // 处理拒绝隐私协议
    handleDisagreePrivacy() {
      common_vendor.index.showToast({
        title: "您需要同意隐私协议才能使用蓝牙功能",
        icon: "none"
      });
    },
    // 初始化蓝牙适配器
    initBlue() {
      common_vendor.index.showLoading({ title: "初始化中..." });
      common_vendor.index.openBluetoothAdapter({
        mode: "central",
        success: (res) => {
          console.log("蓝牙适配器初始化成功", res);
          this.bluetoothInitialized = true;
          this.statusMessage = "蓝牙已就绪，请搜索设备";
          common_vendor.index.hideLoading();
          common_vendor.index.onBluetoothAdapterStateChange((res2) => {
            if (!res2.available) {
              this.statusMessage = "蓝牙已关闭，请重新初始化";
              this.bluetoothInitialized = false;
              this.connectedDevice = null;
              this.devices = [];
              this.receivedData = [];
            }
          });
        },
        fail: (err) => {
          console.error("蓝牙初始化失败", err);
          let message = "蓝牙初始化失败";
          if (err.errCode === 10001) {
            message = "请开启手机蓝牙功能";
          }
          this.statusMessage = message;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: message,
            icon: "none"
          });
        }
      });
    },
    // 开始扫描设备
    startScan() {
      if (!this.bluetoothInitialized) {
        common_vendor.index.showToast({
          title: "请先初始化蓝牙",
          icon: "none"
        });
        return;
      }
      this.scanning = true;
      this.statusMessage = "正在搜索设备...";
      this.devices = [];
      common_vendor.index.showLoading({ title: "搜索中..." });
      common_vendor.index.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        services: [ENVIRONMENTAL_SENSING_SERVICE],
        // 只搜索环境传感服务  删除这个参数表示全部  数组多个元素可查找多个服务  //建议写上 防止持续显示连接中
        success: (res) => {
          console.log("开始搜索蓝牙设备", res);
          common_vendor.index.hideLoading();
          common_vendor.index.onBluetoothDeviceFound((res2) => {
            res2.devices.forEach((device) => {
              if (device.name && !this.devices.some((d) => d.deviceId === device.deviceId)) {
                this.devices.push(device);
              }
            });
          });
        },
        fail: (err) => {
          console.error("搜索失败", err);
          this.scanning = false;
          this.statusMessage = "搜索失败";
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "搜索失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 停止扫描
    stopScan() {
      common_vendor.index.stopBluetoothDevicesDiscovery({
        success: () => {
          this.scanning = false;
          this.statusMessage = this.devices.length > 0 ? "搜索完成，请选择设备连接" : "未发现设备，请重试";
        },
        fail: (err) => {
          console.error("停止搜索失败", err);
        }
      });
    },
    // 连接设备
    connectDevice(device) {
      if (!device.deviceId) {
        common_vendor.index.showToast({
          title: "设备信息不完整",
          icon: "none"
        });
        return;
      }
      this.connecting = true;
      this.statusMessage = `正在连接 ${device.name || "未知设备"}...`;
      common_vendor.index.showLoading({ title: "连接中..." });
      this.stopScan();
      common_vendor.index.createBLEConnection({
        deviceId: device.deviceId,
        timeout: 1e4,
        // 10秒超时
        success: (res) => {
          console.log("设备连接成功", res);
          this.deviceId = device.deviceId;
          this.connectedDevice = device;
          this.getBLEDeviceServices(device.deviceId);
        },
        fail: (err) => {
          console.error("设备连接失败", err);
          this.connecting = false;
          this.statusMessage = "连接失败";
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "连接失败，请重试",
            icon: "none"
          });
        }
      });
    },
    // 获取蓝牙设备的服务
    getBLEDeviceServices(deviceId) {
      common_vendor.index.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          console.log("获取设备服务成功", res.services);
          if (res.services.length === 0) {
            throw new Error("未找到服务");
          }
          const service = res.services.find((s) => s.uuid.toLowerCase() === ENVIRONMENTAL_SENSING_SERVICE.toLowerCase()) || res.services[0];
          this.serviceId = service.uuid;
          this.getBLEDeviceCharacteristics(deviceId, service.uuid);
        },
        fail: (err) => {
          console.error("获取设备服务失败", err);
          this.connecting = false;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "获取服务失败",
            icon: "none"
          });
          this.disconnectDevice();
        }
      });
    },
    // 获取蓝牙设备的特征值
    getBLEDeviceCharacteristics(deviceId, serviceId) {
      common_vendor.index.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          console.log("获取特征值成功", res.characteristics);
          if (res.characteristics.length === 0) {
            throw new Error("未找到特征值");
          }
          const tempChar = res.characteristics.find((c) => c.uuid.toLowerCase() === TEMPERATURE_CHARACTERISTIC.toLowerCase());
          const humidityChar = res.characteristics.find((c) => c.uuid.toLowerCase() === HUMIDITY_CHARACTERISTIC.toLowerCase());
          if (tempChar) {
            this.enableBLECharacteristicValueChange(deviceId, serviceId, tempChar.uuid);
          }
          if (humidityChar) {
            this.enableBLECharacteristicValueChange(deviceId, serviceId, humidityChar.uuid);
          }
        },
        fail: (err) => {
          console.error("获取特征值失败", err);
          this.connecting = false;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "获取特征值失败",
            icon: "none"
          });
          this.disconnectDevice();
        }
      });
    },
    // 启用特征值变化监听
    enableBLECharacteristicValueChange(deviceId, serviceId, characteristicId) {
      common_vendor.index.notifyBLECharacteristicValueChange({
        //启用通知功能
        deviceId,
        serviceId,
        characteristicId,
        state: true,
        success: () => {
          console.log("启用特征值变化监听成功");
          common_vendor.index.onBLECharacteristicValueChange((res) => {
            console.log("特征值变化", res);
            this.handleReceivedData(res.value, res.characteristicId);
          });
          this.connecting = false;
          this.statusMessage = `已连接: ${this.connectedDevice.name || "未知设备"}`;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "连接成功",
            icon: "success"
          });
        },
        fail: (err) => {
          console.error("启用特征值监听失败", err);
          this.connecting = false;
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "启用监听失败",
            icon: "none"
          });
        }
      });
    },
    // 处理接收到的数据 - 修复数据解析
    handleReceivedData(buffer, characteristicId) {
      try {
        if (!(buffer instanceof ArrayBuffer)) {
          console.error("接收到的数据不是ArrayBuffer:", buffer);
          return;
        }
        let content = "";
        let rawValue = null;
        if (characteristicId.toLowerCase() === TEMPERATURE_CHARACTERISTIC.toLowerCase()) {
          const view = new DataView(buffer);
          rawValue = view.getInt16(0, true);
          this.sensorData.temp = rawValue;
          content = `温度: ${this.formatTemperature(rawValue)}`;
        } else if (characteristicId.toLowerCase() === HUMIDITY_CHARACTERISTIC.toLowerCase()) {
          const view = new DataView(buffer);
          rawValue = view.getUint16(0, true);
          this.sensorData.humidity = rawValue;
          content = `湿度: ${this.formatHumidity(rawValue)}`;
        } else {
          content = this.arrayBufferToString(buffer);
        }
        this.lastUpdateTime = this.formatTime(/* @__PURE__ */ new Date());
        this.receivedData.unshift({
          time: /* @__PURE__ */ new Date(),
          content,
          type: "sensor"
        });
        if (this.receivedData.length > 100) {
          this.receivedData.pop();
        }
        console.log("接收到数据:", content);
      } catch (error) {
        console.error("数据处理错误:", error);
      }
    },
    // 断开设备连接
    disconnectDevice() {
      if (!this.deviceId)
        return;
      common_vendor.index.showLoading({ title: "断开中..." });
      common_vendor.index.closeBLEConnection({
        deviceId: this.deviceId,
        success: () => {
          console.log("设备连接已断开");
          this.connectedDevice = null;
          this.deviceId = "";
          this.statusMessage = "连接已断开";
          this.receivedData = [];
          this.sensorData = {
            temp: null,
            humidity: null
          };
          common_vendor.index.hideLoading();
        },
        fail: (err) => {
          console.error("断开连接失败", err);
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "断开连接失败",
            icon: "none"
          });
        },
        complete: () => {
          common_vendor.index.closeBluetoothAdapter();
          this.bluetoothInitialized = false;
        }
      });
    },
    // 格式化时间 (HH:mm:ss)
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    },
    // ArrayBuffer转字符串（用于处理接收到的数据）
    arrayBufferToString(buffer) {
      const bytes = new Uint8Array(buffer);
      let str = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      return str;
    },
    // 清空日志
    clearLogs() {
      this.receivedData = [];
    }
  }
};
if (!Array) {
  const _component_page_title = common_vendor.resolveComponent("page-title");
  _component_page_title();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.showPrivacyPopup
  }, $data.showPrivacyPopup ? {
    b: common_vendor.o((...args) => $options.handleDisagreePrivacy && $options.handleDisagreePrivacy(...args)),
    c: common_vendor.o((...args) => $options.handleAgreePrivacy && $options.handleAgreePrivacy(...args))
  } : {}, {
    d: `${$data.statusBarHeight}px`,
    e: common_vendor.p({
      title: "温湿度监测"
    }),
    f: common_vendor.t($data.statusMessage),
    g: common_vendor.o((...args) => $options.initBlue && $options.initBlue(...args)),
    h: $data.scanning,
    i: common_vendor.o((...args) => $options.startScan && $options.startScan(...args)),
    j: !$data.bluetoothInitialized || $data.scanning,
    k: common_vendor.o((...args) => $options.stopScan && $options.stopScan(...args)),
    l: !$data.scanning,
    m: common_vendor.o((...args) => $options.disconnectDevice && $options.disconnectDevice(...args)),
    n: !$data.connectedDevice,
    o: !$data.devices || $data.devices.length === 0
  }, !$data.devices || $data.devices.length === 0 ? {
    p: common_vendor.t($data.scanning ? "搜索中..." : "未发现设备")
  } : {}, {
    q: common_vendor.f($data.devices, (device, k0, i0) => {
      return {
        a: common_vendor.t(device.name || "未知设备"),
        b: common_vendor.t(device.deviceId),
        c: common_vendor.o(($event) => $options.connectDevice(device), device.deviceId),
        d: device.deviceId
      };
    }),
    r: $data.connecting,
    s: $data.connectedDevice
  }, $data.connectedDevice ? {
    t: common_vendor.t($data.lastUpdateTime || "--"),
    v: common_assets._imports_0,
    w: common_vendor.t($data.sensorData.temp !== null ? $options.formatTemperature($data.sensorData.temp) : "--"),
    x: common_assets._imports_1,
    y: common_vendor.t($data.sensorData.humidity !== null ? $options.formatHumidity($data.sensorData.humidity) : "--")
  } : {}, {
    z: $data.receivedData.length > 0
  }, $data.receivedData.length > 0 ? {
    A: common_vendor.o((...args) => $options.clearLogs && $options.clearLogs(...args)),
    B: common_vendor.f($data.receivedData, (item, index, i0) => {
      return {
        a: common_vendor.t($options.formatTime(item.time)),
        b: common_vendor.t(item.content),
        c: index
      };
    })
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
