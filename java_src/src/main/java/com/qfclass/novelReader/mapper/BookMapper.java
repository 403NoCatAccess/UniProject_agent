package com.qfclass.novelReader.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qfclass.novelReader.domain.Book;

import java.util.List;

public interface BookMapper extends BaseMapper<Book> {
    List<Book> getHomeSelectionListByCid(Integer cid);
}

