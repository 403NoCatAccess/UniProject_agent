#include <stdio.h>
#include"freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"
#include "driver/ledc.h"

#include <string.h>
#include <nvs_flash.h>
#include <driver/rmt_rx.h>
#include <driver/rmt_tx.h>
#include <soc/rmt_reg.h>
#include <esp_log.h>
#include <freertos/queue.h>
#include "esp32/rom/ets_sys.h"
#include "dht11.h"
#include "ble_app.h"

#define FULL_EV_BIT BIT0
#define EMPTY_EV_BIT BIT1
#define DHT11_GPIO	25		// DHT11引脚定义
const static char *TAG = "DHT11_Demo";
// 温度 湿度变量
int temp = 0, hum = 0;

static EventGroupHandle_t ledc_event_handle;

void led_run_task(void* param)
{
    EventBits_t ev;
    while (1)
    {
        ev = xEventGroupWaitBits(ledc_event_handle, FULL_EV_BIT|EMPTY_EV_BIT, 
                                pdTRUE, pdFALSE, portMAX_DELAY);
        if(ev & FULL_EV_BIT)
        {
            ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0, 2000);
            ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_NO_WAIT);
        }
        if(ev & EMPTY_EV_BIT)
        {
            ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 8191, 2000);
            ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_NO_WAIT);
        }
    }
}

void dht11_task(void* param)
{
    while (1) {
        if (DHT11_StartGet(&temp, &hum)) {
            ESP_LOGI(TAG, "temp->%i.%i C     hum->%i%%", temp / 10, temp % 10, hum);
            ble_set_temp_value(temp&0xffff);
            ble_set_humidity_value(hum&0xffff);
        }
        vTaskDelay(1000 / portTICK_PERIOD_MS);
    }
}

bool IRAM_ATTR ledc_finish_cb(const ledc_cb_param_t *param, void *user_arg)
{
    BaseType_t taskWoken = pdFALSE;
    if(param->duty)
    {
        xEventGroupSetBitsFromISR(ledc_event_handle, FULL_EV_BIT, &taskWoken);
    }
    else {
        xEventGroupSetBitsFromISR(ledc_event_handle, EMPTY_EV_BIT, &taskWoken);
    }
    return taskWoken;
}

void app_main(void)
{
    // LED配置初始化
    gpio_config_t led_cfg = {
        .pin_bit_mask = (1<<GPIO_NUM_27),
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .intr_type = GPIO_INTR_DISABLE,
    };
    gpio_config(&led_cfg);
    
    ledc_timer_config_t ledc_timer = {
        .speed_mode = LEDC_LOW_SPEED_MODE,
        .timer_num = LEDC_TIMER_0,
        .clk_cfg = LEDC_AUTO_CLK,
        .freq_hz = 5000,
        .duty_resolution = LEDC_TIMER_13_BIT,
    };
    ledc_timer_config(&ledc_timer);
    
    ledc_channel_config_t ledc_channel = {
        .speed_mode = LEDC_LOW_SPEED_MODE,
        .channel = LEDC_CHANNEL_0,
        .timer_sel = LEDC_TIMER_0,
        .gpio_num = GPIO_NUM_27,
        .duty = 0,
        .intr_type = LEDC_INTR_DISABLE,
    };
    ledc_channel_config(&ledc_channel);
    
    ledc_fade_func_install(0);
    ledc_set_fade_with_time(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, 0, 2000);
    ledc_fade_start(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, LEDC_FADE_NO_WAIT);
    
    ledc_event_handle = xEventGroupCreate();
    
    ledc_cbs_t cbs = {
        .fade_cb = ledc_finish_cb,
    };
    ledc_cb_register(LEDC_LOW_SPEED_MODE, LEDC_CHANNEL_0, &cbs, NULL);
    
    // 创建LED控制任务
    xTaskCreatePinnedToCore(led_run_task, "led", 2048, NULL, 3, NULL, 1);

    // DHT11初始化
    ESP_ERROR_CHECK(nvs_flash_init());
    vTaskDelay(100 / portTICK_PERIOD_MS);
    
    ESP_LOGI(TAG, "[APP] APP Is Start!~\r\n");
    ESP_LOGI(TAG, "[APP] IDF Version is %d.%d.%d", 
            ESP_IDF_VERSION_MAJOR, ESP_IDF_VERSION_MINOR, ESP_IDF_VERSION_PATCH);
    ESP_LOGI(TAG, "[APP] Free memory: %lu bytes", esp_get_free_heap_size());
    ESP_LOGI(TAG, "[APP] IDF version: %s", esp_get_idf_version());
    
    DHT11_Init(DHT11_GPIO);
    
    // 创建DHT11读取任务
    xTaskCreatePinnedToCore(dht11_task, "dht11", 2048, NULL, 2, NULL, 1);
    
    // 主函数不再需要循环
    // FreeRTOS调度器会自动管理任务
    //初始化蓝牙
    ble_cfg_net_init();
}