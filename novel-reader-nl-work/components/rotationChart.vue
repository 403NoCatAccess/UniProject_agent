<template>
	<view class="m-2">
		<swiper :indicator-dots="true" autoplay circular indicator-active-color="#fff" style="height: 380rpx;" @change="getCurrentImgIndex">
			<swiper-item v-for="(item,index) in imgArr" :key="index">
				<image :src="item.src" mode="aspectFill" class="w-100 animated" :class="currentImagIndex == index?'my-animate':''"></image>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	export default{
		data(){
			return{
				currentImagIndex: 0
			}
		},

		props:{
			imgArr:{
				type: Array,
				default: () => []
			}
		},
		methods:{
			getCurrentImgIndex(e){
				//console.log('e->',e)
				this.currentImagIndex = e.detail.current
			}
		}
	}
</script>

<style>
</style>