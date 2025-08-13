package com.qfclass.novelReader.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qfclass.novelReader.domain.Lovely;
import com.qfclass.novelReader.mapper.LovelyMapper;
import com.qfclass.novelReader.service.ILovelyService;
import org.springframework.stereotype.Service;

@Service
public class LovelyServiceImpl extends ServiceImpl<LovelyMapper, Lovely> implements ILovelyService {
}
