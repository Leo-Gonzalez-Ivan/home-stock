package com.homestock.dto;

import com.homestock.model.UnitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductDTO(
        Long id,
        @NotBlank(message = "Name is required") String name,
        String brand,
        Long categoryId,
        String categoryName,
        @NotNull(message = "Unit type is required") UnitType unitType,
        @NotNull @DecimalMin(value = "0.01", message = "Quantity must be at least 0.01") BigDecimal quantity,
        BigDecimal minQuantity
) {}
