<template>
  <view class="book-list-container">
    <block v-for="(book, bindex) in bookListArr" :key="bindex">
      <view class="book-item flex p-1 border-bottom" hover-class="bg-light" @tap="navigateToDetail(book.bookId)">
        <!-- 直接使用父组件传递的已转换路径 -->
        <image :src="book.indexImg" mode="aspectFill" class="book-image rounded mx-2"></image>
        <view class="book-info flex-1 flex flex-column">
          <view class="book-title font py-2 font-weight-bold">
            《{{book.name}}》
          </view>
          <view class="book-description text-light-black">
            {{book.description}}
          </view>
        </view>
      </view>
    </block>
  </view>
</template>

<script>
export default {
  props: {
    bookListArr: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    navigateToDetail(bookId) {
      console.log('[navigateToDetail] 跳转到书籍详情', bookId);
      uni.navigateTo({
        url: `/pages/bookDetail/bookDetail?bookId=${bookId}`
      });
    }
  }
}
</script>

<style>
.book-list-container {
  background-color: #fff;
}

.book-item {
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
}

.book-item:active {
  background-color: #f9f9f9;
}

.book-image {
  width: 250rpx;
  height: 250rpx;
  object-fit: cover;
}

.book-title {
  font-size: 32rpx;
  color: #333;
}

.book-description {
  line-height: 42rpx;
  font-size: 28rpx;
  color: #666;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>