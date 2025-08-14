<template>
	  <view :style="{ height: `${statusBarHeight}px` }"></view>
	  <page-title title="智能体助手" Theme="geryTheme"></page-title>
  <view class="music-player">

    <!-- 音乐封面 -->
    <view class="music-cover">
      <image :src="currentMusic.cover" mode="aspectFill" class="cover-image"></image>
    </view>

    <!-- 音乐信息 -->
    <view class="music-info">
      <text class="music-name">{{ currentMusic.name }}</text>
      <text class="music-artist">{{ currentMusic.artist }}</text>
    </view>

    <!-- 播放进度条 -->
    <view class="progress-container">
      <slider
        :value="currentTime"
        :max="duration"
        @change="onSliderChange"
        activeColor="#007aff"
        backgroundColor="#e4e4e4"
        block-size="12"
      />
      <view class="time-info">
        <text>{{ formatTime(currentTime) }}</text>
        <text>{{ formatTime(duration) }}</text>
      </view>
    </view>

    <!-- 播放控制按钮 -->
    <view class="control-buttons">
      <button class="control-button" @tap="playPrevious">上一首</button>
      <button class="control-button" @tap="togglePlay">
        {{ isPlaying ? '暂停' : '播放' }}
      </button>
      <button class="control-button" @tap="playNext">下一首</button>
    </view>
  </view>
</template>

<script>
	import pageTitle from '@/components/pageTitle.vue';
export default {
	components: {
	 pageTitle, // 注册 pageTitle 组件
	},
  data() {
    return {
	  statusBarHeight: this.$statusBarHeight,
      musicList: [
        {
          id: 1,
          name: 'River Flows in You',
          artist: '李闰珉',
          cover: '/static/musics/cover1.jpg',
          url: '/static/musics/River Flows in You.mp3',
        },
        {
          id: 2,
          name: 'Sacred Play Secret Place',
          artist: 'matryoshka',
          cover: '/static/musics/cover2.jpg',
          url: '/static/musics/Sacred Play Secret Place.mp3',
        },
        {
          id: 3,
          name: 'Dehors',
          artist: 'Jordann',
          cover: '/static/musics/cover3.jpg',
          url: '/static/musics/Dehors.mp3',
        },
      ], // 音乐列表
      currentMusicIndex: 0, // 当前播放音乐的索引
      currentMusic: {}, // 当前播放的音乐信息
      audio: null, // 音频对象
      isPlaying: false, // 是否正在播放
      currentTime: 0, // 当前播放时间
      duration: 0, // 音乐总时长
    };
  },
  onLoad() {
    this.initAudio();
  },
  methods: {
    // 初始化音频
    initAudio() {
      this.currentMusic = this.musicList[this.currentMusicIndex];
      this.audio = new Audio(this.currentMusic.url);

      // 监听音频加载完成事件
      this.audio.addEventListener('loadedmetadata', () => {
        this.duration = this.audio.duration;
      });

      // 监听音频时间更新事件
      this.audio.addEventListener('timeupdate', () => {
        this.currentTime = this.audio.currentTime;
      });

      // 监听音频播放结束事件
      this.audio.addEventListener('ended', () => {
        this.playNext();
      });
    },

    // 播放/暂停音乐
    togglePlay() {
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
      this.isPlaying = !this.isPlaying;
    },

    // 播放上一首
    playPrevious() {
      this.currentMusicIndex =
        (this.currentMusicIndex - 1 + this.musicList.length) % this.musicList.length;
      this.changeMusic();
    },

    // 播放下一首
    playNext() {
      this.currentMusicIndex = (this.currentMusicIndex + 1) % this.musicList.length;
      this.changeMusic();
    },

    // 切换音乐
    changeMusic() {
      this.audio.pause();
      this.isPlaying = false;
      this.currentTime = 0;
      this.currentMusic = this.musicList[this.currentMusicIndex];
      this.audio.src = this.currentMusic.url;
      if (this.isPlaying) {
        this.audio.play();
      }
    },

    // 拖动进度条调整播放位置
    onSliderChange(e) {
      this.audio.currentTime = e.detail.value;
    },

    // 格式化时间（将秒转换为分钟:秒）
    formatTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
  },
};
</script>

<style scoped>
.music-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.music-cover {
  width: 300rpx;
  height: 300rpx;
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 20px;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.music-info {
  text-align: center;
  margin-bottom: 20px;
}

.music-name {
  font-size: 24px;
  font-weight: bold;
  display: block;
}

.music-artist {
  font-size: 16px;
  color: #666;
}

.progress-container {
  width: 100%;
  margin-bottom: 20px;
}

.time-info {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #666;
}

.control-buttons {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.control-button {
  padding: 10px 20px;
  background-color: #007aff;
  color: #fff;
  border: none;
  border-radius: 5px;
}
</style>