"use strict";
const common_vendor = require("./vendor.js");
const apiKey = "sk-7d7825c2c1174a45a972de19ff578c2b";
const apiUrl = "https://api.deepseek.com/v1/chat/completions";
function callDeepSeekApi(userInput, cropDatabase) {
  return new Promise((resolve, reject) => {
    const systemPrompt = `
你是一个农业智能决策系统，负责将用户的自然语言请求转化为设备控制指令。请严格按照以下JSON格式返回响应：
{
  "cropName": "提取的作物名称",
  "response": "自然语言回复",
  "commands": [
    {"command": "命令名称", "params": "参数"}
  ]
}

## 可用命令：
1. 设置目标环境：{"command": "set_target", "params": "温度,湿度"}
2. 启动调节：{"command": "start_adjustment"}
3. 停止调节：{"command": "stop_adjustment"}

## 当前可用作物数据库：
${JSON.stringify(cropDatabase, null, 2)}

## 决策逻辑：
1. 当用户描述作物时，匹配数据库中最接近的作物
2. 提取该作物的适宜温湿度（suitable_temp, suitable_humidity）
3. 生成设置目标环境命令
4. 根据环境差异自动添加启动调节命令
5. 用户也有可能只是查询数据库中有什么作物，或者问你一些问题，此时返回不需要命令和作物名称。你要自己判断用户是否需要种植作物。

## 示例：
用户输入："我想种植番茄"
返回：
{
  "cropName": "番茄",
  "response": "已为您设置番茄培育环境：温度25°C，湿度60%。正在启动环境调节...",
  "commands": [
    {"command": "set_target", "params": "25,60"},
    {"command": "start_adjustment"}
  ]
}
`;
    common_vendor.index.request({
      url: apiUrl,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      data: {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 500,
        stream: false
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const responseText = res.data.choices[0].message.content;
            console.log("DeepSeek原始响应:", responseText);
            try {
              const jsonResponse = JSON.parse(responseText);
              resolve(jsonResponse);
            } catch (e) {
              const jsonStart = responseText.indexOf("{");
              const jsonEnd = responseText.lastIndexOf("}");
              if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
                const jsonResponse = JSON.parse(jsonString);
                resolve(jsonResponse);
              } else {
                resolve({
                  response: responseText,
                  commands: []
                });
              }
            }
          } catch (e) {
            console.error("解析响应失败:", e);
            reject(e);
          }
        } else {
          reject(new Error(`API返回错误状态码: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}
exports.callDeepSeekApi = callDeepSeekApi;
