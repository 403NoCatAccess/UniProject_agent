"use strict";
const common_vendor = require("../../common/vendor.js");
const pageTitle = () => "../../components/pageTitle.js";
const _sfc_main = {
  components: {
    pageTitle
    // 注册 pageTitle 组件
  },
  data() {
    return {
      statusBarHeight: this.$statusBarHeight,
      musicList: [
        {
          id: 1,
          name: "River Flows in You",
          artist: "李闰珉",
          cover: "/static/musics/cover1.jpg",
          url: "/static/musics/River Flows in You.mp3"
        },
        {
          id: 2,
          name: "Sacred Play Secret Place",
          artist: "matryoshka",
          cover: "/static/musics/cover2.jpg",
          url: "/static/musics/Sacred Play Secret Place.mp3"
        },
        {
          id: 3,
          name: "Dehors",
          artist: "Jordann",
          cover: "/static/musics/cover3.jpg",
          url: "/static/musics/Dehors.mp3"
        }
      ],
      // 音乐列表
      currentMusicIndex: 0,
      // 当前播放音乐的索引
      currentMusic: {},
      // 当前播放的音乐信息
      audio: null,
      // 音频对象
      isPlaying: false,
      // 是否正在播放
      currentTime: 0,
      // 当前播放时间
      duration: 0
      // 音乐总时长
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
      this.audio.addEventListener("loadedmetadata", () => {
        this.duration = this.audio.duration;
      });
      this.audio.addEventListener("timeupdate", () => {
        this.currentTime = this.audio.currentTime;
      });
      this.audio.addEventListener("ended", () => {
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
      this.currentMusicIndex = (this.currentMusicIndex - 1 + this.musicList.length) % this.musicList.length;
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
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }
  }
};
if (!Array) {
  const _component_page_title = common_vendor.resolveComponent("page-title");
  _component_page_title();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: `${$data.statusBarHeight}px`,
    b: common_vendor.p({
      title: "智能体助手",
      Theme: "geryTheme"
    }),
    c: $data.currentMusic.cover,
    d: common_vendor.t($data.currentMusic.name),
    e: common_vendor.t($data.currentMusic.artist),
    f: $data.currentTime,
    g: $data.duration,
    h: common_vendor.o((...args) => $options.onSliderChange && $options.onSliderChange(...args)),
    i: common_vendor.t($options.formatTime($data.currentTime)),
    j: common_vendor.t($options.formatTime($data.duration)),
    k: common_vendor.o((...args) => $options.playPrevious && $options.playPrevious(...args)),
    l: common_vendor.t($data.isPlaying ? "暂停" : "播放"),
    m: common_vendor.o((...args) => $options.togglePlay && $options.togglePlay(...args)),
    n: common_vendor.o((...args) => $options.playNext && $options.playNext(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c9f7182c"]]);
wx.createPage(MiniProgramPage);
