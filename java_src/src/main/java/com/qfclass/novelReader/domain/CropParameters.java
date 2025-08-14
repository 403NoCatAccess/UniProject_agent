package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("crop_parameters")
public class CropParameters {

    @TableId(value = "crop_id", type = IdType.AUTO)
    private Integer cropId;

    @TableField("scientific_name")
    private String scientificName;

    @TableField("common_names")
    private String commonNames;

    @TableField("optimal_temperature")
    private Double optimalTemperature;

    @TableField("temperature_range")
    private String temperatureRange;

    @TableField("optimal_humidity")
    private Double optimalHumidity;

    @TableField("humidity_range")
    private String humidityRange;

    @TableField("growth_stage")
    private String growthStage;

    @TableField("data_source")
    private String dataSource;
}