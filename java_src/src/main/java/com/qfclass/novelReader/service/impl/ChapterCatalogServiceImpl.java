package com.qfclass.novelReader.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qfclass.novelReader.domain.ChapterCatalog;
import com.qfclass.novelReader.mapper.ChapterCatalogMapper;
import com.qfclass.novelReader.service.IChapterCatalogService;
import org.springframework.stereotype.Service;

@Service
public class ChapterCatalogServiceImpl extends ServiceImpl<ChapterCatalogMapper, ChapterCatalog> implements IChapterCatalogService {
}

