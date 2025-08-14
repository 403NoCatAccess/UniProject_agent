#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "driver/ledc.h"
#include <string.h>
#include "ble_app.h" // 包含蓝牙应用头文件
#include <math.h>    // 添加math.h以使用fabs函数
#include "dht11.h"
#include "esp_log.h"
#include "nvs_flash.h"

#define FULL_EV_BIT BIT0
#define EMPTY_EV_BIT BIT1
#define DHT11_GPIO  25      // DHT11引脚定义
const static char *TAG = "DHT11_Demo";

static EventGroupHandle_t ledc_event_handle;

// 声明全局命令缓冲区（在 ble_app.c 中定义）
extern uint8_t command_buffer[32];
extern size_t command_length;

// 温湿度调节相关变量
static float target_temp = 25.0;         // 目标温度
static float target_humidity = 60.0;     // 目标湿度
static float real_temp = 25.0;           // 传感器真实温度
static float real_humidity = 60.0;       // 传感器真实湿度
static float temp_adjustment = 0.0;      // 温度调节量
static float humidity_adjustment = 0.0;  // 湿度调节量
static bool adjusting = false;            // 是否正在调节

// 计算当前模拟温湿度
static float get_simulated_temp() { return real_temp + temp_adjustment; }
static float get_simulated_humidity() { return real_humidity + humidity_adjustment; }

// 解析和执行命令的函数
void parse_and_execute_command(uint8_t* cmd, size_t len) {
    // 将命令转换为字符串
    char command_str[32] = {0};
    memcpy(command_str, cmd, len > 31 ? 31 : len);
    
    ESP_LOGI(TAG, "收到命令: %s", command_str);
    
    // 解析命令
    if (strncmp(command_str, "set_target:", 11) == 0) {
        float temp, humidity;
        if (sscanf(command_str + 11, "%f,%f", &temp, &humidity) == 2) {
            // 设置目标环境
            target_temp = temp;
            target_humidity = humidity;
            adjusting = true;
            ESP_LOGI(TAG, "设置目标温度: %.1f°C, 目标湿度: %.1f%%", target_temp, target_humidity);
            ESP_LOGI(TAG, "启动温湿度调节");
        } else {
            ESP_LOGE(TAG, "无效的环境设置命令: %s", command_str);
        }
    } 
    else if (strcmp(command_str, "start") == 0) {
        // 启动调节
        adjusting = true;
        ESP_LOGI(TAG, "启动温湿度调节");
    }
    else if (strcmp(command_str, "stop") == 0) {
        // 停止调节
        adjusting = false;
        ESP_LOGI(TAG, "停止温湿度调节");
    }
    else if (strcmp(command_str, "reset_adjust") == 0) {
        // 重置调节量
        temp_adjustment = 0.0;
        humidity_adjustment = 0.0;
        ESP_LOGI(TAG, "调节量已重置");
    }
    else if (strcmp(command_str, "led_on") == 0) {
        // 打开LED
        gpio_set_level(GPIO_NUM_27, 1);
        ESP_LOGI(TAG, "LED打开");
    }
    else if (strcmp(command_str, "led_off") == 0) {
        // 关闭LED
        gpio_set_level(GPIO_NUM_27, 0);
        ESP_LOGI(TAG, "LED关闭");
    }
    else {
        ESP_LOGE(TAG, "未知命令: %s", command_str);
    }
}

// 命令处理任务
void command_process_task(void* param) {
    ESP_LOGI(TAG, "命令处理任务启动");
    
    while (1) {
        // 检查是否有新命令
        if (command_length > 0) {
            ESP_LOGI(TAG, "处理新命令, 长度: %d", command_length);
            ESP_LOGI(TAG, "命令内容: %.*s", command_length, command_buffer);
            
            // 解析并执行命令
            parse_and_execute_command(command_buffer, command_length);
            
            // 重置命令长度
            command_length = 0;
            ESP_LOGI(TAG, "命令处理完成");
        } else {
            //ESP_LOGI(TAG, "没有新命令");
        }
        
        // 短暂延时
        vTaskDelay(100 / portTICK_PERIOD_MS);
    }
}

