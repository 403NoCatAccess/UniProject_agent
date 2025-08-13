package com.qfclass.novelReader.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.qfclass.novelReader.common.JSONResult;
import com.qfclass.novelReader.domain.Lovely;
import com.qfclass.novelReader.domain.PCode;
import com.qfclass.novelReader.service.ILovelyService;
import com.qfclass.novelReader.service.IPCodeService;
import com.qfclass.novelReader.service.impl.BookServiceImpl;
import com.qfclass.novelReader.vo.BookCategoryVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/index")
public class IndexController {
    @Autowired
    public IPCodeService pCodeService;
    @Autowired
    private ILovelyService lovelyService;
    @Autowired
    private BookServiceImpl bookService;


    @RequestMapping("/loadData")
    public JSONResult loadIndexData() {
        //加载轮播图
        LambdaQueryWrapper<PCode> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PCode::getCodeType, "1");
        List<PCode> swiperImages = pCodeService.list(wrapper);
        wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PCode::getCodeType, "2");
        wrapper.orderByAsc(PCode::getSn);
        List<PCode> functionSortArr = pCodeService.list(wrapper);

        //加载猜你喜欢的图书
        List<Lovely> lovelies = lovelyService.list();
        //首页精选列表查询
        List<BookCategoryVo> categoryVos = bookService.getHomeSelectionList();

        Map<String, Object> resData = new HashMap<>();
        resData.put("swiperImages", swiperImages);
        resData.put("functionSortArr", functionSortArr);
        resData.put("Rebooks", lovelies);
        resData.put("bookResources", categoryVos);
        JSONResult result = JSONResult.succ(resData);
        return result;
    }


}



// 新增的BookController类

