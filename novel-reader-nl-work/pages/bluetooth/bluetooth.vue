<template>
  <view class="container">
    <!-- 隐私协议弹窗 -->
    <view v-if="showPrivacyPopup" class="privacy-popup">
      <view class="privacy-content">
        <text class="privacy-title">隐私协议说明</text>
        <text class="privacy-desc">使用蓝牙功能需要您同意隐私协议，我们承诺仅用于设备连接服务</text>
        <view class="privacy-buttons">
          <button @tap="handleDisagreePrivacy" class="privacy-btn cancel">拒绝</button>
          <button open-type="agreePrivacyAuthorization" @agreeprivacyauthorization="handleAgreePrivacy" class="privacy-btn confirm">同意</button>
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
      <button @tap="initBlue" :disabled="scanning || connectedDevice">初始化蓝牙</button>
      <button @tap="startScan" :disabled="!bluetoothInitialized || scanning || connectedDevice">搜索设备</button>
      <button @tap="stopScan" :disabled="!scanning || connectedDevice">停止搜索</button>
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
// LED控制特征UUID (自定义)
const LED_CONTROL_CHARACTERISTIC = '00002A57-0000-1000-8000-00805F9B34FB';

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
      ledCharacteristicId: '', // 添加LED特征ID
      
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
  mounted() {
    console.log('页面挂载');
    // 监听来自deepseek.vue的命令
    uni.$on('ble-command', this.handleBleCommand);
    
    // 注册蓝牙连接状态监听
    this.setupBLEConnectionListener();
    
    // 尝试恢复蓝牙状态    退回到主页变量会被取消
    this.restoreBluetoothState();
  },
  onShow() {
    console.log('页面显示');
    // 重置扫描状态
    this.scanning = false;
    // 清空设备列表
    this.devices = [];
    
    // 重新注册蓝牙连接状态监听
    this.setupBLEConnectionListener();//页面隐藏，蓝牙监听不会取消，所以这段代码没必要  为了保险加上的
    
    // 检查蓝牙适配器状态
    this.checkBluetoothAdapterState();
  },
  onHide() {
    console.log('页面隐藏');
    // 停止扫描
    this.stopScan();
  },
  onUnload() {
    console.log('页面卸载');
    // 保存蓝牙状态
    this.saveBluetoothState();
    
    // 移除事件监听
    uni.$off('ble-command', this.handleBleCommand);
    uni.offBluetoothAdapterStateChange();
    uni.offBluetoothDeviceFound();
    uni.offBLECharacteristicValueChange();
    uni.offBLEConnectionStateChange();
  },
  methods: {
    // 设置蓝牙连接状态监听
    setupBLEConnectionListener() {
      // 先移除旧的监听器
      uni.offBLEConnectionStateChange();
      
      // 注册新的连接状态监听
      uni.onBLEConnectionStateChange((res) => {
        console.log('蓝牙连接状态变化:', res);
        if (!res.connected) {
          console.log('设备连接已断开');
          this.clearSavedState();
          
          // 通知其他组件蓝牙断开
          uni.$emit('bluetooth-status', { connected: false });
          
          uni.showToast({
            title: '设备连接已断开',
            icon: 'none'
          });
        }
      });
    },
    
    // 检查蓝牙适配器状态
    checkBluetoothAdapterState() {
      uni.getBluetoothAdapterState({
        success: (res) => {
          if (res.available) {
            this.bluetoothInitialized = true;
            this.statusMessage = '蓝牙已就绪，请搜索设备';
          } else {
            this.bluetoothInitialized = false;
            this.statusMessage = '蓝牙未初始化';
          }
        },
        fail: (err) => {
          console.error('获取蓝牙适配器状态失败:', err);
          this.bluetoothInitialized = false;
          this.statusMessage = '获取蓝牙状态失败';
        }
      });
    },
    
    // 恢复蓝牙状态
    restoreBluetoothState() {
      console.log('恢复蓝牙状态');
      // 重置设备列表
      this.devices = [];
      
      // 尝试从本地存储恢复状态
      const savedState = uni.getStorageSync('bluetoothState');
      console.log('保存的状态:', savedState);
      
      // 检查蓝牙适配器状态
      uni.getBluetoothAdapterState({
        success: (res) => {
          if (res.available) {
            this.bluetoothInitialized = true;
            this.statusMessage = '蓝牙已就绪';
            
            // 检查是否有已连接的设备
            uni.getConnectedBluetoothDevices({
              success: (res) => {
                console.log('已连接的设备列表:', res.devices);
                
                if (savedState && savedState.deviceId) {
                  // 检查保存的设备是否仍然连接
                  const isStillConnected = res.devices.some(
                    device => device.deviceId === savedState.deviceId
                  );
                  
                  if (isStillConnected) {
                    // 设备仍然连接，恢复状态
                    this.connectedDevice = savedState.connectedDevice;
                    this.deviceId = savedState.deviceId;
                    this.serviceId = savedState.serviceId;
                    this.ledCharacteristicId = savedState.ledCharacteristicId;
                    this.sensorData = savedState.sensorData;
                    this.statusMessage = `已连接: ${savedState.connectedDevice.name || '未知设备'}`;
                    
                    // 重新获取服务
                    this.getBLEDeviceServices(savedState.deviceId);
                    
                    // 通知其他组件蓝牙已连接
                    uni.$emit('bluetooth-status', { connected: true });
                  } else {
                    console.log('设备未连接，清除保存的状态');
                    // 设备未连接，清除保存的状态
                    this.clearSavedState();
                  }
                } else if (res.devices.length > 0) {
                  // 没有保存状态但有已连接设备
                  const device = res.devices[0];
                  this.connectedDevice = device;
                  this.deviceId = device.deviceId;
                  this.statusMessage = `已连接: ${device.name || '未知设备'}`;
                  
                  // 重新获取服务
                  this.getBLEDeviceServices(device.deviceId);
                  
                  // 通知其他组件蓝牙已连接
                  uni.$emit('bluetooth-status', { connected: true });
                }
              },
              fail: (error) => {
                console.error('获取已连接设备失败:', error);
              }
            });
          } else {
            // 蓝牙适配器不可用
            this.bluetoothInitialized = false;
            this.statusMessage = '蓝牙未初始化';
          }
        },
        fail: (error) => {
          console.error('获取蓝牙适配器状态失败:', error);
          this.bluetoothInitialized = false;
          this.statusMessage = '获取蓝牙状态失败';
        }
      });
    },
    
    // 清除保存的状态
    clearSavedState() {
      console.log('清除保存的蓝牙状态');
      this.connectedDevice = null;
      this.deviceId = '';
      this.serviceId = '';
      this.ledCharacteristicId = '';
      this.sensorData = { temp: null, humidity: null };
      this.receivedData = [];
      this.lastUpdateTime = null;
      this.devices = [];
      uni.removeStorageSync('bluetoothState');
      this.statusMessage = '蓝牙已就绪，请搜索设备';
      
      // 通知其他组件蓝牙断开
      uni.$emit('bluetooth-status', { connected: false });
    },
    
    // 保存蓝牙状态
    saveBluetoothState() {
      if (this.connectedDevice) {
        uni.setStorageSync('bluetoothState', {
          connectedDevice: this.connectedDevice,
          deviceId: this.deviceId,
          serviceId: this.serviceId,
          ledCharacteristicId: this.ledCharacteristicId,
          sensorData: this.sensorData
        });
      }
    },
    
    // 处理来自deepseek.vue的命令
    handleBleCommand(command) {
      if (!this.connectedDevice) {
        uni.showToast({
          title: '蓝牙未连接，无法发送命令',
          icon: 'none'
        });
        return;
      }
      
      switch (command.type) {
        case 'set_target':
          this.sendSetTargetCommand(command.temp, command.humidity);
          break;
        case 'start':
          this.sendControlCommand('start');
          break;
        case 'stop':
          this.sendControlCommand('stop');
          break;
        default:
          console.warn('未知命令类型:', command.type);
      }
    },
    
    // 发送设置目标温湿度命令
    sendSetTargetCommand(temp, humidity) {
      // 命令格式: "set_target:25.5,60.0"
      const command = `set_target:${temp.toFixed(1)},${humidity.toFixed(1)}`;
      this.sendCommand(command);
      
      // 添加到日志
      this.addLog(`发送设置命令: ${command}`);
    },
    
    // 发送控制命令（启动/停止）
    sendControlCommand(cmdType) {
      // 命令格式: "start" 或 "stop"
      this.sendCommand(cmdType);
      
      // 添加到日志
      this.addLog(`发送控制命令: ${cmdType}`);
    },
    
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
      // 如果已经初始化，直接返回
      if (this.bluetoothInitialized) {
        uni.showToast({
          title: '蓝牙已初始化',
          icon: 'none'
        });
        return;
      }
      
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
              
              // 通知其他组件蓝牙断开
              uni.$emit('bluetooth-status', { connected: false });
              
              // 清除保存的状态
              this.clearSavedState();
            }
          });
          
          // 重新注册蓝牙连接状态监听
          this.setupBLEConnectionListener();
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
      
      // 确保停止之前的扫描
      this.stopScan();
      
      // 重置设备列表
      this.devices = [];
      
      this.scanning = true;
      this.statusMessage = '正在搜索设备...';
      uni.showLoading({ title: '搜索中...' });
      
      // 设置扫描超时
      const scanTimeout = setTimeout(() => {
        if (this.scanning) {
          console.log('扫描超时');
          this.stopScan();
          uni.showToast({
            title: '扫描超时，请重试',
            icon: 'none'
          });
        }
      }, 30000); // 30秒超时
      
      // 开始搜索设备
      uni.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true, // 关键修改：允许重复上报设备
        services: [ENVIRONMENTAL_SENSING_SERVICE],
        success: (res) => {
          clearTimeout(scanTimeout);
          console.log('开始搜索蓝牙设备', res);
          uni.hideLoading();
          
          // 移除旧的监听器（避免重复监听）
          uni.offBluetoothDeviceFound();
          
          // 监听发现新设备
          uni.onBluetoothDeviceFound((res) => {
            res.devices.forEach(device => {
              // 过滤掉没有名称的设备（可能是非BLE设备）
              if (device.name && !this.devices.some(d => d.name === device.name)) {
                this.devices.push(device);
              }
            });
          });
        },
        fail: (err) => {
          clearTimeout(scanTimeout);
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
      if (!this.scanning) return;
      
      uni.stopBluetoothDevicesDiscovery({
        success: () => {
          console.log('停止扫描成功');
          this.scanning = false;
          this.statusMessage = this.devices.length > 0 
            ? '搜索完成，请选择设备连接' 
            : '未发现设备，请重试';
          // 移除设备发现监听
          uni.offBluetoothDeviceFound();
        },
        fail: (err) => {
          console.error('停止搜索失败', err);
          // 即使停止失败，也重置扫描状态
          this.scanning = false;
        }
      });
    },
    
    // 连接设备
    connectDevice(device) {
		this.stopScan();
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
      
      // 设置连接超时
      const timeoutId = setTimeout(() => {
        if (this.connecting) {
          console.log('连接超时');
          this.connecting = false;
          uni.hideLoading();
          uni.showToast({
            title: '连接超时，请重试',
            icon: 'none'
          });
          this.clearSavedState();
        }
      }, 15000); // 15秒超时
      
      // 连接设备
      uni.createBLEConnection({
        deviceId: device.deviceId,
        timeout: 10000, // 10秒超时
        success: (res) => {
          clearTimeout(timeoutId);
          console.log('设备连接成功', res);
          this.deviceId = device.deviceId;
          this.connectedDevice = device;
          
          // 关键修复：连接成功后清空设备列表
          this.devices = [];
          
          // 获取设备服务
          this.getBLEDeviceServices(device.deviceId);
          
          // 保存状态
          this.saveBluetoothState();
          
          // 重新注册蓝牙连接状态监听
          this.setupBLEConnectionListener();
        },
        fail: (err) => {
          clearTimeout(timeoutId);
          console.error('设备连接失败', err);
          this.connecting = false;
          this.statusMessage = '连接失败';
          uni.hideLoading();
          uni.showToast({
            title: '连接失败，请重试',
            icon: 'none'
          });
          
          // 清除可能存在的无效状态
          this.clearSavedState();
        }
      });
    },
    
    // 获取蓝牙设备的服务
    getBLEDeviceServices(deviceId) {
      uni.getBLEDeviceServices({
        deviceId,//属性名和变量名相同，省略键值对
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
          const ledChar = res.characteristics.find(c => 
            c.uuid.toLowerCase() === LED_CONTROL_CHARACTERISTIC.toLowerCase());
          
          // 启用特征值变化监听
          if (tempChar) {
            this.enableBLECharacteristicValueChange(deviceId, serviceId, tempChar.uuid);
          }
          if (humidityChar) {
            this.enableBLECharacteristicValueChange(deviceId, serviceId, humidityChar.uuid);
          }
          
          // 保存LED控制特征ID
          if (ledChar) {
            this.ledCharacteristicId = ledChar.uuid;
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
      uni.notifyBLECharacteristicValueChange({
        deviceId,
        serviceId,
        characteristicId,
        state: true,
        success: () => {
          console.log('启用特征值变化监听成功');
          
          // 监听特征值变化
          uni.onBLECharacteristicValueChange((res) => {
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
          
          // 通知其他组件蓝牙已连接
          uni.$emit('bluetooth-status', { connected: true });
          
          // 保存状态
          this.saveBluetoothState();
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
    
    // 处理接收到的数据
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
        if (characteristicId.toLowerCase() === TEMPERATURE_CHARACTERISTIC.toLowerCase()) {
          // 温度特征 (整数，单位0.1°C)
          const view = new DataView(buffer);
          rawValue = view.getInt16(0, true); // 小端序
          this.sensorData.temp = rawValue;
          content = `温度: ${this.formatTemperature(rawValue)}`;
          
          // 通知其他组件温度更新
          uni.$emit('sensor-data', { temp: rawValue / 10.0 }); // 转换为实际温度值
        } 
        else if (characteristicId.toLowerCase() === HUMIDITY_CHARACTERISTIC.toLowerCase()) {
          // 湿度特征 (整数，单位%)
          const view = new DataView(buffer);
          rawValue = view.getUint16(0, true); // 小端序
          this.sensorData.humidity = rawValue;
          content = `湿度: ${this.formatHumidity(rawValue)}`;
          
          // 通知其他组件湿度更新
          uni.$emit('sensor-data', { humidity: rawValue });
        } else {
          // 其他特征值，转换为字符串
          content = this.arrayBufferToString(buffer);
        }
        
        // 更新最后更新时间
        this.lastUpdateTime = this.formatTime(new Date());
        
        // 添加到接收数据列表
        this.addLog(content);
        
        // 保存状态
        this.saveBluetoothState();
      } catch (error) {
        console.error('数据处理错误:', error);
      }
    },
    
    // 添加日志
    addLog(content) {
      this.receivedData.unshift({//数组开头添加
        time: new Date(),
        content,
        type: 'sensor'
      });
      
      // 限制最多保存100条数据
      if (this.receivedData.length > 100) {
        this.receivedData.pop();
      }
    },
    
    // 发送命令
    sendCommand(command) {
      if (!this.deviceId || !this.serviceId || !this.ledCharacteristicId) {
        console.error('未连接设备或缺少特征值，无法发送命令');
        return;
      }
      
      // 将命令转换为ArrayBuffer（小程序兼容方式）
      const commandData = this.stringToArrayBuffer(command);
      
      uni.writeBLECharacteristicValue({
        deviceId: this.deviceId,
        serviceId: this.serviceId,
        characteristicId: this.ledCharacteristicId,
        value: commandData,
        success: () => {
          console.log('命令发送成功:', command);
        },
        fail: (err) => {
          console.error('命令发送失败:', err);
          uni.showToast({
            title: '命令发送失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 添加字符串转ArrayBuffer的方法（小程序兼容）
    stringToArrayBuffer(str) {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
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
          this.clearSavedState();
          uni.hideLoading();
        },
        fail: (err) => {
          console.error('断开连接失败', err);
          // 即使断开失败，也清除状态（设备可能已关机）
          this.clearSavedState();
          uni.hideLoading();
          uni.showToast({
            title: '断开连接失败，设备可能已关机',
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
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    },
    
    // ArrayBuffer转字符串
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