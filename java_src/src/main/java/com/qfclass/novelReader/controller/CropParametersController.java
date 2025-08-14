package com.qfclass.novelReader.controller;

import com.qfclass.novelReader.domain.CropParameters;
import com.qfclass.novelReader.service.CropParametersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/crops")
public class CropParametersController {

    private final CropParametersService cropParametersService;

    @Autowired
    public CropParametersController(CropParametersService cropParametersService) {
        this.cropParametersService = cropParametersService;
    }

    @GetMapping
    public List<CropParameters> getAllCrops() {
        return cropParametersService.getAllCrops();
    }
}