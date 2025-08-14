package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

@Data
@TableName("chapter_content")
public class ChapterContent extends Model<ChapterContent> {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    /**
     * 章节目录标识
     */
    @TableField("catalog_id")
    private String catalogId;

    /**
     * 章节内容
     */
    @TableField("text")
    private String text;

}

