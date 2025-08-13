<template>
  <view class="container">
    <!-- 隐私协议弹窗 -->
    <view v-if="showPrivacyPopup" class="privacy-popup">
      <view class="privacy-content">
        <text class="privacy-title">隐私协议说明</text>
        <text class="privacy-desc">使用蓝牙功能需要您同意隐私协议，我们承诺仅用于设备连接服务</text>
        <view class="privacy-buttons">
          <button @tap="handleDisagreePrivacy" class="privacy-btn cancel">拒绝</button>
          <button @tap="handleAgreePrivacy" class="privacy-btn confirm">同意</button>
        </view>
      </view>
    </view>
    
    <view :style="{ height: `${statusBarHeight}px` }"></view>
    <page-title title="温湿度监测"></page-title>

    <!-- 设备状态与操作 -->
    <view class="status-bar">
      <text>{{ statusMessage }}</text>
    </view>
    
    <view class="control-panel">
      <button @tap="initBlue" :disabled="scanning">初始化蓝牙</button><!-- 正在扫描时禁用 -->
      <button @tap="startScan" :disabled="!bluetoothInitialized || scanning">搜索设备</button><!-- 未初始化或正在扫描时禁用 -->
      <button @tap="stopScan" :disabled="!scanning">停止搜索</button>
      <button @tap="disconnectDevice" :disabled="!connectedDevice">断开连接</button>
    </view>

    <!-- 设备列表 -->
    <scroll-view scroll-y class="device-list">
      <view v-if="!devices || devices.length === 0" class="empty-tip">
        <text>{{ scanning ? '搜索中...' : '未发现设备' }}</text>
      </view>
      <view v-for="device in devices" :key="device.deviceId" class="device-item">
        <text class="device-name">{{ device.name || '未知设备' }}</text>
        <text class="device-id">{{ device.deviceId }}</text>
        <button @tap="connectDevice(device)" size="mini" :disabled="connecting">连接</button>
      </view>
    </scroll-view>

    <!-- 温湿度数据显示卡片 -->
    <view class="data-card" v-if="connectedDevice">
      <view class="data-header">
        <text class="title">环境数据</text>
        <text class="update-time">更新: {{ lastUpdateTime || '--' }}</text>
      </view>
      
      <view class="data-grid">
        <!-- 温度 -->
        <view class="data-item">
          <image class="icon" src="/static/temp.png" mode="aspectFit"></image>
          <text class="value">{{ sensorData.temp !== null ? formatTemperature(sensorData.temp) : '--' }}</text>
          <text class="label">温度</text>
        </view>
        
        <!-- 湿度 -->
        <view class="data-item">
          <image class="icon" src="/static/humidity.png" mode="aspectFit"></image>
          <text class="value">{{ sensorData.humidity !== null ? formatHumidity(sensorData.humidity) : '--' }}</text>
          <text class="label">湿度</text>
        </view>
      </view>
    </view>

    <!-- 接收数据日志 -->
    <view class="log-container" v-if="receivedData.length > 0">
      <view class="log-header">
        <text class="title">数据日志</text>
        <button @tap="clearLogs" size="mini">清空</button>
      </view>
      <scroll-view scroll-y class="log-content">
        <view v-for="(item, index) in receivedData" :key="index" class="log-item">
          <text class="time">{{ formatTime(item.time) }}</text>
          <text class="content">{{ item.content }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import pageTitle from '@/components/pageTitle.vue';

// 标准蓝牙服务UUID (Environmental Sensing Service)
const ENVIRONMENTAL_SENSING_SERVICE = '0000181A-0000-1000-8000-00805F9B34FB';
// 标准特征UUID (Temperature & Humidity)
const TEMPERATURE_CHARACTERISTIC = '00002A6E-0000-1000-8000-00805F9B34FB';
const HUMIDITY_CHARACTERISTIC = '00002A6F-0000-1000-8000-00805F9B34FB';

export default {
  components: {
    pageTitle,
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
      statusMessage: '请同意隐私协议并初始化蓝牙',
      serviceId: '',
      characteristicId: '',
      deviceId: '',
      
      // 传感器数据
      sensorData: {
        temp: null,     // 温度原始值（整数）
        humidity: null, // 湿度原始值（整数）
      },
      lastUpdateTime: null, // 最后更新时间
      
      // 接收数据日志
      receivedData: [],
    };
  },
  methods: {
    // 格式化温度显示
    formatTemperature(value) {
      // 转换为实际温度值（整数部分除以10，小数部分取模10）
      const integerPart = Math.floor(value / 10);
      const decimalPart = value % 10;
      return `${integerPart}.${decimalPart}°C`;
    },
    
    // 格式化湿度显示
    formatHumidity(value) {
      // 直接显示整数百分比
      return `${value}%`;
    },
    
    // 处理同意隐私协议
    handleAgreePrivacy() {
      this.showPrivacyPopup = false;
      this.statusMessage = '请初始化蓝牙';
    },
    
    // 处理拒绝隐私协议
    handleDisagreePrivacy() {
      uni.showToast({
        title: '您需要同意隐私协议才能使用蓝牙功能',
        icon: 'none'
      });
    },
    
    // 初始化蓝牙适配器
    initBlue() {
      uni.showLoading({ title: '初始化中...' });
      
      uni.openBluetoothAdapter({
        mode: 'central',
        success: (res) => {
          console.log('蓝牙适配器初始化成功', res);
          this.bluetoothInitialized = true;
          this.statusMessage = '蓝牙已就绪，请搜索设备';
          uni.hideLoading();
          
          // 监听蓝牙适配器状态变化
          uni.onBluetoothAdapterStateChange((res) => {
            if (!res.available) {
              this.statusMessage = '蓝牙已关闭，请重新初始化';
              this.bluetoothInitialized = false;
              this.connectedDevice = null;
              this.devices = [];
              this.receivedData = [];
            }
          });
        },
        fail: (err) => {
          console.error('蓝牙初始化失败', err);
          let message = '蓝牙初始化失败';
          if (err.errCode === 10001) {
            message = '请开启手机蓝牙功能';
          }
          this.statusMessage = message;
          uni.hideLoading();
          uni.showToast({
            title: message,
            icon: 'none'
          });
        }
      });
    },
    
    // 开始扫描设备
    startScan() {
      if (!this.bluetoothInitialized) {
        uni.showToast({
          title: '请先初始化蓝牙',
          icon: 'none'
        });
        return;
      }
      
      this.scanning = true;
      this.statusMessage = '正在搜索设备...';
      this.devices = [];
      uni.showLoading({ title: '搜索中...' });
      
      // 开始搜索设备
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        services: [ENVIRONMENTAL_SENSING_SERVICE], // 只搜索环境传感服务  删除这个参数表示全部  数组多个元素可查找多个服务  //建议写上 防止持续显示连接中
        success: (res) => {
          console.log('开始搜索蓝牙设备', res);
          uni.hideLoading();
          
          // 监听发现新设备
          uni.onBluetoothDeviceFound((res) => {
            res.devices.forEach(device => {
              // 过滤掉没有名称的设备（可能是非BLE设备）
              if (device.name && !this.devices.some(d => d.deviceId === device.deviceId)) {
                this.devices.push(device);
              }
            });
          });
        },
        fail: (err) => {
          console.error('搜索失败', err);
          this.scanning = false;
          this.statusMessage = '搜索失败';
          uni.hideLoading();
          uni.showToast({
            title: '搜索失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 停止扫描
    stopScan() {
      uni.stopBluetoothDevicesDiscovery({
        success: () => {
          this.scanning = false;
          this.statusMessage = this.devices.length > 0 
            ? '搜索完成，请选择设备连接' 
            : '未发现设备，请重试';
        },
        fail: (err) => {
          console.error('停止搜索失败', err);
        }
      });
    },
    
    // 连接设备
    connectDevice(device) {
      if (!device.deviceId) {
        uni.showToast({
          title: '设备信息不完整',
          icon: 'none'
        });
        return;
      }
      
      this.connecting = true;
      this.statusMessage = `正在连接 ${device.name || '未知设备'}...`;
      uni.showLoading({ title: '连接中...' });
      
      // 停止扫描以节省资源
      this.stopScan();
      
      // 连接设备
      uni.createBLEConnection({
        deviceId: device.deviceId,
        timeout: 10000, // 10秒超时
        success: (res) => {
          console.log('设备连接成功', res);
          this.deviceId = device.deviceId;
          this.connectedDevice = device;
          
          // 获取设备服务
          this.getBLEDeviceServices(device.deviceId);
        },
        fail: (err) => {
          console.error('设备连接失败', err);
          this.connecting = false;
          this.statusMessage = '连接失败';
          uni.hideLoading();
          uni.showToast({
            title: '连接失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 获取蓝牙设备的服务
    getBLEDeviceServices(deviceId) {
      uni.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          console.log('获取设备服务成功', res.services);
          if (res.services.length === 0) {
            throw new Error('未找到服务');
          }
          
          // 查找环境传感服务UUID，如果找不到则使用第一个服务
          const service = res.services.find(s => s.uuid.toLowerCase() === ENVIRONMENTAL_SENSING_SERVICE.toLowerCase()) 
                         || res.services[0];
          this.serviceId = service.uuid;
          
          // 获取特征值
          this.getBLEDeviceCharacteristics(deviceId, service.uuid);
        },
        fail: (err) => {
          console.error('获取设备服务失败', err);
          this.connecting = false;
          uni.hideLoading();
          uni.showToast({
            title: '获取服务失败',
            icon: 'none'
          });
          this.disconnectDevice();
        }
      });
    },
    
    // 获取蓝牙设备的特征值
    getBLEDeviceCharacteristics(deviceId, serviceId) {
      uni.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          console.log('获取特征值成功', res.characteristics);
          if (res.characteristics.length === 0) {
            throw new Error('未找到特征值');
          }
          
          // 查找温度和湿度特征
          const tempChar = res.characteristics.find(c => 
            c.uuid.toLowerCase() === TEMPERATURE_CHARACTERISTIC.toLowerCase());
          const humidityChar = res.characteristics.find(c => 
            c.uuid.toLowerCase() === HUMIDITY_CHARACTERISTIC.toLowerCase());
          
          // 启用特征值变化监听
          if (tempChar) {
            this.enableBLECharacteristicValueChange(deviceId, serviceId, tempChar.uuid);
          }
          if (humidityChar) {
            this.enableBLECharacteristicValueChange(deviceId, serviceId, humidityChar.uuid);
          }
        },
        fail: (err) => {
          console.error('获取特征值失败', err);
          this.connecting = false;
          uni.hideLoading();
          uni.showToast({
            title: '获取特征值失败',
            icon: 'none'
          });
          this.disconnectDevice();
        }
      });
    },
    
    // 启用特征值变化监听
    enableBLECharacteristicValueChange(deviceId, serviceId, characteristicId) {
      uni.notifyBLECharacteristicValueChange({//启用通知功能
        deviceId,
        serviceId,
        characteristicId,
        state: true,
        success: () => {
          console.log('启用特征值变化监听成功');
          
          // 监听特征值变化
          uni.onBLECharacteristicValueChange((res) => {//监听数据
            console.log('特征值变化', res);
            // 处理接收到的数据
            this.handleReceivedData(res.value, res.characteristicId);
          });
          
          this.connecting = false;
          this.statusMessage = `已连接: ${this.connectedDevice.name || '未知设备'}`;
          uni.hideLoading();
          uni.showToast({
            title: '连接成功',
            icon: 'success'
          });
        },
        fail: (err) => {
          console.error('启用特征值监听失败', err);
          this.connecting = false;
          uni.hideLoading();
          uni.showToast({
            title: '启用监听失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 处理接收到的数据 - 修复数据解析
    handleReceivedData(buffer, characteristicId) {
      try {
        // 确保buffer是ArrayBuffer类型
        if (!(buffer instanceof ArrayBuffer)) {
          console.error('接收到的数据不是ArrayBuffer:', buffer);
          return;
        }
        
        let content = '';
        let rawValue = null;
        
        // 根据特征ID处理数据
        if (characteristicId.toLowerCase() === TEMPERATURE_CHARACTERISTIC.toLowerCase()) {//转化为小写比较特征值
          // 温度特征 (整数，单位0.1°C)
          const view = new DataView(buffer);//创建二进制数据视图
          rawValue = view.getInt16(0, true); // 小端序  从0开始读取，按小端序解析2字节有符号整数
          this.sensorData.temp = rawValue;
          content = `温度: ${this.formatTemperature(rawValue)}`;
        } 
        else if (characteristicId.toLowerCase() === HUMIDITY_CHARACTERISTIC.toLowerCase()) {
          // 湿度特征 (整数，单位%)
          const view = new DataView(buffer);
          rawValue = view.getUint16(0, true); // 小端序
          this.sensorData.humidity = rawValue;
          content = `湿度: ${this.formatHumidity(rawValue)}`;
        } else {
          // 其他特征值，转换为字符串
          content = this.arrayBufferToString(buffer);
        }
        
        // 更新最后更新时间
        this.lastUpdateTime = this.formatTime(new Date());
        
        // 添加到接收数据列表
        this.receivedData.unshift({
          time: new Date(),
          content,
          type: 'sensor'
        });
        
        // 限制最多保存100条数据
        if (this.receivedData.length > 100) {
          this.receivedData.pop();
        }
        
        console.log('接收到数据:', content);
      } catch (error) {
        console.error('数据处理错误:', error);
      }
    },
    
    // 断开设备连接
    disconnectDevice() {
      if (!this.deviceId) return;
      
      uni.showLoading({ title: '断开中...' });
      
      // 关闭连接
      uni.closeBLEConnection({
        deviceId: this.deviceId,
        success: () => {
          console.log('设备连接已断开');
          this.connectedDevice = null;
          this.deviceId = '';
          this.statusMessage = '连接已断开';
          this.receivedData = [];
          // 清空传感器数据
          this.sensorData = {
            temp: null,
            humidity: null
          };
          uni.hideLoading();
        },
        fail: (err) => {
          console.error('断开连接失败', err);
          uni.hideLoading();
          uni.showToast({
            title: '断开连接失败',
            icon: 'none'
          });
        },
        complete: () => {
          // 释放蓝牙资源
          uni.closeBluetoothAdapter();
          this.bluetoothInitialized = false;
        }
      });
    },
    
    // 格式化时间 (HH:mm:ss)
    formatTime(date) {
      const hours = date.getHours().toString().padStart(2, '0');//链式调用，返回小时再转换成字符串，再补0
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    },
    
    // ArrayBuffer转字符串（用于处理接收到的数据）
    arrayBufferToString(buffer) {
      const bytes = new Uint8Array(buffer);
      let str = '';
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
</script>

<style>
.container {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f7;
}

.status-bar {
  padding: 15rpx;
  background-color: #e9ecef;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  text-align: center;
  font-size: 28rpx;
  color: #6c757d;
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.control-panel button {
  flex: 1;
  margin: 10rpx;
  min-width: 150rpx;
  font-size: 28rpx;
  background-color: #007bff;
  color: white;
}

.control-panel button:disabled {
  background-color: #cccccc;
}

.device-list {
  flex: none;
  height: 30vh;
  background-color: white;
  border-radius: 15rpx;
  padding: 15rpx;
  margin-bottom: 20rpx;
}

.empty-tip {
  text-align: center;
  padding: 40rpx;
  color: #6c757d;
  font-size: 28rpx;
}

.device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}

.device-name {
  font-weight: bold;
  flex: 2;
}

.device-id {
  flex: 3;
  font-size: 24rpx;
  color: #6c757d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 15rpx;
}

.device-item button {
  flex: 1;
  background-color: #28a745;
  color: white;
  font-size: 24rpx;
}

/* 数据卡片样式 */
.data-card {
  background-color: white;
  border-radius: 15rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.data-header .title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.data-header .update-time {
  font-size: 24rpx;
  color: #888;
}

.data-grid {
  display: flex;
  justify-content: space-around;
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15rpx;
}

.data-item .icon {
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 10rpx;
}

.data-item .value {
  font-size: 40rpx;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 5rpx;
}

.data-item .label {
  font-size: 24rpx;
  color: #666;
}

/* 日志容器样式 */
.log-container {
  flex: 1;
  background-color: white;
  border-radius: 15rpx;
  padding: 20rpx;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.log-header .title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.log-content {
  max-height: 200rpx;
}

.log-item {
  padding: 10rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.log-item .time {
  font-size: 24rpx;
  color: #888;
  margin-right: 15rpx;
}

.log-item .content {
  font-size: 28rpx;
}

/* 隐私协议弹窗样式 */
.privacy-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.privacy-content {
  background-color: white;
  width: 80%;
  padding: 40rpx;
  border-radius: 20rpx;
  text-align: center;
}

.privacy-title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 20rpx;
}

.privacy-desc {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 30rpx;
}

.privacy-buttons {
  display: flex;
  justify-content: space-between;
}

.privacy-btn {
  flex: 1;
  margin: 0 15rpx;
  font-size: 28rpx;
}

.cancel {
  background-color: #6c757d;
  color: white;
}

.confirm {
  background-color: #007bff;
  color: white;
}
</style>