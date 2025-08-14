<template>
	<text class="iconfont px-1 pb-1" :class="[iconId,iconColor]" :style="{fontSize:`${iconSize}`}"> </text>
</template>

<script>
	export default{
		props:{
			iconId:{
				type: String,
				default:''
			},
			iconColor:{
				type: String,
				default:'text-light-muted'
			},
			iconSize:{
				type: String,
				default: '35rpx'
			},
		}
	}
</script>

<style>
</style>