package com.homestock.repository;

import com.homestock.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory_Id(Long categoryId);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findByBrandIgnoreCase(String brand);

    @Query("SELECT p FROM Product p WHERE p.minQuantity IS NOT NULL AND p.quantity <= p.minQuantity")
    List<Product> findLowStockProducts();
}
