"use strict";
const common_vendor = require("./vendor.js");
let screenWidth = common_vendor.index.getSystemInfoSync().windowWidth, screenHeight = common_vendor.index.getSystemInfoSync().windowHeight;
const Torpx = (num) => 750 * num / screenWidth, Topx = (num) => num * screenWidth / 750;
const getSystemHeight = (isRpx = true) => {
  let windowHeight = common_vendor.index.getSystemInfoSync().windowHeight;
  console.log("windowHeight---> ", screenHeight, " --- ", windowHeight);
  return isRpx ? Torpx(windowHeight) : windowHeight;
};
const formatTime = (num) => {
  if (!num && num !== 0) {
    return "00:00";
  }
  let divisionNum = Math.floor(num / 60), remainderNum = Math.floor(num % 60), zero = (x) => "0".repeat(2 - String(x).length);
  return `${zero(divisionNum) + divisionNum}:${zero(remainderNum) + remainderNum}`;
};
const getNodesHeightInfo = (optionObj) => {
  let {
    pageID,
    pos,
    success
  } = optionObj;
  let heightArr = [];
  const query = common_vendor.index.createSelectorQuery().in(pageID);
  query.selectAll(`.${pos}`).boundingClientRect((data) => {
    data.forEach((item) => heightArr.push(item.height));
    success(heightArr);
  }).exec();
};
const calSurplusHeight = (optionObj) => {
  let {
    pageID,
    pos,
    isRpx = true,
    isTabBarPage = false,
    success
  } = optionObj;
  getNodesHeightInfo({
    pageID,
    pos,
    success: (NodesHeightArr) => {
      let usedTotalHeight = NodesHeightArr.reduce((pre, item) => pre + item);
      let SurHeight = isTabBarPage ? screenHeight - usedTotalHeight - 50 : screenHeight - usedTotalHeight;
      SurHeight += 50;
      SurHeight = isRpx ? Torpx(SurHeight) : SurHeight;
      let SurHeightEND = Math.floor(SurHeight);
      success(SurHeightEND);
    }
  });
};
const unit = {
  Torpx,
  //px转rpx
  Topx,
  //rpx转px
  getSystemHeight,
  //获取屏幕高度
  formatTime,
  //过滤器方法
  getNodesHeightInfo,
  //获取各节点高度信息
  calSurplusHeight
  //计算剩余高度
};
exports.unit = unit;
