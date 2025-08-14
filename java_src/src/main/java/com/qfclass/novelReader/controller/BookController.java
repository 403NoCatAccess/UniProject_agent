package com.qfclass.novelReader.controller;

import com.qfclass.novelReader.common.JSONResult;
import com.qfclass.novelReader.domain.Book;
import com.qfclass.novelReader.service.IBookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/book")
public class BookController {
    @Autowired
    public IBookService bookService;
    @GetMapping("/{bookId}")
    public JSONResult getBookById(@PathVariable Integer bookId) {
        Book book = bookService.getById(bookId);
        return JSONResult.succ(book);
    }
}

