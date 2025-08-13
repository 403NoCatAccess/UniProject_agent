package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;
@Data
@TableName("book")
public class Book extends Model<Book> {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    /**
     * 书名
     */
    @TableField("name")
    private String name;

    /**
     * 封面
     */
    @TableField("cover")
    private String cover;

    /**
     * 描述
     */
    @TableField("description")
    private String description;

    private Integer cid;

    /**
     * 宣传图片
     */
    @TableField("index_img")
    private String indexImg;

    /**
     * 简介
     */
    @TableField("brief_introduction")
    private String briefIntroduction;

    /**
     * 作者
     */
    @TableField("author")
    private String author;

    /**
     * 删除标志（0：正常；1：已删除）
     */
    @TableField("state")
    private Integer state;
}

