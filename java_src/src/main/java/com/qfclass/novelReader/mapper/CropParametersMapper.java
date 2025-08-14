package com.qfclass.novelReader.mapper;

import com.qfclass.novelReader.domain.CropParameters;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Mapper
@Repository
public interface CropParametersMapper {
    List<CropParameters> findAll();
}