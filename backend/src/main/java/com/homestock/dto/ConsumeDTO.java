package com.homestock.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ConsumeDTO(
        @NotNull Boolean consumeAll,
        @DecimalMin(value = "0.01", message = "Amount must be at least 0.01") BigDecimal amount
) {}
