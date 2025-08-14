package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import lombok.Data;

@Data
@TableName("lovely")
public class Lovely extends Model<Lovely> {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Integer id;

    /**
     * 图书名称
     */
    @TableField("name")
    private String name;

    /**
     * 图书封面
     */
    @TableField("cover")
    private String cover;

/**
 * 所属用户
 */
@TableField("user_id")
private Integer userId;

    /**
     * 图书标识
     */
    @TableField("book_id")
    private Integer bookId;

    /**
     * 数据状态（0：正常；1：已删除）
     */
    @TableField("state")
    private Integer state;
}
