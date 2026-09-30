package com.homestock.validator;

import com.homestock.exception.InsufficientStockException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class StockValidator {

    /**
     * Validates that the quantity is strictly positive.
     * Used in equivalence partitioning and boundary value tests.
     * @param quantity the quantity to validate
     * @throws IllegalArgumentException if quantity is null, zero or negative
     */
    public void validateQuantity(BigDecimal quantity) {
        if (quantity == null) {
            throw new IllegalArgumentException("Quantity must not be null");
        }
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero. Received: " + quantity);
        }
    }

    /**
     * Validates that consuming 'toConsume' units from a stock of 'currentStock' is possible.
     * Used in black-box tests.
     * @param currentStock current available stock
     * @param toConsume    amount to consume
     * @throws InsufficientStockException if toConsume exceeds currentStock
     * @throws IllegalArgumentException   if toConsume is zero or negative
     */
    public void validateConsumption(BigDecimal currentStock, BigDecimal toConsume) {
        validateQuantity(toConsume);
        if (toConsume.compareTo(currentStock) > 0) {
            throw new InsufficientStockException(
                "Cannot consume " + toConsume + " units. Current stock: " + currentStock);
        }
    }

    /**
     * Validates a product name.
     * @throws IllegalArgumentException if name is null or blank
     */
    public void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Product name must not be empty");
        }
    }
}
