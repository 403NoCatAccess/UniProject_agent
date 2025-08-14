package com.qfclass.novelReader.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qfclass.novelReader.domain.ChapterContent;
import com.qfclass.novelReader.mapper.ChapterContentMapper;
import com.qfclass.novelReader.service.IChapterContentService;
import com.qfclass.novelReader.vo.ChapterContentVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChapterContentServiceImpl extends ServiceImpl<ChapterContentMapper, ChapterContent> implements IChapterContentService {
    @Autowired
    ChapterContentMapper contentMapper;
    @Override
    public ChapterContentVo getChapterContentByCatalogId(Integer bookId, Integer catalogId
    ) {
        return contentMapper.getChapterContentByCatalogId(bookId,catalogId);
    }
}

