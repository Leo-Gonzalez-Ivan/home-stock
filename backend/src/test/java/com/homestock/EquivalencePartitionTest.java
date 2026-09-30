package com.homestock;

import com.homestock.exception.InsufficientStockException;
import com.homestock.validator.StockValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Equivalence Partition Tests for StockValidator.
 *
 * Partitions for validateQuantity(BigDecimal quantity):
 *   - EP1 (valid):   quantity > 0          → should pass without exception
 *   - EP2 (invalid): quantity == 0         → should throw IllegalArgumentException
 *   - EP3 (invalid): quantity < 0          → should throw IllegalArgumentException
 */
@DisplayName("Equivalence Partition Tests")
class EquivalencePartitionTest {

    private StockValidator validator;

    @BeforeEach
    void setUp() {
        validator = new StockValidator();
    }

    // ─── EP1: Valid partition (quantity > 0) ────────────────────────────────────

    @Test
    @DisplayName("EP1 - Valid: quantity = 5 (typical positive value) → no exception")
    void ep1_validQuantity_typical() {
        assertDoesNotThrow(() -> validator.validateQuantity(new BigDecimal("5")));
    }

    @Test
    @DisplayName("EP1 - Valid: quantity = 1000.50 (large decimal) → no exception")
    void ep1_validQuantity_largDecimal() {
        assertDoesNotThrow(() -> validator.validateQuantity(new BigDecimal("1000.50")));
    }

    @Test
    @DisplayName("EP1 - Valid: quantity = 0.01 (minimum positive) → no exception")
    void ep1_validQuantity_minimum() {
        assertDoesNotThrow(() -> validator.validateQuantity(new BigDecimal("0.01")));
    }

    // ─── EP2: Invalid partition (quantity == 0) ─────────────────────────────────

    @Test
    @DisplayName("EP2 - Invalid: quantity = 0 → throws IllegalArgumentException")
    void ep2_zeroQuantity() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateQuantity(BigDecimal.ZERO));
        assertTrue(ex.getMessage().contains("greater than zero"));
    }

    // ─── EP3: Invalid partition (quantity < 0) ──────────────────────────────────

    @Test
    @DisplayName("EP3 - Invalid: quantity = -3 → throws IllegalArgumentException")
    void ep3_negativeQuantity() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> validator.validateQuantity(new BigDecimal("-3")));
        assertTrue(ex.getMessage().contains("greater than zero"));
    }

    @Test
    @DisplayName("EP3 - Invalid: quantity = -0.01 (smallest negative) → throws IllegalArgumentException")
    void ep3_smallestNegative() {
        assertThrows(IllegalArgumentException.class,
                () -> validator.validateQuantity(new BigDecimal("-0.01")));
    }

    @Test
    @DisplayName("EP3 - Invalid: quantity = null → throws IllegalArgumentException")
    void ep3_nullQuantity() {
        assertThrows(IllegalArgumentException.class,
                () -> validator.validateQuantity(null));
    }
}
