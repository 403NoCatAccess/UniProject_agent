package com.qfclass.novelReader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qfclass.novelReader.common.JSONResult;
import com.qfclass.novelReader.domain.ChapterCatalog;
import com.qfclass.novelReader.service.IChapterCatalogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ChapterCatalog")
public class ChapterCatalogController {

    @Autowired
    IChapterCatalogService catalogService;

    @GetMapping("/{bookId}")
    public JSONResult getCatalogListByBookId(@PathVariable Integer bookId) {
        LambdaQueryWrapper<ChapterCatalog> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ChapterCatalog::getBookId, bookId);
        List<ChapterCatalog> catalogs = catalogService.list(wrapper);
        return JSONResult.succ(catalogs);
    }
}