// 温湿度调节任务
void environment_adjust_task(void* param) {
    ESP_LOGI(TAG, "温湿度调节任务启动");
    
    while (1) {
        // 计算当前模拟值
        float simulated_temp = get_simulated_temp();
        float simulated_humidity = get_simulated_humidity();
        
        ESP_LOGI(TAG, "调节状态: %s", adjusting ? "正在调节" : "未调节");
        ESP_LOGI(TAG, "真实温度: %.1f°C, 真实湿度: %.1f%%", real_temp, real_humidity);
        ESP_LOGI(TAG, "温度调节量: %.1f°C, 湿度调节量: %.1f%%", temp_adjustment, humidity_adjustment);
        ESP_LOGI(TAG, "目标温度: %.1f°C, 当前模拟温度: %.1f°C", target_temp, simulated_temp);
        ESP_LOGI(TAG, "目标湿度: %.1f%%, 当前模拟湿度: %.1f%%", target_humidity, simulated_humidity);
        
        if (adjusting) {
            // 检查是否达到目标范围（温度±1°C，湿度±1%）
            float temp_diff = target_temp - simulated_temp;
            float humidity_diff = target_humidity - simulated_humidity;
            
            if (fabs(temp_diff) <= 1.0 && fabs(humidity_diff) <= 1.0) {
                // 达到目标范围，停止调节
                adjusting = false;
                ESP_LOGI(TAG, "温湿度已达到目标范围，停止调节");
            } else {
                // 温度调节
                if (fabs(temp_diff) > 0.01) { // 避免微小浮点数误差
                    float temp_step = temp_diff > 0 ? 0.5 : -0.5; // 温度步长0.5°C
                    temp_adjustment += temp_step;
                    
                    // 计算新的模拟值并限制在合理范围内
                    simulated_temp = get_simulated_temp();
                    if (simulated_temp < 0) {
                        temp_adjustment = 0 - real_temp; // 确保模拟温度不低于0
                    }
                    if (simulated_temp > 50) {
                        temp_adjustment = 50 - real_temp; // 确保模拟温度不高于50
                    }
                    
                    ESP_LOGI(TAG, "温度调节量调整: %.1f°C -> %.1f°C", 
                             temp_adjustment - temp_step, temp_adjustment);
                }
                
                // 湿度调节
                if (fabs(humidity_diff) > 0.01) {
                    float humidity_step = humidity_diff > 0 ? 1.0 : -1.0; // 湿度步长1%
                    humidity_adjustment += humidity_step;
                    
                    // 计算新的模拟值并限制在合理范围内
                    simulated_humidity = get_simulated_humidity();
                    if (simulated_humidity < 0) {
                        humidity_adjustment = 0 - real_humidity; // 确保模拟湿度不低于0
                    }
                    if (simulated_humidity > 100) {
                        humidity_adjustment = 100 - real_humidity; // 确保模拟湿度不高于100
                    }
                    
                    ESP_LOGI(TAG, "湿度调节量调整: %.1f%% -> %.1f%%", 
                             humidity_adjustment - humidity_step, humidity_adjustment);
                }
            }
        }
        
        // 计算当前模拟值
        simulated_temp = get_simulated_temp();
        simulated_humidity = get_simulated_humidity();
        
        // 发送模拟温湿度给上位机
        uint16_t temp_value = (uint16_t)(simulated_temp * 10); // 转换为整数（0.1°C精度）
        uint16_t humidity_value = (uint16_t)simulated_humidity; // 整数百分比
        ble_set_temp_value(temp_value);
        ble_set_humidity_value(humidity_value);
        
        ESP_LOGI(TAG, "发送模拟温度: %.1f°C (原始值: %d)", simulated_temp, temp_value);
        ESP_LOGI(TAG, "发送模拟湿度: %.1f%% (原始值: %d)", simulated_humidity, humidity_value);
        
        // 每秒更新一次
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

void led_run_task(void* param)
{
    ESP_LOGI(TAG, "LED控制任务启动");
    
    EventBits_t ev;
    while (1)
    {
        ev = xEventGroupWaitBits(ledc_event_handle, FULL_EV_BIT|EMPTY_EV_BIT, 
                                pdTRUE, pdFALSE, portMAX_DELAY);
        if(ev & FULL_EV_BIT)
        {
            ESP_LOGI(TAG, "收到FULL_EV_BIT事件");
            ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0, 2000);
            ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_NO_WAIT);
        }
        if(ev & EMPTY_EV_BIT)
        {
            ESP_LOGI(TAG, "收到EMPTY_EV_BIT事件");
            ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 8191, 2000);
            ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_NO_WAIT);
        }
    }
}

