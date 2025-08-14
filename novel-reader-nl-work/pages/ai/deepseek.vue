<template>
  <view class="container">
    <!-- 固定顶部区域 -->
    <view class="fixed-top">
      <!-- 状态栏占位 -->
      <view :style="{ height: statusBarHeight + 'px' }"></view>
      
      <!-- 页面标题 -->
      <page-title title="智能体助手" Theme="geryTheme"></page-title>
      
      <!-- 作物培育状态面板 -->
      <view class="crop-panel">
        <!-- 第一行：作物信息 -->
        <view class="crop-row">
          <view class="crop-info">
            <text class="label">作物名称：</text>
            <text class="value">{{ cropName || '未设定' }}</text>
          </view>
          <view class="crop-info">
            <text class="label">适宜温度：</text>
            <text class="value">{{ suitableTemp.toFixed(1) }}&deg;C</text>
          </view>
          <view class="crop-info">
            <text class="label">适宜湿度：</text>
            <text class="value">{{ suitableHumidity.toFixed(1) }}%</text>
          </view>
        </view>
        
        <!-- 第二行：当前状态 -->
        <view class="crop-row">
          <view class="crop-info">
            <text class="label">系统状态：</text>
            <text :class="['status-value', statusClass]">{{ currentStatus }}</text>
          </view>
          <view class="crop-info">
            <text class="label">当前温度：</text>
            <text class="value">{{ currentTemp !== null ? currentTemp.toFixed(1) + '&deg;C' : '--' }}</text>
          </view>
          <view class="crop-info">
            <text class="label">当前湿度：</text>
            <text class="value">{{ currentHumidity !== null ? currentHumidity.toFixed(1) + '%' : '--' }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 可滚动的聊天记录区域 -->
    <scroll-view 
      scroll-y 
      class="chat-history" 
      :scroll-top="scrollTop"
      :style="{
        paddingTop: `${fixedTopHeight}px`,
        paddingBottom: '120rpx'
      }"
    >
      <view 
        v-for="(message, index) in chatHistory" 
        :key="index" 
        :class="message.type === 'user' ? 'user-message' : 'ai-message'"
      >
        <text>{{ message.text }}</text>
      </view>
    </scroll-view>
    
    <!-- 固定底部输入区域 -->
    <view class="fixed-bottom">
      <view class="input-container">
        <input 
          type="text" 
          :placeholder="loading ? 'AI输入中...' : '请输入要培育的作物名称（如：番茄、生菜）'" 
          class="input-field" 
          v-model="yourMessage" 
          @confirm="sendMessage" 
          confirm-type="search"
          :disabled="loading || !cropsLoaded"
        />
        <button @tap="sendMessage" class="send-button" v-show="!loading" :disabled="!cropsLoaded">发送</button>
        <uni-load-more status="loading" v-show="loading"></uni-load-more>
      </view>
    </view>
  </view>
</template>

<script>
import { callDeepSeekApi } from '@/common/deepSeekApi.js';
import pageTitle from '@/components/pageTitle.vue';
import api from '@/common/request.js'; // 导入封装的API请求模块

