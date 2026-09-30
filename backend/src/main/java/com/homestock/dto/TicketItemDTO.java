package com.homestock.dto;

import com.homestock.model.UnitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TicketItemDTO(
        @NotBlank(message = "Product name is required") String productName,
        String brand,
        Long categoryId,
        @NotNull(message = "Unit type is required") UnitType unitType,
        @NotNull @DecimalMin(value = "0.01") BigDecimal quantity
) {}
