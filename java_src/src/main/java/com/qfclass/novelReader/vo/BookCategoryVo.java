package com.qfclass.novelReader.vo;

import com.qfclass.novelReader.domain.Book;
import com.qfclass.novelReader.domain.Category;
import lombok.Data;

import java.util.List;

@Data
public class BookCategoryVo {
    Category category;
    List<Book> books;


}

