<template>
  <view class="loading-container">
    <view class="loading-card">
      <image class="loading-icon" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiPjxwYXRoIGZpbGw9IiM0Mjg1RTQiIGQ9Ik03Mi42LDYzLjVjMCwxNC41LTExLjcsMjYuMi0yNi4yLDI2LjJTMTguOSw3OCwyMC4xLDYzLjVjMS4xLTEyLjMsMTEuMS0yMi4xLDIzLjUtMjEuNVM3Mi42LDUwLjIsNzIuNiw2My41eiI+IDxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InRyYW5zZm9ybSIgdHlwZT0icm90YXRlIiBmcm9tPSIwIDUwIDUwIiB0bz0iMzYwIDUwIDUwIiBkdXI9IjEuNHMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9wYXRoPjwvc3ZnPg=="></image>
      <view class="progress-wrapper">
        <progress :percent="progressPercent" activeColor="#4285E4" backgroundColor="#E0F0FF" stroke-width="12" show-info />
      </view>
      <text class="progress-text">{{ progressText }}</text>
      <button v-if="showRetry" class="retry-btn" @click="retryDownload">重试</button>
    </view>
    
    <view class="waves-container">
      <view class="wave wave1"></view>
      <view class="wave wave2"></view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      progressPercent: 0,
      progressText: '准备检查资源...',
      showRetry: false,
      cacheDir: `${wx.env.USER_DATA_PATH}/static`,
      isUnzipSupported: true,
      isDownloading: false,
      downloadId: 0,
      downloadStartTime: 0,
      downloadTask: null,
      localVersion: '0.0.0',
      serverVersion: '0.0.0',
    };
  },
  onLoad() {
    console.log('[onLoad] 页面加载开始');
    this.checkUnzipSupport();
    this.checkResourceVersion();
  },
  onUnload() {
    if (this.downloadTask) {
      console.log('[onUnload] 取消下载任务');
      this.downloadTask.abort();
      this.downloadTask = null;
    }
  },
  methods: {
    // ====================== 增强版资源检测 ======================
    async checkResourceVersion() {
      try {
        this.progressText = '检查资源版本...';
        
        // 1. 获取本地存储的版本号
        this.localVersion = wx.getStorageSync('resource_version') || '0.0.0';
        console.log(`[checkResourceVersion] 本地版本: ${this.localVersion}`);
        
        // 2. 获取服务器最新版本号
        const { data } = await new Promise((resolve, reject) => {
          wx.request({
            url: 'https://api.teastick.cn/api/resource/version',
            success: resolve,
            fail: reject
          });
        });
        
        this.serverVersion = data;
        console.log(`[checkResourceVersion] 服务器版本: ${this.serverVersion}`);
        
        // 3. 比较版本
        const versionDiff = this.compareVersion(this.localVersion, this.serverVersion);
        
        if (versionDiff < 0) {
          // 需要更新
          console.log('[checkResourceVersion] 需要更新资源');
          this.progressText = '发现新版本资源，准备下载...';
          setTimeout(() => this.downloadStaticZip(), 1000);
        } else {
          console.log('[checkResourceVersion] 资源版本匹配');
          
          // 4. 使用readDirContents检查资源完整性
          this.progressText = '检查资源完整性...';
          
          // 读取资源目录内容
          const files = await this.readDirContents(this.cacheDir);
          console.log('[checkResourceVersion] 资源目录文件数:', files.length);
          
          if (files.length > 0) {
            console.log('[checkResourceVersion] 资源完整，准备进入应用');
            this.progressText = '资源完整，准备进入应用...';
            setTimeout(() => this.navigateToHome(), 1500);
          } else {
            console.log('[checkResourceVersion] 资源丢失或为空，需要重新下载');
            this.progressText = '资源丢失，准备重新下载...';
            setTimeout(() => this.downloadStaticZip(), 1000);
          }
        }
      } catch (error) {
        console.error('[checkResourceVersion] 版本检查失败', error);
        this.handleError('版本检查失败', error);
      }
    },
    
    // 跳转到首页
    navigateToHome() {
		//设置全局资源路径
		const app = getApp();
		if (app && app.globalData) {
		  app.globalData.staticBasePath = this.cacheDir;
		  console.log('[handleDownloadSuccess] 全局资源路径已设置:', this.cacheDir);
		} else {
		  console.warn('[handleDownloadSuccess] 无法设置全局资源路径：globalData未定义');
		}
      console.log('[navigateToHome] 准备跳转到首页');
      uni.reLaunch({ url: '/pages/index/index' });
    },
    
    // ====================== 保留原有函数 ======================
    // 读取目录内容
    async readDirContents(dirPath) {
      console.log(`[readDirContents] 开始读取目录: ${dirPath}`);
      return new Promise((resolve) => {
        const fs = uni.getFileSystemManager();
        fs.readdir({
          dirPath: dirPath,
          success: res => {
            console.log(`[readDirContents] 目录读取成功: ${dirPath}, 文件数: ${res.files.length}`);
            resolve(res.files);
          },
          fail: () => {
            console.warn(`[readDirContents] 目录读取失败: ${dirPath}`);
            resolve([]);
          }
        });
      });
    },
    
    // 检查解压功能支持性
    async checkUnzipSupport() {
      console.log('[checkUnzipSupport] 开始检查解压支持性');
      try {
        const [deviceInfo, appInfo] = await Promise.all([
          wx.getDeviceInfo?.() || {},
          wx.getAppBaseInfo?.() || {}
        ]);
        
        const sdkVersion = appInfo.SDKVersion || deviceInfo.SDKVersion || '0.0.0';
        console.log('[checkUnzipSupport] 当前基础库版本:', sdkVersion);
        
        this.isUnzipSupported = this.compareVersion(sdkVersion, '2.11.0') >= 0;
        
        if (!this.isUnzipSupported) {
          console.warn('[checkUnzipSupport] 当前基础库版本不支持原生解压功能');
        }
        
        const fs = wx.getFileSystemManager();
        if (typeof fs.unzip !== 'function') {
          console.warn('[checkUnzipSupport] fs.unzip API不存在');
          this.isUnzipSupported = false;
        }
        
        console.log(`[checkUnzipSupport] 解压支持性检查完成: ${this.isUnzipSupported}`);
        return this.isUnzipSupported;
        
      } catch (e) {
        console.error('[checkUnzipSupport] 检查解压支持性失败', e);
        return false;
      }
    },
    
    // 版本比较方法
    compareVersion(v1, v2) {
      const arr1 = v1.split('.');
      const arr2 = v2.split('.');
      for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
        const num1 = parseInt(arr1[i] || 0);
        const num2 = parseInt(arr2[i] || 0);
        if (num1 !== num2) return num1 - num2;
      }
      return 0;
    },
    
    async downloadStaticZip() {
      if (this.isDownloading) {
        console.warn('[downloadStaticZip] 下载已在进行中，跳过重复调用');
        return;
      }
      
      try {
        this.isDownloading = true;
        this.downloadId++;
        this.downloadStartTime = Date.now();
        const currentDownloadId = this.downloadId;
        
        console.log(`[downloadStaticZip] 开始下载资源包 (ID: ${currentDownloadId})`);
        this.progressText = '正在下载资源包...';
        this.showRetry = false;
        this.progressPercent = 0;
        
        const cloudFilePath = 'https://env-00jxtx3i573t.normal.cloudstatic.cn/static/static.zip?expire_at=1754383947&er_sign=0a677c1a40178385076e45fc2feb1497';
        
        const { tempFilePath } = await new Promise((resolve, reject) => {
          try {
            const downloadTask = uni.downloadFile({
              url: cloudFilePath,
              success: (res) => {
                console.log(`[downloadTask] 下载成功 (ID: ${currentDownloadId})`);
                resolve(res);
              },
              fail: (err) => {
                console.error(`[downloadTask] 下载失败 (ID: ${currentDownloadId})`, err);
                reject(err);
              }
            });
            
            downloadTask.onProgressUpdate((res) => {
              if (this.downloadId !== currentDownloadId) {
                console.warn(`[downloadProgress] 跳过过期的下载进度更新 (ID: ${currentDownloadId})`);
                return;
              }
              
              const progress = res.progress;
              this.progressPercent = progress;
              this.progressText = `下载中 ${progress}%`;
              this.$forceUpdate();
            });
          } catch (taskErr) {
            console.error(`[downloadTask] 创建下载任务失败 (ID: ${currentDownloadId})`, taskErr);
            reject(new Error('创建下载任务失败'));
          }
        });
        
        console.log("[downloadStaticZip] 云文件下载临时路径:", tempFilePath);
        
        try {
          const fs = uni.getFileSystemManager();
          const fileInfo = fs.statSync(tempFilePath);
          const fileSizeMB = (fileInfo.size / 1024 / 1024).toFixed(2);
          console.log('[downloadStaticZip] 下载文件大小:', `${fileSizeMB}MB`);
        } catch (e) {
          console.warn('[downloadStaticZip] 无法获取文件信息', e);
        }
        
        await this.handleDownloadSuccess(tempFilePath);
      } catch (e) {
        this.handleError('下载异常', e);
      } finally {
        this.isDownloading = false;
        const duration = (Date.now() - this.downloadStartTime) / 1000;
        console.log(`[downloadStaticZip] 下载过程结束，耗时: ${duration.toFixed(2)}秒`);
      }
    },

    async handleDownloadSuccess(tempFilePath) {
      try {
        console.log('[handleDownloadSuccess] 开始处理下载成功的文件');
        this.progressText = '正在解压资源...';
        this.progressPercent = 50;
        
        console.log('[ensureDirExists] 检查缓存目录是否存在:', this.cacheDir);
        await this.ensureDirExists(this.cacheDir);
        
        const fs = wx.getFileSystemManager();
        if (!this.isUnzipSupported || typeof fs.unzip !== 'function') {
          console.error('[handleDownloadSuccess] 当前微信版本不支持原生解压功能');
          throw new Error('当前微信版本不支持原生解压功能');
        }
        
        console.log('[handleDownloadSuccess] 开始解压文件');
        console.log('源文件路径:', tempFilePath);
        console.log('目标路径:', this.cacheDir);
        
        await new Promise((resolve, reject) => {
          fs.unzip({
            zipFilePath: tempFilePath,
            targetPath: this.cacheDir,
            success: () => {
              console.log('[unzip] 解压成功');
              resolve();
            },
            fail: (err) => {
              console.error('[unzip] 解压失败', err);
              reject(err);
            }
          });
        });
        
        console.log('[handleDownloadSuccess] 验证解压结果');
        const files = await this.readDirContents(this.cacheDir);
        console.log('[handleDownloadSuccess] 解压后目录内容:', files);
        
        if (files.length === 0) {
          console.error('[handleDownloadSuccess] 解压失败：static目录为空');
          throw new Error('解压失败：static目录为空');
        }

        console.log('[handleDownloadSuccess] 解压完成！文件路径:', this.cacheDir);
        console.log('[handleDownloadSuccess] 解压文件数量:', files.length);
        
        // 保存新版本号
        wx.setStorageSync('resource_version', this.serverVersion);
        console.log(`[handleDownloadSuccess] 保存新版本号: ${this.serverVersion}`);
        
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.staticBasePath = this.cacheDir;
          console.log('[handleDownloadSuccess] 全局资源路径已设置:', this.cacheDir);
        } else {
          console.warn('[handleDownloadSuccess] 无法设置全局资源路径：globalData未定义');
        }
        
        console.log('[handleDownloadSuccess] 准备跳转到首页');
        this.progressText = '准备跳转到首页...';
        this.progressPercent = 100;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('[handleDownloadSuccess] 执行跳转到首页');
        uni.reLaunch({ url: '/pages/index/index' });

      } catch (e) {
        this.handleError('解压失败', e);
      } finally {
        // 清理临时文件 - 根据您的要求保持注释
        // console.log('[handleDownloadSuccess] 开始清理临时文件');
        // this.cleanTempFile(tempFilePath);
      }
    },
    
    // 确保目录存在
    async ensureDirExists(dirPath) {
      console.log(`[ensureDirExists] 检查目录是否存在: ${dirPath}`);
      return new Promise((resolve) => {
        const fs = uni.getFileSystemManager();
        fs.access({
          path: dirPath,
          success: () => {
            console.log(`[ensureDirExists] 目录已存在: ${dirPath}`);
            resolve();
          },
          fail: () => {
            console.log(`[ensureDirExists] 创建目录: ${dirPath}`);
            fs.mkdir({
              dirPath: dirPath,
              recursive: true,
              success: () => {
                console.log(`[ensureDirExists] 目录创建成功: ${dirPath}`);
                resolve();
              },
              fail: (err) => {
                console.error(`[ensureDirExists] 目录创建失败: ${dirPath}`, err);
                resolve();
              }
            });
          }
        });
      });
    },

    // 100%安全的错误处理方法
    handleError(msg, err) {
      console.log(`[handleError] 开始处理错误: ${msg}`);
      let errorMsg = '未知错误';
      
      if (typeof err === 'string') {
        errorMsg = err;
      } else if (err && typeof err === 'object') {
        try {
          if (err.errMsg) errorMsg = err.errMsg;
          else if (err.message) errorMsg = err.message;
          else errorMsg = '无法解析的错误对象';
        } catch {
          errorMsg = '无法解析的错误对象';
        }
      }
      
      console.log(`[handleError] 错误信息: ${errorMsg}`);
      
      this.progressText = `${msg}: ${errorMsg}`;
      this.showRetry = true;
      
      uni.showModal({
        title: '操作失败',
        content: this.progressText,
        showCancel: false
      });
      
      console.log(`[安全错误处理] ${msg}`, {
        message: errorMsg,
        originalError: err ? '有错误对象' : '无错误对象'
      });
    },
    
    // 重试下载
    retryDownload() {
      console.log('[retryDownload] 用户点击重试');
      this.progressPercent = 0;
      this.progressText = '准备下载资源包...';
      this.showRetry = false;
      this.downloadStaticZip();
    }
  }
};
</script>

