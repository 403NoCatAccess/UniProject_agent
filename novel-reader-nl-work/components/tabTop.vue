<template><!-- 详情和目录选项 -->
	<view class="flex align-center border-bottom" style="height: : 80rpx;justify-content: space-around;">
		<block v-for="(item,index) in tabArr" :key="index">
			<view class="flex flex-column align-center" style="height: 80rpx;justify-content: space-around;" @tap="changeTabIndex(index)">
				<view class="font text-light-black pt-1 animated faster" :class="tabIndex===index?'font-weight-bold':''">
					{{item}}
				</view>
				<view class="rounded" style="width: 80rpx;height: 8rpx;background-color: #fb5f39;" v-show="tabIndex===index">
	
				</view>
			</view>
		</block>
		
	</view>
</template>

<script>
	export default{
		props:{
			tabIndex:{
				type: Number,
				default: 0
			},
			tabArr:{
				type: Array,
				default: ()=> []
			}
		},
		methods:{
			changeTabIndex(index){
				this.$emit("getTabIndex",index)
			}
		}
	}
</script>

<style>
</style>