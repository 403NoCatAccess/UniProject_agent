package com.qfclass.novelReader.controller;

import com.qfclass.novelReader.common.JSONResult;
import com.qfclass.novelReader.service.IChapterContentService;
import com.qfclass.novelReader.vo.ChapterContentVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ChapterContent")
public class ChapterContentController {
    @Autowired
    IChapterContentService chapterContentService;

    @GetMapping("/content/{bookId}/{catalogId}")
    public JSONResult getChapterContent(@PathVariable Integer bookId, @PathVariable Integer catalogId
    ){
        ChapterContentVo contentVo = chapterContentService.getChapterContentByCatalogId(bookId,catalogId);
        return JSONResult.succ(contentVo);
    }
}

