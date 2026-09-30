package com.homestock.controller;

import com.homestock.model.StockMovement;
import com.homestock.service.StockMovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movements")
@RequiredArgsConstructor
public class StockMovementController {
    private final StockMovementService stockMovementService;

    @GetMapping
    public ResponseEntity<List<StockMovement>> getRecent() {
        return ResponseEntity.ok(stockMovementService.findRecent());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<StockMovement>> getByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(stockMovementService.findByProduct(productId));
    }
}
