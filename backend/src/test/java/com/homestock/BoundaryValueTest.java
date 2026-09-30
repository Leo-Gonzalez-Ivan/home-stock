package com.homestock;

import com.homestock.exception.InsufficientStockException;
import com.homestock.validator.StockValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Boundary Value Tests for StockValidator.validateQuantity(BigDecimal).
 *
 * Valid range: quantity > 0 (i.e. quantity >= 0.01 in 2-decimal precision)
 *
 * Boundary points (3 values around the boundary at 0):
 *   - BV1 (below boundary):  quantity = 0.00  → INVALID (boundary excluded)
 *   - BV2 (on boundary):     quantity = 0.01  → VALID   (lowest valid value)
 *   - BV3 (above boundary):  quantity = 99999.99 → VALID (maximum reasonable value)
 *
 * Additional 3-value boundary set for validateConsumption:
 *   - BV4: toConsume = currentStock - 0.01  → VALID
 *   - BV5: toConsume = currentStock         → VALID (exact boundary)
 *   - BV6: toConsume = currentStock + 0.01  → INVALID
 */
@DisplayName("Boundary Value Tests")
class BoundaryValueTest {

    private StockValidator validator;

    @BeforeEach
    void setUp() {
        validator = new StockValidator();
    }

    // ─── validateQuantity boundary ──────────────────────────────────────────────

    @Test
    @DisplayName("BV1 - Below boundary: quantity = 0.00 → throws IllegalArgumentException")
    void bv1_belowBoundary_zero() {
        assertThrows(IllegalArgumentException.class,
                () -> validator.validateQuantity(new BigDecimal("0.00")));
    }

    @Test
    @DisplayName("BV2 - On boundary: quantity = 0.01 → valid, no exception")
    void bv2_onBoundary_minValid() {
        assertDoesNotThrow(() -> validator.validateQuantity(new BigDecimal("0.01")));
    }

    @Test
    @DisplayName("BV3 - Above boundary: quantity = 99999.99 → valid, no exception")
    void bv3_aboveBoundary_maxReasonable() {
        assertDoesNotThrow(() -> validator.validateQuantity(new BigDecimal("99999.99")));
    }

    // ─── validateConsumption boundary ──────────────────────────────────────────

    @Test
    @DisplayName("BV4 - Just below max: consume currentStock - 0.01 → valid")
    void bv4_consumeJustBelowMax() {
        BigDecimal stock = new BigDecimal("10.00");
        BigDecimal consume = new BigDecimal("9.99");  // stock - 0.01
        assertDoesNotThrow(() -> validator.validateConsumption(stock, consume));
    }

    @Test
    @DisplayName("BV5 - Exact boundary: consume = currentStock → valid")
    void bv5_consumeExactBoundary() {
        BigDecimal stock = new BigDecimal("10.00");
        BigDecimal consume = new BigDecimal("10.00");
        assertDoesNotThrow(() -> validator.validateConsumption(stock, consume));
    }

    @Test
    @DisplayName("BV6 - Just above boundary: consume currentStock + 0.01 → InsufficientStockException")
    void bv6_consumeJustAboveMax() {
        BigDecimal stock = new BigDecimal("10.00");
        BigDecimal consume = new BigDecimal("10.01");  // stock + 0.01
        assertThrows(InsufficientStockException.class,
                () -> validator.validateConsumption(stock, consume));
    }
}
