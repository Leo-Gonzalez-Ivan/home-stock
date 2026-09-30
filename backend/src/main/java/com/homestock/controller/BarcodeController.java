package com.homestock.controller;

import com.homestock.dto.ProductDTO;
import com.homestock.service.BarcodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/barcode")
@RequiredArgsConstructor
public class BarcodeController {

    private final BarcodeService barcodeService;

    @GetMapping("/{barcode}")
    public ResponseEntity<?> lookup(@PathVariable String barcode) {
        ProductDTO product = barcodeService.lookupBarcode(barcode);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(product);
    }
}