void dht11_task(void* param)
{
    ESP_LOGI(TAG, "DHT11任务启动");
    
    int temp = 0, hum = 0;
    
    while (1) {
        if (DHT11_StartGet(&temp, &hum)) {
            // 更新真实温湿度值
            real_temp = temp / 10.0f + (temp % 10) / 10.0f;
            real_humidity = hum;
            
            ESP_LOGI(TAG, "真实温度: %i.%i°C, 真实湿度: %i%%", temp / 10, temp % 10, hum);
            ESP_LOGI(TAG, "当前模拟温度: %.1f°C, 当前模拟湿度: %.1f%%", 
                    get_simulated_temp(), get_simulated_humidity());
        } else {
            ESP_LOGE(TAG, "DHT11读取失败");
        }
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

bool IRAM_ATTR ledc_finish_cb(const ledc_cb_param_t *param, void *user_arg)
{
    BaseType_t taskWoken = pdFALSE;
    if(param->duty)
    {
        ESP_LOGI(TAG, "LED渐变完成, 亮度为0");
        xEventGroupSetBitsFromISR(ledc_event_handle, FULL_EV_BIT, &taskWoken);
    }
    else {
        ESP_LOGI(TAG, "LED渐变完成, 亮度为最大");
        xEventGroupSetBitsFromISR(ledc_event_handle, EMPTY_EV_BIT, &taskWoken);
    }
    return taskWoken;
}

void app_main(void)
{
    ESP_LOGI(TAG, "应用程序启动");
    
    // LED配置初始化
    gpio_config_t led_cfg = {
        .pin_bit_mask = (1<<GPIO_NUM_27),
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&led_cfg);
    ESP_LOGI(TAG, "GPIO配置完成");
    
    ledc_timer_config_t ledc_timer = {
        .speed_mode = LEDC_LOW_SPEED_MODE,
        .timer_num = LEDC_TIMER_0,
        .clk_cfg = LEDC_AUTO_CLK,
        .freq_hz = 5000,
        .duty_resolution = LEDC_TIMER_13_BIT,
    };
    ledc_timer_config(&ledc_timer);
    ESP_LOGI(TAG, "LEDC定时器配置完成");
    
    ledc_channel_config_t ledc_channel = {
        .speed_mode = LEDC_LOW_SPEED_MODE,
        .channel = LEDC_CHANNEL_0,
        .timer_sel = LEDC_TIMER_0,
        .gpio_num = GPIO_NUM_27,
        .duty = 0,
        .intr_type = LEDC_INTR_DISABLE,
    };
    ledc_channel_config(&ledc_channel);
    ESP_LOGI(TAG, "LEDC通道配置完成");
    
    ledc_fade_func_install(0);
    ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0, 2000);
    ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_NO_WAIT);
    ESP_LOGI(TAG, "LED渐变功能安装完成");
    
    ledc_event_handle = xEventGroupCreate();
    ESP_LOGI(TAG, "事件组创建完成");
    
    ledc_cbs_t cbs = {
        .fade_cb = ledc_finish_cb,
    };
    ledc_cb_register(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, &cbs, NULL);
    ESP_LOGI(TAG, "LEDC回调注册完成");
    
    // 创建LED控制任务
    xTaskCreatePinnedToCore(led_run_task, "led", 2048, NULL, 3, NULL, 1);
    ESP_LOGI(TAG, "LED控制任务创建完成");

    // DHT11初始化
    ESP_ERROR_CHECK(nvs_flash_init());
    vTaskDelay(100 / portTICK_PERIOD_MS);
    ESP_LOGI(TAG, "NVS闪存初始化完成");
    
    ESP_LOGI(TAG, "[APP] APP Is Start!~\r\n");
    ESP_LOGI(TAG, "[APP] IDF Version is %d.%d.%d", 
            ESP_IDF_VERSION_MAJOR, ESP_IDF_VERSION_MINOR, ESP_IDF_VERSION_PATCH);
    ESP_LOGI(TAG, "[APP] Free memory: %lu bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "[APP] IDF version: %s", esp_get_idf_version());
    
    DHT11_Init(DHT11_GPIO);
    ESP_LOGI(TAG, "DHT11初始化完成");
    
    // 创建DHT11读取任务
    xTaskCreatePinnedToCore(dht11_task, "dht11", 2048, NULL, 2, NULL, 1);
    ESP_LOGI(TAG, "DHT11读取任务创建完成");
    
    // 创建命令处理任务
    xTaskCreatePinnedToCore(command_process_task, "cmd_task", 2048, NULL, 3, NULL, 1);
    ESP_LOGI(TAG, "命令处理任务创建完成");
    
    // 创建温湿度调节任务
    xTaskCreatePinnedToCore(environment_adjust_task, "env_adj", 2048, NULL, 2, NULL, 1);
    ESP_LOGI(TAG, "温湿度调节任务创建完成");
    
    // 主函数不再需要循环
    // FreeRTOS调度器会自动管理任务
    //初始化蓝牙
    ble_cfg_net_init();
    ESP_LOGI(TAG, "蓝牙初始化完成");
}