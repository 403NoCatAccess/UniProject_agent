package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

import java.io.Serializable;

@Data
@TableName("p_code")
public class PCode extends Model<PCode> {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    /**
     * 配置信息类型
     */
    @TableField("code_type")
    private String codeType;

    /**
     * 配置信息名称
     */
    @TableField("code_name")
    private String codeName;

    /**
     * 配置信息说明
     */
    @TableField("code_desc")
    private String codeDesc;

/**
 * 配置项1
 */
@TableField("param1")
private String param1;

    @TableField("param2")
    private String param2;

    /**
     * 配置项3
     */
    @TableField("param3")
    private String param3;

    /**
     * 配置项4
     */
    @TableField("param4")
    private String param4;

    /**
     * 配置项5
     */
    @TableField("param5")
    private String param5;

    @TableField("param6")
    private String param6;

    @TableField("param7")
    private String param7;

    /**
     * 配置项8
     */
    @TableField("param8")
    private String param8;

    /**
     * 配置项9
     */
    @TableField("param9")
    private String param9;

    /**
     * 排序规则
     */
    @TableField("sn")
    private Integer sn;

    /**
     * 配置项10
     */
    @TableField("param10")
    private String param10;



}

