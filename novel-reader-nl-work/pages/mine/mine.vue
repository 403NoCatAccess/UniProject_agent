<template>
  <view class="modern-container">
    <!-- 顶部状态栏占位 -->
    <view :style="{ height: `${statusBarHeight}px` }" class="status-bar-placeholder"></view>
    
    <!-- 主标题 -->
    <view class="header">
      <text class="app-title">智能助手中心</text>
      <text class="app-subtitle">选择您需要的服务</text>
    </view>
    
    <!-- 服务卡片容器 -->
    <view class="cards-container">
      <!-- AI助手卡片 -->
      <view class="service-card ai-card" @tap="changeToAiChat">
        <view class="card-icon">💬</view>
        <text class="card-title">AI聊天助手</text>
        <text class="card-desc">与智能AI进行对话交流</text>
        <view class="card-footer">
          <text>立即体验</text>
          <view class="arrow">→</view>
        </view>
      </view>
      
      <!-- 蓝牙卡片 -->
      <view class="service-card bluetooth-card" @tap="changeToBluetooth">
        <view class="card-icon">📱</view>
        <text class="card-title">蓝牙设备控制</text>
        <text class="card-desc">连接并管理蓝牙设备</text>
        <view class="card-footer">
          <text>立即使用</text>
          <view class="arrow">→</view>
        </view>
      </view>
    </view>
    
    <!-- 底部装饰 -->
    <view class="footer">
      <text>智能生活 · 触手可及</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
    };
  },
  methods: {
    changeToAiChat() {
      console.log('跳转到聊天界面...');
      uni.navigateTo({
        url: '/pages/ai/deepseek'
      });
    },
    changeToBluetooth() {
      console.log('跳转到蓝牙上位机...');
      uni.navigateTo({
        url: '/pages/bluetooth/bluetooth'
      });
    }
  }
};
</script>

<style>
.modern-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20rpx;
}

.status-bar-placeholder {
  /* 仅占位用 */
}

.header {
  text-align: center;
  padding: 40rpx 0;
}

.app-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #2c3e50;
  display: block;
  margin-bottom: 10rpx;
}

.app-subtitle {
  font-size: 32rpx;
  color: #7f8c8d;
  display: block;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-top: 40rpx;
  padding: 0 20rpx;
}

.service-card {
  background: white;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.service-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 8rpx;
}

.ai-card::before {
  background: linear-gradient(90deg, #3498db, #8e44ad);
}

.bluetooth-card::before {
  background: linear-gradient(90deg, #2ecc71, #3498db);
}

.service-card:active {
  transform: translateY(-8rpx);
  box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 80rpx;
  margin-bottom: 30rpx;
  text-align: center;
}

.card-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #2c3e50;
  display: block;
  margin-bottom: 10rpx;
}

.card-desc {
  font-size: 28rpx;
  color: #7f8c8d;
  display: block;
  margin-bottom: 30rpx;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1rpx solid #ecf0f1;
  padding-top: 20rpx;
  color: #3498db;
  font-weight: bold;
}

.arrow {
  font-size: 36rpx;
  font-weight: bold;
}

.footer {
  text-align: center;
  padding: 40rpx 0;
  color: #7f8c8d;
  font-size: 28rpx;
  margin-top: auto;
}
</style>