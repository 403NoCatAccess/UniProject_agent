package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

@Data
@TableName("chapter_catalog")
public class ChapterCatalog extends Model<ChapterCatalog> {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    /**
     * 目录标题
     */
    @TableField("title")
    private String title;

    /**
     * 图书标识
     */
    @TableField("book_id")
    private Integer bookId;

    /**
     * 章节序号
     */
    @TableField("sort")
    private Integer sort;

    /**
     * 删除标识：0正常；1删除
     */
    @TableField("state")
    private Integer state;
}

