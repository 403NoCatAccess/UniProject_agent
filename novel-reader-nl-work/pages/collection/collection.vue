<template>
  <view class="container">
    <view class="header">收藏</view>
    <view class="collection">
      <h1>已收藏的书籍</h1>
      <ul>
        <li v-for="book in collection" :key="book.id">
          <!-- 使用转换后的路径 -->
          <image :src="convertStaticPath(book.cover)" mode="widthFix" class="book-cover"></image>
          <view class="book-info">
            <view class="book-title">{{ book.name }}</view>
            <view class="book-author">作者：{{ book.author }}</view>
          </view>
          <button @click="removeFromCollection(book.id)">移除</button>
        </li>
      </ul>
    </view>
  </view>
</template>

<script>
import { convertStaticPath } from '@/utils/path';

export default {
  data() {
    return {
      collection: [], // 初始化空数组，用于存储从本地获取的收藏书籍
    };
  },
  methods: {
    // 路径转换方法
    convertStaticPath(path) {
      return convertStaticPath(path);
    },
    
    // 从本地存储中加载收藏的书籍
    loadCollection() {
      uni.getStorage({
        key: 'collectedBooks',
        success: (res) => {
          this.collection = res.data || []; // 如果本地存储中有数据，则赋值给 collection
        },
        fail: () => {
          this.collection = []; // 如果获取失败，则设置为空数组
        },
      });
    },
    
    // 移除收藏的书籍
    removeFromCollection(bookId) {
      uni.getStorage({
        key: 'collectedBooks',
        success: (res) => {
          let collectedBooks = res.data || [];
          const index = collectedBooks.findIndex(book => book.id === bookId);
          if (index !== -1) {
            collectedBooks.splice(index, 1); // 从数组中移除该书籍
            uni.setStorage({
              key: 'collectedBooks',
              data: collectedBooks,
              success: () => {
                this.loadCollection(); // 重新加载收藏列表
                uni.showToast({
                  title: '移除成功',
                  icon: 'success',
                });
              },
              fail: () => {
                uni.showToast({
                  title: '移除失败',
                  icon: 'none',
                });
              },
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '获取收藏列表失败',
            icon: 'none',
          });
        },
      });
    },
  },
  onShow() {
    this.loadCollection(); // 页面加载时，从本地存储中获取收藏的书籍
  },
};
</script>

<style scoped>
/* 样式保持不变 */
.container {
  padding: 20px;
}

.header {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.collection {
  margin-top: 20px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.book-cover {
  width: 80rpx;
  height: 120rpx;
  margin-right: 10px;
  border-radius: 5px;
}

.book-info {
  flex: 1;
}

.book-title {
  font-size: 16px;
  font-weight: bold;
}

.book-author {
  font-size: 14px;
  color: #666;
}

button {
  margin-left: 10px;
  background-color: #ff4d4f;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}
</style>