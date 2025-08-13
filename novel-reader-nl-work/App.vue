<script>
export default {
  onLaunch() {
    // 增加版本控制逻辑：避免更新后缓存冲突
    const currentVersion = '1.0.1'; // 每次静态资源更新需修改版本号
    const savedVersion = uni.getStorageSync('static_version');
    const staticLoaded = uni.getStorageSync('static_loaded');
    
    // 增加H5平台的跳过逻辑
    // #ifdef H5
    uni.reLaunch({ url: '/pages/index/index' });
    return;
    // #endif

    // 增加版本校验和资源加载状态检查
    if (!staticLoaded || savedVersion !== currentVersion) {
      uni.reLaunch({ url: '/pages/loading/loading' });
    } else {
      uni.reLaunch({ url: '/pages/index/index' });
    }
  }
}
</script>

<style>
  /* 添加平台差异化样式 */
  /* #ifndef H5 */
  @import url("common/css/free.css");
  /* #endif */
  
  @import url("common/css/iconfont.css");
  @import url("common/css/animate.css");
  @import url("common/css/myanimate.css");
  @import url("./common/css/theme.css");
</style>