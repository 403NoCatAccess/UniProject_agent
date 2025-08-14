<template>
	<view class="flex align-center justify-center mx-2 border rounded by-light" style="height: 70rpx; opacity: .8;">
		<!-- <text class="iconfont icon-tubiao11 text-light-muted px-1 pb-1" style="font-size: 25rpx;"></text> -->
		<my-icon icon-Id="icon-tubiao11" icong-Color="text-light-muted" icon-Size="25rpx"></my-icon>
		<input type="text" placeholder="请输入想要查找的图书名称" class="flex-1 font-sm"
		 v-model="searchText" @confirm="handleSearch" confirm-type="search"/>
	</view>
	

</template>

<script>
	// import myIcon from '@/components/myIcon.vue'
	// export default{
	// 	components:{
	// 		myIcon
	// 	}
	// }
	export default{
		data(){
			return{
				searchText:'',//绑定要搜索的书名
				
			}
		},
		methods:{
			    handleSearch() {
			      //this.$emit('search', this.searchText);
				  uni.navigateTo({
				       url: `/pages/searchResults/searchResults?bookName=${this.searchText}` // 跳转到搜索结果页面，并传递书名作为查询参数
				  })
			    }
		}
	}
</script>

<style>
</style>