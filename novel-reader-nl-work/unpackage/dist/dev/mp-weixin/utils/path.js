"use strict";
const common_vendor = require("../common/vendor.js");
function getFileBasePath() {
  let base = common_vendor.wx$1.env.USER_DATA_PATH || "";
  if (base.slice(0, 11) === "http://usr") {
    return "wxfile://usr/";
  }
  if (base[base.length - 1] !== "/") {
    base = base + "/";
  }
  return base;
}
function convertStaticPath(originalPath) {
  if (!originalPath)
    return "";
  if (originalPath.slice(0, 4) === "http") {
    return originalPath;
  }
  if (originalPath.slice(0, 8) === "/static/") {
    const app = getApp();
    let basePath = app.globalData && app.globalData.staticBasePath || "";
    if (!basePath) {
      basePath = getFileBasePath() + "static";
    }
    const relativePath = originalPath.substring(8);
    const fullPath = basePath + "/" + relativePath;
    console.log("[路径转换] 输入:", originalPath, "输出:", fullPath);
    return fullPath;
  }
  return originalPath;
}
exports.convertStaticPath = convertStaticPath;
