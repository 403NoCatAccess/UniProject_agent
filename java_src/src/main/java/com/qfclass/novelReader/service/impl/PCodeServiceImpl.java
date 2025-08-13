package com.qfclass.novelReader.service.impl;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qfclass.novelReader.domain.PCode;
import com.qfclass.novelReader.mapper.PCodeMapper;
import com.qfclass.novelReader.service.IPCodeService;
import org.springframework.stereotype.Service;

@Service
public class PCodeServiceImpl extends ServiceImpl<PCodeMapper, PCode> implements IPCodeService {
}
