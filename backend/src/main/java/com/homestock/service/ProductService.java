package com.homestock.service;

import com.homestock.dto.ConsumeDTO;
import com.homestock.dto.ProductDTO;
import com.homestock.exception.ResourceNotFoundException;
import com.homestock.model.*;
import com.homestock.repository.*;
import com.homestock.validator.StockValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockValidator stockValidator;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public List<Product> findByCategory(Long categoryId) {
        return productRepository.findByCategory_Id(categoryId);
    }

    public List<Product> search(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Product> findLowStock() {
        return productRepository.findLowStockProducts();
    }

    public Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    @Transactional
    public Product create(ProductDTO dto) {
        stockValidator.validateQuantity(dto.quantity());
        stockValidator.validateName(dto.name());

        Product product = new Product();
        product.setName(dto.name().trim());
        product.setBrand(dto.brand());
        product.setUnitType(dto.unitType());
        product.setQuantity(dto.quantity());
        product.setMinQuantity(dto.minQuantity());

        if (dto.categoryId() != null) {
            Category category = categoryRepository.findById(dto.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        Product saved = productRepository.save(product);

        StockMovement movement = new StockMovement();
        movement.setProduct(saved);
        movement.setMovementType(MovementType.IN);
        movement.setQuantity(dto.quantity());
        movement.setReason("Initial stock");
        stockMovementRepository.save(movement);

        return saved;
    }

    @Transactional
    public Product update(Long id, ProductDTO dto) {
        Product product = findById(id);
        stockValidator.validateName(dto.name());

        product.setName(dto.name().trim());
        product.setBrand(dto.brand());
        product.setUnitType(dto.unitType());
        product.setMinQuantity(dto.minQuantity());

        if (dto.categoryId() != null) {
            Category category = categoryRepository.findById(dto.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        return productRepository.save(product);
    }

    @Transactional
    public Product consume(Long id, ConsumeDTO dto) {
        Product product = findById(id);

        BigDecimal toConsume;
        if (Boolean.TRUE.equals(dto.consumeAll())) {
            toConsume = product.getQuantity();
        } else {
            toConsume = dto.amount();
            stockValidator.validateConsumption(product.getQuantity(), toConsume);
        }

        product.setQuantity(product.getQuantity().subtract(toConsume));
        Product saved = productRepository.save(product);

        StockMovement movement = new StockMovement();
        movement.setProduct(saved);
        movement.setMovementType(MovementType.OUT);
        movement.setQuantity(toConsume);
        movement.setReason(Boolean.TRUE.equals(dto.consumeAll()) ? "Full consumption" : "Partial consumption");
        stockMovementRepository.save(movement);

        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Product product = findById(id);
        productRepository.delete(product);
    }
}
