<template>
	
	<view >
		<view :style="{height:`${statusBarHeight}px`}"></view>
		<page-title :title="`搜索结果:${bookName}`" Theme="geryTheme"></page-title>
		<view v-show="SearchSuccess">
			<block v-for="(book,bindex) in TargetbookArr" :key="bindex">
			<view class=" flex p-1 border-bottom" hover-class="bg-light" @tap="toBookDetail(13)">
				<image :src="book.indexImg" mode="aspectFill" style="width: 250rpx;height: 250rpx;" class="rounded mx-2"></image>
				<view class="flex-1 flex flex-column">
					<view class="font py-2 font-weight-bold">
						《{{book.name}}》
					</view>
					<view style="line-height: 42rpx;font-size:28rpx;" class="text-light-black">
						{{book.description}}
					</view>
				</view>
			 </view>
			</block>

		</view>
		<view v-show="!SearchSuccess">
			这里空空如也...打错了什么字吗？
		</view>
	</view>
</template>

<script>
	import { convertStaticPath } from '@/utils/path';
	import bookDetailVue from '../bookDetail/bookDetail.vue'
import pageTitle from '@/components/pageTitle.vue'
	export default{
		components:{
			pageTitle,
			
		},
		data() {
		   return {
		     bookName: '',
			 AllBooks:[],
			 TargetbookArr:[],
			 SearchSuccess:false,
			 statusBarHeight: this.$statusBarHeight,
		   }
		 },
		 methods:{
			 isFound(){
			 			 //发送请求获取书名   书名资源->四个分类->每个分类一组books->books存放若干本书的信息
			 			 this.$http.get('/index/loadData').then(res=>{
			 				 let bookdata = res.data.bookResources
							 this.SearchSuccess=false
			 				 bookdata.forEach(itemSort=>{//每个分类 包含books和category..
			 					 itemSort.books.forEach(itembooks=>{//包含每个书的信息
								    itembooks.indexImg = convertStaticPath(itembooks.indexImg)
			 						 this.AllBooks.push(itembooks)
									 console.log('itembooks->',itembooks)//打印获取的书籍信息
			 					 })
			 				 })
							 //查找目标书籍
							 this.AllBooks.forEach(EveryBook=>{
							 	 console.log('bookname->',EveryBook.name)
								 // if(EveryBook.name==this.bookName)
								 if(EveryBook.name.includes(this.bookName)||EveryBook.description.includes(this.bookName)||EveryBook.author.includes(this.bookName)
								 ||EveryBook.briefIntroduction.includes(this.bookName))//名字或简介包含
								 {
								  this.TargetbookArr.push(EveryBook)
								  this.SearchSuccess = true
								  console.log('查找到Targetbook->',this.TargetbookArr)
								 }
							 })
			 				 
			 			 }) //发送请求需要时间，写在外面执行顺序会出错
			 			 //判断书本是否存在，并找出书本信息

			 },
			 toBookDetail(bookId){
			 	uni.navigateTo({
			 		url: `/pages/bookDetail/bookDetail?bookId=${bookId}`
			 	})
			 }
		 },
		onLoad(options) {
		   this.bookName = decodeURIComponent(options.bookName)// 从 URL 中获取书名decodeURIComponent(options.bookName)
		   console.log('接收到的书名:', this.bookName)
		   this.isFound()
		   // 在这里执行搜索和加载结果的操作
		}
	}
</script>

<style>
	.geryTheme{
		background-color: #a8b0c3
	}
</style>