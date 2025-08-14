package com.qfclass.novelReader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qfclass.novelReader.domain.ChapterContent;
import com.qfclass.novelReader.vo.ChapterContentVo;

public interface ChapterContentMapper extends BaseMapper<ChapterContent> {
    ChapterContentVo getChapterContentByCatalogId(Integer bookId, Integer catalogId
    );
}

