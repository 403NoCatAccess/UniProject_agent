package com.qfclass.novelReader.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qfclass.novelReader.domain.Category;
import com.qfclass.novelReader.mapper.CategoryMapper;
import com.qfclass.novelReader.service.ICategoryService;
import org.springframework.stereotype.Service;



@Service
public class CategoryServiceImpl extends ServiceImpl<CategoryMapper, Category> implements ICategoryService {
}


