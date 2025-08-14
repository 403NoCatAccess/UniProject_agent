package com.qfclass.novelReader.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("category")
public class Category {
    @TableField("cid")
    private Integer cid;

    /**
     * 图书分类名称
     */
    @TableField("cname")
    private String cname;
}
