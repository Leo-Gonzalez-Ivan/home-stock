package com.homestock.repository;

import com.homestock.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findTop20ByOrderByCreatedAtDesc();
    List<StockMovement> findByProduct_IdOrderByCreatedAtDesc(Long productId);
}
