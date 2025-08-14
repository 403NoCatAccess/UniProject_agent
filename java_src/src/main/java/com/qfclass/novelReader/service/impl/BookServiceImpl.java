package com.qfclass.novelReader.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qfclass.novelReader.domain.Book;
import com.qfclass.novelReader.domain.Category;
import com.qfclass.novelReader.mapper.BookMapper;
import com.qfclass.novelReader.mapper.CategoryMapper;
import com.qfclass.novelReader.service.IBookService;
import com.qfclass.novelReader.vo.BookCategoryVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class BookServiceImpl extends ServiceImpl<BookMapper, Book> implements IBookService {
    @Autowired
    CategoryMapper categoryMapper;
    @Autowired
    BookMapper bookMapper;

    @Override
    public List<BookCategoryVo> getHomeSelectionList() {
        List<BookCategoryVo> bookCategoryVos = new ArrayList<>();
        List<Category> categories = categoryMapper.selectList(null);
        for (Category cate : categories) {
            List<Book> books = bookMapper.getHomeSelectionListByCid(cate.getCid());
            BookCategoryVo categoryVo = new BookCategoryVo();
            categoryVo.setCategory(cate);
            categoryVo.setBooks(books);
            bookCategoryVos.add(categoryVo);
        }
        return bookCategoryVos;
    }
}

