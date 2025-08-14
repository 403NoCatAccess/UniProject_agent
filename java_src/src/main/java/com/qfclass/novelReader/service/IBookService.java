package com.qfclass.novelReader.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.qfclass.novelReader.domain.Book;
import com.qfclass.novelReader.vo.BookCategoryVo;

import java.util.List;

public interface IBookService extends IService<Book> {
    List<BookCategoryVo> getHomeSelectionList();
}

