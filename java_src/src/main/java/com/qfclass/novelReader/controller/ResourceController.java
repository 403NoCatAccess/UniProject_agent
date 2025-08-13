package com.qfclass.novelReader.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;

@RestController
@RequestMapping("/api/resource")
public class ResourceController {

    // 当前资源版本号
    private static final String CURRENT_VERSION = "1.0.0";

    @GetMapping("/version")
    public String getResourceVersion() {
        return CURRENT_VERSION;
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadResource() {
        // 从服务器文件系统读取ZIP文件
        File file = new File("/www/javaapps/static/static.zip");
        Resource resource = new FileSystemResource(file);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"static.zip\"")
                .contentLength(file.length())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
