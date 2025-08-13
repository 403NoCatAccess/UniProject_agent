<template>
  <view class="">
    <view :style="{height:`${statusBarHeight}px`}"></view>
    <search-box @search="handleSearch"></search-box>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-indicator">
      <text>加载中...</text>
    </view>
    
    <!-- 错误提示 -->
    <view v-if="showError" class="error-box">
      <text>{{ errorMessage }}</text>
      <button @click="retryLoad">重试</button>
    </view>
    
    <!-- 正常内容 -->
    <view v-else>
      <!-- 轮播图 -->
      <view class="mt-2 px-2">
        <rotation-chart :imgArr="swiperImages"></rotation-chart>
      </view>
      
      <!-- 功能分类 -->
      <view class="flex align-center justify-between mx-3 my-4">
        <block v-for="(item,index) in functionSortArr" :key='index'>
          <view class="flex flex-column align-center"> <!-- @tap='switchToPage(index)' -->
            <my-icon :iconId="item.iconId" :iconColor="item.iconColor" iconSize="65rpx"></my-icon>
            <text class="mt-1 font text-light-black">{{item.name}}</text>
          </view>
        </block>
      </view>
      <recommend :Rebooks="safeRebooks"></recommend>
      <view v-for="(item,index) in safeBookList" :key="index">
        <list-header :title="item.category.cname"></list-header>
        <book-list :bookListArr="item.books"></book-list>
      </view>
    </view>
  </view>
</template>

<script>
import { convertStaticPath } from '@/utils/path';
import searchBox from '@/components/searchBox.vue';
import rotationChart from '@/components/rotationChart.vue';
import recommend from '@/components/compound/recommend.vue';
import bookList from '@/components/bookList.vue';
import listHeader from '@/components/listHeader.vue';

export default {
  components: {
    searchBox,
    rotationChart,
    recommend,
    listHeader,
    bookList
  },
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
      swiperImages: [],
      functionSortArr: [],
      Rebooks: [], // 原始推荐书籍数据
      bookList: [], // 原始书籍列表数据
      safeRebooks: [], // 转换后的推荐书籍
      safeBookList: [], // 转换后的书籍列表
      bookName: 0,
      loading: false,
      showError: false,
      errorMessage: ''
    };
  },
  methods: {
    async findswiperImages() {
      try {
        console.log('[findswiperImages] 开始加载数据');
        this.loading = true;
        this.showError = false;
        
        // 检查网络状态
        const networkType = await new Promise(resolve => {
          wx.getNetworkType({
            success: res => resolve(res.networkType),
            fail: () => resolve(null)
          });
        });
        
        if (!networkType || networkType === 'none') {
          throw new Error('网络连接不可用，请检查网络设置');
        }
        
        console.log('[findswiperImages] 网络状态正常:', networkType);
        
        // 确保全局资源路径已设置
        const app = getApp();
        if (!app.globalData || !app.globalData.staticBasePath) {
          throw new Error('资源路径未初始化');
        }
        
        console.log('[findswiperImages] 使用的资源路径:', app.globalData.staticBasePath);
        
        // 带重试机制的API请求
        const maxRetries = 3;
        let retryCount = 0;
        let res;
        
        while (retryCount < maxRetries) {
          try {
            console.log(`[findswiperImages] 尝试API请求 (${retryCount + 1}/${maxRetries})`);
            res = await this.$http.get('/index/loadData', {
              timeout: 10000
            });
            break;
          } catch (e) {
            retryCount++;
            if (retryCount >= maxRetries) {
              console.error('[findswiperImages] API请求失败次数达到上限');
              throw e; // 抛出原始错误
            }
            console.warn(`[findswiperImages] API请求失败，${2}秒后重试`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
        
        console.log('[findswiperImages] API请求成功');
        
        // 验证响应数据
        if (!res.data || typeof res.data !== 'object') {
          throw new Error('API返回数据格式错误');
        }
        
        const data = res.data;
        console.log('[findswiperImages] API响应数据:', data);
        
        // ====================== 批量路径转换 ======================
        console.log('[findswiperImages] 开始批量路径转换');
        
        // 1. 转换轮播图路径
        this.swiperImages = data.swiperImages.map(item => ({
          ...item,
          src: convertStaticPath(item.param8)
        }));
        
        // 2. 转换功能分类图标
        this.functionSortArr = data.functionSortArr.map(item => ({
          ...item,
          iconId: item.param1,
          iconColor: item.param2,
          name: item.param7,
          src: convertStaticPath(item.param8)
        }));
        
        // 3. 转换推荐书籍封面
        this.Rebooks = data.Rebooks; // 保存原始数据
        this.safeRebooks = data.Rebooks.map(book => ({
          ...book,
          cover: convertStaticPath(book.cover)
        }));
        
        // 4. 转换书籍列表封面
        this.bookList = data.bookResources; // 保存原始数据
        this.safeBookList = data.bookResources.map(category => ({
          ...category,
          books: category.books.map(book => ({
            ...book,
            indexImg: convertStaticPath(book.indexImg)
          }))
        }));
        
        console.log('[findswiperImages] 路径转换完成');
        console.log("转换后的推荐书籍:", this.safeRebooks);
        console.log("转换后的书籍列表:", this.safeBookList);
        
      } catch (err) {
        console.error('[findswiperImages] 数据加载失败:', err);
        
        // 安全设置错误信息
        let errorMsg = '未知错误';
        if (typeof err === 'string') {
          errorMsg = err;
        } else if (err && err.message) {
          errorMsg = err.message;
        } else if (err && err.errMsg) {
          errorMsg = err.errMsg;
        }
        
        this.errorMessage = errorMsg;
        this.showError = true;
        
        uni.showToast({
          title: `加载失败: ${errorMsg}`,
          icon: 'none',
          duration: 3000
        });
      } finally {
        this.loading = false;
        console.log('[findswiperImages] 加载过程结束');
      }
    },
    
    retryLoad() {
      console.log('[retryLoad] 用户点击重试');
      this.showError = false;
      this.findswiperImages();
    },
    
    switchToPage(index) {
      // 根据index跳转不同页面
      const pages = [
        '/pages/music/music',
        '/pages/sort/sort',
        '/pages/collection/collection',
        '/pages/mine/mine'
      ];
      
      if (pages[index]) {
        uni.navigateTo({
          url: pages[index]
        });
      }
    },
    
    handleSearch(bookName) {
      this.bookName = bookName;
      console.log('搜索书名:', this.bookName);
    }
  },
  onShow() {
    this.findswiperImages();
  }
};
</script>

<style>
.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
}

.error-box {
  padding: 20rpx;
  background-color: #ffeeee;
  border-radius: 8rpx;
  margin: 20rpx;
  text-align: center;
}

.error-box button {
  margin-top: 20rpx;
  background-color: #e64340;
  color: white;
}
</style>