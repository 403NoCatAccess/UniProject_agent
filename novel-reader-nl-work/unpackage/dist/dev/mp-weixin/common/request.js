"use strict";
const common_vendor = require("./vendor.js");
const request = {
  // 全局配置
  common: {
    //baseUrl: "http://localhost:8080",https://api.teastick.cn
    //baseUrl: "http://124.222.92.99:8085",
    baseUrl: "https://api.teastick.cn",
    header: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    data: {},
    method: "GET",
    dataType: "json"
  },
  // 请求 返回promise
  request(options = {}) {
    let common = this.common;
    options.url = common.baseUrl + options.url;
    options.header = options.header || common.header;
    options.data = options.data || common.data;
    options.method = options.method || common.method;
    options.dataType = options.dataType || common.dataType;
    return new Promise((res, rej) => {
      common_vendor.index.request({
        ...options,
        success(result) {
          let {
            statusCode,
            data
          } = result;
          if (options.native)
            return res(result);
          if (statusCode !== 200) {
            if (options.toast !== false) {
              common_vendor.index.showToast({
                title: data.msg || "服务端失败",
                icon: "none"
              });
            }
            return rej(data);
          }
          res(data);
        },
        fail({
          errMsg
        }) {
          common_vendor.index.showToast({
            title: errMsg || "请求失败",
            icon: "none"
          });
          return rej();
        }
      });
    });
  },
  // get请求
  get(url, data = {}, options = {}) {
    options.url = url;
    options.data = data;
    options.method = "GET";
    return this.request(options);
  },
  // post请求
  post(url, data = {}, options = {}) {
    options.url = url;
    options.data = data;
    options.method = "POST";
    return this.request(options);
  },
  // delete请求
  del(url, data = {}, options = {}) {
    options.url = url;
    options.data = data;
    options.method = "DELETE";
    return this.request(options);
  }
};
exports.request = request;
