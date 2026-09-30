package com.homestock.service;

import com.homestock.model.StockMovement;
import com.homestock.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockMovementService {
    private final StockMovementRepository stockMovementRepository;

    public List<StockMovement> findRecent() {
        return stockMovementRepository.findTop20ByOrderByCreatedAtDesc();
    }

    public List<StockMovement> findByProduct(Long productId) {
        return stockMovementRepository.findByProduct_IdOrderByCreatedAtDesc(productId);
    }
}
