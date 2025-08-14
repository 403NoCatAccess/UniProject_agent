package com.qfclass.novelReader.service.impl;

import com.qfclass.novelReader.domain.CropParameters;
import com.qfclass.novelReader.mapper.CropParametersMapper;
import com.qfclass.novelReader.service.CropParametersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CropParametersServiceImpl implements CropParametersService {

    private final CropParametersMapper cropParametersMapper;

    @Autowired
    public CropParametersServiceImpl(CropParametersMapper cropParametersMapper) {
        this.cropParametersMapper = cropParametersMapper;
    }

    @Override
    public List<CropParameters> getAllCrops() {
        return cropParametersMapper.findAll();
    }
}