export default {
  components: {
    pageTitle,
  },
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
      yourMessage: '', // 用户输入的消息
      chatHistory: [], // 聊天历史记录
      loading: false, // 加载状态
      scrollTop: 0, // 滚动条位置
      fixedTopHeight: 0, // 顶部固定区域高度（动态计算）
      cropsLoaded: false, // 作物数据是否加载完成
      bluetoothConnected: false, // 蓝牙连接状态
      
      // 作物数据库（从后端获取）
      cropDatabase: {}, // 存储从后端获取的作物数据
      
      // 作物培育状态
      cropName: '', // 当前培育的作物名称
      suitableTemp: 0, // 适宜温度
      suitableHumidity: 0, // 适宜湿度
      currentStatus: '待机中', // 当前状态（正在调节/调节完毕）
      currentTemp: null, // 当前温度（从蓝牙获取）
      currentHumidity: null, // 当前湿度（从蓝牙获取）
      
      // 定时器
      tempHumidityTimer: null, // 温湿度模拟定时器
      adjustmentTimer: null, // 调节状态定时器
      adjustmentStartTime: null, // 调节开始时间
    };
  },
  computed: {
    // 根据状态设置样式
    statusClass() {
      if (!this.bluetoothConnected) return 'status-disconnected';
      return this.currentStatus === '正在调节' ? 'status-adjusting' : 'status-ok';
    }
  },
  watch: {
    // 监听聊天记录变化，保持最新10条记录
    chatHistory(newVal) {
      // 限制最多保存10条聊天记录
      if (newVal.length > 10) {
        // 只保留最新10条
        this.chatHistory = newVal.slice(-10);
      }
      
      // 滚动到最新消息
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    // 首先加载作物数据
    this.loadCropsData().then(() => {
      // 作物数据加载完成后，再加载聊天记录
      this.loadChatHistory();
    });
    
    // 监听键盘高度变化
    this.setupKeyboardListener();
    
    // 计算顶部固定区域高度
    this.$nextTick(() => {
      const query = uni.createSelectorQuery().in(this);
      query.select('.fixed-top').boundingClientRect(data => {
        if (data) {
          this.fixedTopHeight = data.height;
        }
      }).exec();
    });
    
    // 监听蓝牙状态变化
    uni.$on('bluetooth-status', this.handleBluetoothStatus);
    // 监听传感器数据更新
    uni.$on('sensor-data', this.handleSensorData);
    
    // 恢复蓝牙状态
    this.restoreBluetoothState();
  },
  beforeDestroy() {
    // 组件销毁时清除定时器
    clearInterval(this.tempHumidityTimer);
    clearInterval(this.adjustmentTimer);
    
    // 移除键盘监听
    uni.offKeyboardHeightChange();
    
    // 移除蓝牙事件监听
    uni.$off('bluetooth-status', this.handleBluetoothStatus);
    uni.$off('sensor-data', this.handleSensorData);
  },
  methods: {
    // 恢复蓝牙状态
    restoreBluetoothState() {
      // 尝试从本地存储恢复状态
      const savedState = uni.getStorageSync('bluetoothState');
      if (savedState) {
        this.bluetoothConnected = savedState.connectedDevice !== null;
        if (savedState.sensorData) {
          this.currentTemp = savedState.sensorData.temp / 10.0; // 转换为实际温度值
          this.currentHumidity = savedState.sensorData.humidity;
        }
      }
    },
    
    // 处理蓝牙状态变化
    handleBluetoothStatus(status) {
      this.bluetoothConnected = status.connected;
      
      if (!status.connected) {
        // 蓝牙断开时重置数据
        this.currentTemp = null;
        this.currentHumidity = null;
        this.currentStatus = '蓝牙断开';
      } else {
        this.currentStatus = '待机中';
      }
    },
    
    // 处理传感器数据
    handleSensorData(data) {
      if (data.temp !== undefined) {
        this.currentTemp = data.temp;
      }
      if (data.humidity !== undefined) {
        this.currentHumidity = data.humidity;
      }
      
      // 自动检测调节状态
      if (this.currentStatus === '正在调节') {
        // 检查温湿度是否达到目标范围（温度±1°C，湿度±1%）
        const tempDiff = Math.abs(this.currentTemp - this.suitableTemp);
        const humidityDiff = Math.abs(this.currentHumidity - this.suitableHumidity);
        
        if (tempDiff <= 1.0 && humidityDiff <= 1.0) {
          this.currentStatus = '调节完毕';
          // 发送停止调节命令
          this.sendControlCommand('stop');
        }
        
        // 检查是否超时（10分钟）
        if (this.adjustmentStartTime) {
          const now = Date.now();
          const duration = now - this.adjustmentStartTime;
          const timeout = 10 * 60 * 1000; // 10分钟
          
          if (duration > timeout) {
            this.currentStatus = '调节超时';
            this.sendControlCommand('stop');
          }
        }
      }
    },
    
    // 加载作物数据
	async loadCropsData() {
	  try {
		const response = await api.get('/api/crops');
		console.log('原始API响应:', response);

		this.cropDatabase = response.reduce((acc, crop) => {
		  // 使用正确的字段名 commonNames 而不是 common_names
		  let commonNames = [];
		  try {
			if (crop.commonNames) {
			  commonNames = JSON.parse(crop.commonNames);
			}
		  } catch (e) {
			console.warn('解析commonNames失败:', crop.commonNames, e);
			// 如果解析失败，尝试使用scientificName作为备选
			if (crop.scientificName) {
			  commonNames = [crop.scientificName];
			}
		  }

		  // 确保commonNames是数组
		  if (!Array.isArray(commonNames)) {
			commonNames = [];
		  }

		  // 为每个常见名称创建条目
		  commonNames.forEach(name => {
			if (name && typeof name === 'string') {
			  acc[name] = {
				// 使用正确的字段名 optimalTemperature 和 optimalHumidity
				temp: crop.optimalTemperature,
				humidity: crop.optimalHumidity
			  };
			}
		  });

		  return acc;
		}, {});

		console.log('转换后的作物数据:', JSON.parse(JSON.stringify(this.cropDatabase)));
		console.log('示例数据 - 番茄:', this.cropDatabase['番茄']); // 现在应该能正确输出
		
		this.cropsLoaded = true;
	  } catch (error) {
		console.error('加载作物数据失败:', error);
		// 使用本地备份数据
		this.cropDatabase = {
		  '番茄': { temp: 25, humidity: 60 },
		  '生菜': { temp: 18, humidity: 70 },
		  // ...其他备份数据
		};
		this.cropsLoaded = true;
		uni.showToast({
		  title: '作物数据加载失败，使用本地备份',
		  icon: 'none'
		});
	  }
	},
    
    // 设置键盘监听
    setupKeyboardListener() {
      uni.onKeyboardHeightChange(res => {
        // 键盘弹出时滚动到底部
        if (res.height > 0) {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      });
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.scrollTop = Math.random() * 10000; // 随机数强制滚动
    },
    
    // 加载聊天历史记录
    load极光ChatHistory() {
      uni.getStorage({
        key: 'chatHistory',
        success: (res) => {
          if (res.data) {
            this.chatHistory = res.data;
            
            // 只保留最新10条记录
            if (this.chatHistory.length > 10) {
              this.chatHistory = this.chatHistory.slice(-10);
            }
          }
        },
        fail: () => {
          console.log('获取聊天记录失败');
        },
      });
    },
    
    // 保存聊天历史记录（只保存最新10条）
    saveChatHistory() {
      // 只保存最新10条
      const saveMessages = this.chatHistory.slice(-10);
      
      uni.setStorage({
        key: 'chatHistory',
        data: saveMessages,
        success: () => {
          console.log('聊天记录保存成功');
        },
        fail: () => {
          console.log('聊天记录保存失败');
        },
      });
    },
    
    // 发送消息给DeepSeek
    async sendMessage() {
      if (this.yourMessage.trim() === '') {
        return;
      }
      
      this.loading = true;
      const userMessage = this.yourMessage;
      
      // 添加到聊天历史
      this.chatHistory.push({ type: 'user', text: userMessage });
      this.yourMessage = '';
      
      try {
        // 调用DeepSeek API处理作物请求
        const aiResponse = await this.processCropRequest(userMessage);
        console.log("DeepSeek API响应:", aiResponse);
        
        // 设置作物名称
        if (aiResponse.cropName) {
          this.cropName = aiResponse.cropName;
        }
        
        // 添加AI回复到聊天历史
        this.chatHistory.push({ type: 'ai', text: aiResponse.response });
        
        // 执行命令
        if (aiResponse.commands && aiResponse.commands.length > 0) {
          this.executeCommands(aiResponse.commands);
        }
        
        // 保存聊天记录
        this.saveChatHistory();
      } catch (error) {
        console.error('处理作物请求失败:', error);
        this.chatHistory.push({ 
          type: 'ai', 
          text: '抱歉，处理您的请求时出错，请稍后再试。' 
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 处理作物请求 - 调用DeepSeek API
    async processCropRequest(userMessage) {
      // 使用DeepSeek API处理自然语言请求
      const aiResponse = await callDeepSeekApi(userMessage, this.cropDatabase);
      return aiResponse;
    },
    
    // 执行命令
    executeCommands(commands) {
      if (!this.bluetoothConnected) {
        uni.showToast({
          title: '蓝牙未连接，无法执行命令',
          icon: 'none'
        });
        return;
      }
      
      commands.forEach(command => {
        console.log("执行命令:", command);
        switch(command.command) {
          case 'set_target':
            const [temp, humidity] = command.params.split(',');
            this.setTargetEnvironment(parseFloat(temp), parseFloat(humidity));
            // 发送设置命令到ESP32
            this.sendControlToDevice(parseFloat(temp), parseFloat(humidity));
            break;
          case 'start_adjustment':
            // 发送启动命令到ESP32
            this.sendControlCommand('start');
            this.currentStatus = '正在调节';
            this.adjustmentStartTime = Date.now(); // 记录调节开始时间
            break;
          case 'stop_adjustment':
            // 发送停止命令到ESP32
            this.sendControlCommand('stop');
            this.currentStatus = '调节完毕';
            this.adjustmentStartTime = null; // 重置调节开始时间
            break;
          default:
            console.warn('未知命令:', command.command);
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
      // 发送设置命令到ESP32
      uni.$emit('ble-command', { 
        type: 'set_target', 
        temp, 
        humidity 
      });
      
      // 提示用户
      uni.showToast({
        title: '已发送环境设置到下位机',
        icon: 'success'
      });
    },
    
    // 发送控制命令（启动/停止调节）
    sendControlCommand(cmdType) {
      uni.$emit('ble-command', { type: cmdType });
      
      // 提示用户
      uni.showToast({
        title: `已发送${cmdType === 'start' ? '启动' : '停止'}调节命令`,
        icon: 'success'
      });
    }
  },
};
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
}

/* 固定顶部区域 */
.fixed-top {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1000;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

/* 状态栏占位 */
.status-bar-placeholder {
  height: var(--status-bar-height);
}

/* 作物培育面板 */
.crop-panel {
  background-color: #f8f9fa;
  padding: 20rpx;
  border-radius: 0 0 16rpx 16rpx;
  margin: 0 20rpx 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.crop-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.crop-info {
  flex: 1;
  padding: 0 10rpx;
}

.label {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 5rpx;
}

.value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.status-value {
  font-size: 32rpx;
  font-weight: bold;
}

.status-ok {
  color: #28a745; /* 绿色表示正常 */
}

.status-adjusting {
  color: #ffc107; /* 黄色表示调节中 */
  animation: pulse 1.5s infinite;
}

.status-disconnected {
  color: #dc3545; /* 红色表示断开连接 */
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* 聊天历史样式 */
.chat-history {
  flex: 1;
  padding: 20rpx;
  background-color: #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow-y: auto;
  border-radius: 16rpx;
  margin: 20rpx;
  box-shadow: inset 0 0 10rpx rgba(0,0,0,0.05);
}

.user-message, .ai-message {
  display: flex;
  margin: 15rpx 0;
  padding: 20rpx;
  border-radius: 16rpx;
  max-width: 85%;
  font-size: 30rpx;
  line-height: 1.6;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
}

.user-message {
  background-color: #007aff;
  color: #fff;
  align-self: flex-end;
}

.ai-message {
  background-color: #282c34;
  color: #fff;
  align-self: flex-start;
}

/* 固定底部区域 */
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #fff;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding-bottom: env(safe-area-inset-bottom); /* 适配全面屏手机 */
}

/* 输入框容器样式 */
.input-container {
  display: flex;
  align-items: center;
  padding: 20rpx;
}

/* 输入框样式 */
.input-field {
  flex: 1;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 50rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  background-color: #f8f9fa;
}

/* 发送按钮样式 */
.send-button {
  padding: 15rpx 30rpx;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 50rpx;
  font-size: 28rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
}
</style>