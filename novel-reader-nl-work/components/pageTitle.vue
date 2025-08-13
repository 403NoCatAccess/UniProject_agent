<template>
	<view class="Theme">
		<view :style="{height:`$(statusBarHeight)px`}"></view>
		<view class="flex align-center" style="height: 60rpx;">
			<my-icon iconId="icon-jiantou-copy" class="mx-2" @tap="quit"></my-icon>
			<my-icon iconId="icon-shouye" class="mx-2" @tap="changeToIndex"></my-icon>

			<view class="font-lg">
				{{title}}
			</view>
			<!-- 右侧图标和文本 -->
			<view class="flex align-center" @tap="changeToAiChat">
				<my-icon iconId="icon-yanjing" class="mx-2" ></my-icon>
				<text class="font-sm">AI</text>
			</view>


		</view>
		
	</view>
</template>

<script>
	export default{
		data(){
			return{
				statusBarHeight:this.$statusBarHeight,
			}
		},
		props:{
			title:{
				type:String,
				default:''
			},
			Theme:{
				type:String,
				default:''
			}
		},
		methods:{
			quit(){
				uni.navigateBack({
					data:1
				})
			},
			changeToAiChat(){
				console.log('跳转到聊天界面...')
				uni.navigateTo({
					url:'/pages/ai/deepseek'
				})
			},
			changeToIndex(){
				uni.switchTab({
					url:'/pages/index/index'
				})
			}
		}
	}
</script>

<style>
</style>