<style>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 30px;
  background: linear-gradient(to bottom, #f0f8ff, #e0f0ff);
  position: relative;
  overflow: hidden;
}

.loading-card {
  width: 90%;
  max-width: 500px;
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 10px 30px rgba(66, 133, 228, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 10;
}

.loading-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 25px;
}

.progress-wrapper {
  width: 100%;
  margin: 15px 0;
}

progress {
  width: 100%;
  height: 15px;
  border-radius: 10px;
}

.progress-text {
  font-size: 16px;
  color: #4285E4;
  margin: 20px 0;
  text-align: center;
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: 0.5px;
}

.retry-btn {
  background: linear-gradient(to right, #4285E4, #54a0ff);
  color: white;
  border-radius: 30px;
  padding: 12px 40px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 6px 15px rgba(66, 133, 228, 0.4);
  margin-top: 10px;
  border: none;
  transition: all 0.3s ease;
}

.retry-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 8px rgba(66, 133, 228, 0.4);
}

.waves-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  overflow: hidden;
}

.wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 200%;
  height: 100px;
  background-repeat: repeat-x;
  opacity: 0.6;
  animation: wave-animation 8s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
}

.wave1 {
  background: radial-gradient(ellipse at center, #4285E4 0%, transparent 80%);
  height: 110px;
  animation-duration: 10s;
  opacity: 0.15;
}

.wave2 {
  background: radial-gradient(ellipse at center, #5fa0ff 0%, transparent 80%);
  animation-duration: 8s;
  animation-delay: -2s;
  opacity: 0.1;
}

@keyframes wave-animation {
  0% {
    transform: translateX(0) translateZ(0) scaleY(1);
  }
  50% {
    transform: translateX(-25%) translateZ(0) scaleY(0.8);
  }
  100% {
    transform: translateX(-50%) translateZ(0) scaleY(1);
  }
}
</style>