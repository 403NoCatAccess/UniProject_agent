<template>
	
	<view class="geryTheme cal">
		<view :style="{height: `${statusBarHeight}px`}" class="cal"></view>
		<page-title title="图书详情" Theme="geryTheme"></page-title>
		<view class="flex align-center py-2 geryTheme" style="height: 250rpx;">
			<image :src="book.cover" mode="widthFix" class="flex-1 mx-2 rounded"></image>
			<view class="flex-2">
				<view style="font-size: 45rpx;">{{book.name}}</view>
				<view class="font mt-1">作者：{{book.author}}</view>
				<view class="flex align-center mt-2">
					<button class="flex-1 mr-2">分享</button>
					<!-- <button class="flex-1 mr-2">收藏</button> -->
					<button class="flex-1 mr-2" :class="isCollected ? 'btn-collected' : ''" @click="toggleCollection">{{isCollected ? '取消收藏' : '收藏'}}</button>
				</view>
				
			</view>
		</view>

	</view>
	<tab-top :tabArr="['详情','目录']" @getTabIndex="getTabIndex" :tabIndex="tabIndex" class="cal"></tab-top><!-- 详情目录 -->
	<scroll-view scroll-y="true" v-show="tabIndex===0" :style="{height:`${calHeight}rpx`}"><!-- 详情 -->
		<view>
			<view class="flex justify-center text-light-black py-2">
				——简介——
			</view>
			<view class="font-lg px-2" style="line-height: 80rpx;">
				{{book.briefIntroduction}}
			</view>
		</view>
	</scroll-view>
	
	<scroll-view scroll-y="true" v-show="tabIndex===1" :style="{height:`${calHeight}rpx`}"><!-- 目录 -->
		<block v-for="(item,index) in chapterCatalog" :key="item.id">
			<view hover-class="bg-light" class="p-2 border-bottom text-ellipsis" @tap="toReadingPage(item.id)">{{item.title}}</view><!-- hover点击时的样式 -->
		</block>
	</scroll-view>
</template>

<script>
	
	import { convertStaticPath } from '@/utils/path';
	import pageTitle from '@/components/pageTitle.vue'
	import tabTop from '@/components/tabTop.vue'
	import unit from '@/common/unit'
	export default{
		components:{
			pageTitle,
			tabTop
		},
		data(){
			return{
				book:{
					name:'',
					briefInteoduction:'图书简介...',
					author:'',
					cover:''		
				},
				isCollected: false, // 用于记录当前书籍是否已收藏,
				tabIndex: 0,
				chapterCatalog:[],
				calHeight: 0,
				statusBarHeight: this.$statusBarHeight,
			}
		},
		props:{
			bookId:{
				type:String
			}
		},
		methods:{
			getBookById(bookId){
				this.$http.get("/book/"+bookId).then(res=>{
					let data=res.data
					this.book=data
					this.book.cover = convertStaticPath(this.book.cover)
					this.checkIfCollected(data.id); // 检查该书籍是否已收藏
				})
			},
			getTabIndex(tabIndex){
				this.tabIndex = tabIndex
			},
			getCatalogListByBookId(bookId){
				this.$http.get("/ChapterCatalog/" + bookId).then(res=>{
					let data = res.data
					this.chapterCatalog = data
				})
			},
			toReadingPage(catalogId){
				uni.navigateTo({
					url:`/pages/detail/readingPage?catalogId=${catalogId}&bookId=${this.bookId}&bookName=${this.book.name}`
				})
			},
			////收藏
			toggleCollection() {
			  if (this.isCollected) {
			   this.removeFromCollection(this.book.id);
			  } else {
			     this.addToCollection(this.book.id, this.book.name, this.book.author, this.book.cover);
			  }
			},
			addToCollection(bookId, bookName, author, cover) {
			      uni.getStorage({
			        key: 'collectedBooks',
			        success: (res) => {
			          let collectedBooks = res.data || [];
			          collectedBooks.push({ id: bookId, name: bookName, author: author, cover: cover });
			          this.saveCollectedBooks(collectedBooks);
			        },
			        fail: () => {
			          let collectedBooks = [{ id: bookId, name: bookName, author: author, cover: cover }];
			          this.saveCollectedBooks(collectedBooks);
			        }
			      });
			      this.isCollected = true;
			    },
			    removeFromCollection(bookId) {
			      uni.getStorage({
			        key: 'collectedBooks',
			        success: (res) => {
			          let collectedBooks = res.data || [];
			          const index = collectedBooks.findIndex(book => book.id === bookId);
			          if (index !== -1) {
			            collectedBooks.splice(index, 1);
			            this.saveCollectedBooks(collectedBooks);
			          }
			        },
			        fail: () => {
			          console.log('Failed to load collected books.');
			        }
			      });
			      this.isCollected = false;
			    },
			    saveCollectedBooks(collectedBooks) {
			      uni.setStorage({
			        key: 'collectedBooks',
			        data: collectedBooks,
			        success: () => {
			          console.log('Collected books saved successfully.');
			        },
			        fail: () => {
			          console.log('Failed to save collected books.');
			        }
			      });
			    },
			    checkIfCollected(bookId) {
			      uni.getStorage({
			        key: 'collectedBooks',
			        success: (res) => {
			          let collectedBooks = res.data || [];
			          this.isCollected = collectedBooks.some(book => book.id === bookId);
			        },
			        fail: () => {
			          this.isCollected = false;
			        }
			      });
			    }
		},
		mounted(){
			unit.calSurplusHeight({
				pageID:this,
				pos: 'cal',
				success: val=>this.calHeight = val
			})
			console.log('bookDetail-this.calHeight->',this.calHeight)
		},
		onShow(options){
			let bookId = parseInt(this.bookId)
			//查询图书详情
			this.getBookById(bookId)
			//查询图书目录
			this.getCatalogListByBookId(bookId)
		},
	}
</script>

<style>
	.geryTheme{
		background-color: #a8b0c3
	}
</style>