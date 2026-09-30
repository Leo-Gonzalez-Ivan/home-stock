package com.homestock.controller;

import com.homestock.dto.ConsumeDTO;
import com.homestock.dto.ProductDTO;
import com.homestock.model.Product;
import com.homestock.model.UnitType;
import com.homestock.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getAll(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search) {
        if (categoryId != null) {
            return ResponseEntity.ok(productService.findByCategory(categoryId));
        }
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(productService.search(search));
        }
        return ResponseEntity.ok(productService.findAll());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStock() {
        return ResponseEntity.ok(productService.findLowStock());
    }

    @GetMapping("/unit-types")
    public ResponseEntity<UnitType[]> getUnitTypes() {
        return ResponseEntity.ok(UnitType.values());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody @Valid ProductDTO dto) {
        Product product = productService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody @Valid ProductDTO dto) {
        return ResponseEntity.ok(productService.update(id, dto));
    }

    @PatchMapping("/{id}/consume")
    public ResponseEntity<Product> consume(@PathVariable Long id, @RequestBody @Valid ConsumeDTO dto) {
        return ResponseEntity.ok(productService.consume(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }
}
