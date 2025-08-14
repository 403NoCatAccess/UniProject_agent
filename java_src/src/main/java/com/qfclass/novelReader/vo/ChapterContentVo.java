package com.qfclass.novelReader.vo;
import lombok.Data;
@Data
public class ChapterContentVo {

    /**
     * 图书标识
     */
    private Integer bookId;
    /**
     * 图书名称
     */
    private String bookName;

    /**
     * 章节id
     */
    private Integer catalogId;

    /**
     * 章节标题
     */
    private String title;

    /**
     * 内容id
     */
    private Integer contentId;
    /**
     * 章节内容
     */
    private String text;
}

