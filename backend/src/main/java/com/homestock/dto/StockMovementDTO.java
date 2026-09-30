package com.homestock.dto;

import com.homestock.model.MovementType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StockMovementDTO(
        Long id,
        Long productId,
        String productName,
        MovementType movementType,
        BigDecimal quantity,
        String reason,
        LocalDateTime createdAt
) {}
