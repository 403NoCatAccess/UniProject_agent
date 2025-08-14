"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      progressPercent: 0,
      progressText: "准备检查资源...",
      showRetry: false,
      cacheDir: `${common_vendor.wx$1.env.USER_DATA_PATH}/static`,
      isUnzipSupported: true,
      isDownloading: false,
      downloadId: 0,
      downloadStartTime: 0,
      downloadTask: null,
      localVersion: "0.0.0",
      serverVersion: "0.0.0"
    };
  },
  onLoad() {
    console.log("[onLoad] 页面加载开始");
    this.checkUnzipSupport();
    this.checkResourceVersion();
  },
  onUnload() {
    if (this.downloadTask) {
      console.log("[onUnload] 取消下载任务");
      this.downloadTask.abort();
      this.downloadTask = null;
    }
  },
  methods: {
    // ====================== 增强版资源检测 ======================
    async checkResourceVersion() {
      try {
        this.progressText = "检查资源版本...";
        this.localVersion = common_vendor.wx$1.getStorageSync("resource_version") || "0.0.0";
        console.log(`[checkResourceVersion] 本地版本: ${this.localVersion}`);
        const { data } = await new Promise((resolve, reject) => {
          common_vendor.wx$1.request({
            url: "https://api.teastick.cn/api/resource/version",
            success: resolve,
            fail: reject
          });
        });
        this.serverVersion = data;
        console.log(`[checkResourceVersion] 服务器版本: ${this.serverVersion}`);
        const versionDiff = this.compareVersion(this.localVersion, this.serverVersion);
        if (versionDiff < 0) {
          console.log("[checkResourceVersion] 需要更新资源");
          this.progressText = "发现新版本资源，准备下载...";
          setTimeout(() => this.downloadStaticZip(), 1e3);
        } else {
          console.log("[checkResourceVersion] 资源版本匹配");
          this.progressText = "检查资源完整性...";
          const files = await this.readDirContents(this.cacheDir);
          console.log("[checkResourceVersion] 资源目录文件数:", files.length);
          if (files.length > 0) {
            console.log("[checkResourceVersion] 资源完整，准备进入应用");
            this.progressText = "资源完整，准备进入应用...";
            setTimeout(() => this.navigateToHome(), 1500);
          } else {
            console.log("[checkResourceVersion] 资源丢失或为空，需要重新下载");
            this.progressText = "资源丢失，准备重新下载...";
            setTimeout(() => this.downloadStaticZip(), 1e3);
          }
        }
      } catch (error) {
        console.error("[checkResourceVersion] 版本检查失败", error);
        this.handleError("版本检查失败", error);
      }
    },
    // 跳转到首页
    navigateToHome() {
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.staticBasePath = this.cacheDir;
        console.log("[handleDownloadSuccess] 全局资源路径已设置:", this.cacheDir);
      } else {
        console.warn("[handleDownloadSuccess] 无法设置全局资源路径：globalData未定义");
      }
      console.log("[navigateToHome] 准备跳转到首页");
      common_vendor.index.reLaunch({ url: "/pages/index/index" });
    },
    // ====================== 保留原有函数 ======================
    // 读取目录内容
    async readDirContents(dirPath) {
      console.log(`[readDirContents] 开始读取目录: ${dirPath}`);
      return new Promise((resolve) => {
        const fs = common_vendor.index.getFileSystemManager();
        fs.readdir({
          dirPath,
          success: (res) => {
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
      var _a, _b, _c, _d;
      console.log("[checkUnzipSupport] 开始检查解压支持性");
      try {
        const [deviceInfo, appInfo] = await Promise.all([
          ((_b = (_a = common_vendor.wx$1).getDeviceInfo) == null ? void 0 : _b.call(_a)) || {},
          ((_d = (_c = common_vendor.wx$1).getAppBaseInfo) == null ? void 0 : _d.call(_c)) || {}
        ]);
        const sdkVersion = appInfo.SDKVersion || deviceInfo.SDKVersion || "0.0.0";
        console.log("[checkUnzipSupport] 当前基础库版本:", sdkVersion);
        this.isUnzipSupported = this.compareVersion(sdkVersion, "2.11.0") >= 0;
        if (!this.isUnzipSupported) {
          console.warn("[checkUnzipSupport] 当前基础库版本不支持原生解压功能");
        }
        const fs = common_vendor.wx$1.getFileSystemManager();
        if (typeof fs.unzip !== "function") {
          console.warn("[checkUnzipSupport] fs.unzip API不存在");
          this.isUnzipSupported = false;
        }
        console.log(`[checkUnzipSupport] 解压支持性检查完成: ${this.isUnzipSupported}`);
        return this.isUnzipSupported;
      } catch (e) {
        console.error("[checkUnzipSupport] 检查解压支持性失败", e);
        return false;
      }
    },
    // 版本比较方法
    compareVersion(v1, v2) {
      const arr1 = v1.split(".");
      const arr2 = v2.split(".");
      for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
        const num1 = parseInt(arr1[i] || 0);
        const num2 = parseInt(arr2[i] || 0);
        if (num1 !== num2)
          return num1 - num2;
      }
      return 0;
    },
    async downloadStaticZip() {
      if (this.isDownloading) {
        console.warn("[downloadStaticZip] 下载已在进行中，跳过重复调用");
        return;
      }
      try {
        this.isDownloading = true;
        this.downloadId++;
        this.downloadStartTime = Date.now();
        const currentDownloadId = this.downloadId;
        console.log(`[downloadStaticZip] 开始下载资源包 (ID: ${currentDownloadId})`);
        this.progressText = "正在下载资源包...";
        this.showRetry = false;
        this.progressPercent = 0;
        const cloudFilePath = "https://env-00jxtx3i573t.normal.cloudstatic.cn/static/static.zip?expire_at=1754383947&er_sign=0a677c1a40178385076e45fc2feb1497";
        const { tempFilePath } = await new Promise((resolve, reject) => {
          try {
            const downloadTask = common_vendor.index.downloadFile({
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
            reject(new Error("创建下载任务失败"));
          }
        });
        console.log("[downloadStaticZip] 云文件下载临时路径:", tempFilePath);
        try {
          const fs = common_vendor.index.getFileSystemManager();
          const fileInfo = fs.statSync(tempFilePath);
          const fileSizeMB = (fileInfo.size / 1024 / 1024).toFixed(2);
          console.log("[downloadStaticZip] 下载文件大小:", `${fileSizeMB}MB`);
        } catch (e) {
          console.warn("[downloadStaticZip] 无法获取文件信息", e);
        }
        await this.handleDownloadSuccess(tempFilePath);
      } catch (e) {
        this.handleError("下载异常", e);
      } finally {
        this.isDownloading = false;
        const duration = (Date.now() - this.downloadStartTime) / 1e3;
        console.log(`[downloadStaticZip] 下载过程结束，耗时: ${duration.toFixed(2)}秒`);
      }
    },
    async handleDownloadSuccess(tempFilePath) {
      try {
        console.log("[handleDownloadSuccess] 开始处理下载成功的文件");
        this.progressText = "正在解压资源...";
        this.progressPercent = 50;
        console.log("[ensureDirExists] 检查缓存目录是否存在:", this.cacheDir);
        await this.ensureDirExists(this.cacheDir);
        const fs = common_vendor.wx$1.getFileSystemManager();
        if (!this.isUnzipSupported || typeof fs.unzip !== "function") {
          console.error("[handleDownloadSuccess] 当前微信版本不支持原生解压功能");
          throw new Error("当前微信版本不支持原生解压功能");
        }
        console.log("[handleDownloadSuccess] 开始解压文件");
        console.log("源文件路径:", tempFilePath);
        console.log("目标路径:", this.cacheDir);
        await new Promise((resolve, reject) => {
          fs.unzip({
            zipFilePath: tempFilePath,
            targetPath: this.cacheDir,
            success: () => {
              console.log("[unzip] 解压成功");
              resolve();
            },
            fail: (err) => {
              console.error("[unzip] 解压失败", err);
              reject(err);
            }
          });
        });
        console.log("[handleDownloadSuccess] 验证解压结果");
        const files = await this.readDirContents(this.cacheDir);
        console.log("[handleDownloadSuccess] 解压后目录内容:", files);
        if (files.length === 0) {
          console.error("[handleDownloadSuccess] 解压失败：static目录为空");
          throw new Error("解压失败：static目录为空");
        }
        console.log("[handleDownloadSuccess] 解压完成！文件路径:", this.cacheDir);
        console.log("[handleDownloadSuccess] 解压文件数量:", files.length);
        common_vendor.wx$1.setStorageSync("resource_version", this.serverVersion);
        console.log(`[handleDownloadSuccess] 保存新版本号: ${this.serverVersion}`);
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.staticBasePath = this.cacheDir;
          console.log("[handleDownloadSuccess] 全局资源路径已设置:", this.cacheDir);
        } else {
          console.warn("[handleDownloadSuccess] 无法设置全局资源路径：globalData未定义");
        }
        console.log("[handleDownloadSuccess] 准备跳转到首页");
        this.progressText = "准备跳转到首页...";
        this.progressPercent = 100;
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("[handleDownloadSuccess] 执行跳转到首页");
        common_vendor.index.reLaunch({ url: "/pages/index/index" });
      } catch (e) {
        this.handleError("解压失败", e);
      } finally {
      }
    },
    // 确保目录存在
    async ensureDirExists(dirPath) {
      console.log(`[ensureDirExists] 检查目录是否存在: ${dirPath}`);
      return new Promise((resolve) => {
        const fs = common_vendor.index.getFileSystemManager();
        fs.access({
          path: dirPath,
          success: () => {
            console.log(`[ensureDirExists] 目录已存在: ${dirPath}`);
            resolve();
          },
          fail: () => {
            console.log(`[ensureDirExists] 创建目录: ${dirPath}`);
            fs.mkdir({
              dirPath,
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
      let errorMsg = "未知错误";
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err && typeof err === "object") {
        try {
          if (err.errMsg)
            errorMsg = err.errMsg;
          else if (err.message)
            errorMsg = err.message;
          else
            errorMsg = "无法解析的错误对象";
        } catch {
          errorMsg = "无法解析的错误对象";
        }
      }
      console.log(`[handleError] 错误信息: ${errorMsg}`);
      this.progressText = `${msg}: ${errorMsg}`;
      this.showRetry = true;
      common_vendor.index.showModal({
        title: "操作失败",
        content: this.progressText,
        showCancel: false
      });
      console.log(`[安全错误处理] ${msg}`, {
        message: errorMsg,
        originalError: err ? "有错误对象" : "无错误对象"
      });
    },
    // 重试下载
    retryDownload() {
      console.log("[retryDownload] 用户点击重试");
      this.progressPercent = 0;
      this.progressText = "准备下载资源包...";
      this.showRetry = false;
      this.downloadStaticZip();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.progressPercent,
    b: common_vendor.t($data.progressText),
    c: $data.showRetry
  }, $data.showRetry ? {
    d: common_vendor.o((...args) => $options.retryDownload && $options.retryDownload(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
