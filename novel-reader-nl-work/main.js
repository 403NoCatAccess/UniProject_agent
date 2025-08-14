import App from './App'

//引入组件
import myIcon from '@/components/myIcon.vue'
import request from '@/common/request.js'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'



export function createApp() {
  const app = createSSRApp(App)
  
  //全局注册组件
  app.component('my-icon',myIcon)
  app.config.globalProperties.$statusBarHeight = uni.getSystemInfoSync().statusBarHeight
  app.config.globalProperties.$http = request
  return {
    app
  }
}
// #endif



