package com.qfclass.novelReader.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.qfclass.novelReader.domain.ChapterContent;
import com.qfclass.novelReader.vo.ChapterContentVo;

public interface IChapterContentService extends IService<ChapterContent> {
    ChapterContentVo getChapterContentByCatalogId(Integer bookId, Integer catalogId
    );
}

