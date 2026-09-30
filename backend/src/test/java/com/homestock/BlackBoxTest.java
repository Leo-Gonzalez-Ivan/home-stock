package com.homestock;

import com.homestock.exception.InsufficientStockException;
import com.homestock.validator.StockValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Black-Box Tests for StockValidator.validateConsumption(currentStock, toConsume).
 *
 * We test the observable behavior (output) given inputs, without caring about internals.
 *
 * Cases for consumeProduct (stock=10):
 *   - BB1 (valid):   toConsume < currentStock   (e.g. consume 3 from 10) → stock = 7
 *   - BB2 (valid):   toConsume == currentStock  (consume exactly all)    → stock = 0
 *   - BB3 (invalid): toConsume > currentStock   (consume 15 from 10)     → InsufficientStockException
 */
@DisplayName("Black-Box Tests — validateConsumption")
class BlackBoxTest {

    private StockValidator validator;

    @BeforeEach
    void setUp() {
        validator = new StockValidator();
    }

    // ─── BB1: Partial consumption (toConsume < currentStock) ────────────────────

    @Test
    @DisplayName("BB1 - Valid: consume 3 from stock of 10 → no exception thrown")
    void bb1_partialConsumption_valid() {
        BigDecimal stock = new BigDecimal("10");
        BigDecimal consume = new BigDecimal("3");
        assertDoesNotThrow(() -> validator.validateConsumption(stock, consume));
    }

    @Test
    @DisplayName("BB1 - Valid: consume 0.5 from stock of 2.0 → no exception")
    void bb1_partialConsumption_decimals() {
        assertDoesNotThrow(() -> validator.validateConsumption(
                new BigDecimal("2.0"), new BigDecimal("0.5")));
    }

    @Test
    @DisplayName("BB1 - Valid: consume 1 from stock of 100 → no exception")
    void bb1_partialConsumption_small() {
        assertDoesNotThrow(() -> validator.validateConsumption(
                new BigDecimal("100"), new BigDecimal("1")));
    }

    // ─── BB2: Exact full consumption (toConsume == currentStock) ────────────────

    @Test
    @DisplayName("BB2 - Valid: consume exactly 10 from stock of 10 → no exception")
    void bb2_exactConsumption() {
        BigDecimal stock = new BigDecimal("10");
        BigDecimal consume = new BigDecimal("10");
        assertDoesNotThrow(() -> validator.validateConsumption(stock, consume));
    }

    @Test
    @DisplayName("BB2 - Valid: consume exactly 0.01 from stock of 0.01 → no exception")
    void bb2_exactConsumption_tiny() {
        assertDoesNotThrow(() -> validator.validateConsumption(
                new BigDecimal("0.01"), new BigDecimal("0.01")));
    }

    @Test
    @DisplayName("BB2 - Valid: consume exactly 999.99 from stock of 999.99 → no exception")
    void bb2_exactConsumption_large() {
        assertDoesNotThrow(() -> validator.validateConsumption(
                new BigDecimal("999.99"), new BigDecimal("999.99")));
    }

    // ─── BB3: Over-consumption (toConsume > currentStock) ───────────────────────

    @Test
    @DisplayName("BB3 - Invalid: consume 15 from stock of 10 → InsufficientStockException")
    void bb3_overConsumption() {
        BigDecimal stock = new BigDecimal("10");
        BigDecimal consume = new BigDecimal("15");
        InsufficientStockException ex = assertThrows(
                InsufficientStockException.class,
                () -> validator.validateConsumption(stock, consume));
        assertTrue(ex.getMessage().contains("Cannot consume"));
        assertTrue(ex.getMessage().contains("15"));
    }

    @Test
    @DisplayName("BB3 - Invalid: consume 10.01 from stock of 10 → InsufficientStockException")
    void bb3_slightlyOverConsumption() {
        assertThrows(InsufficientStockException.class,
                () -> validator.validateConsumption(
                        new BigDecimal("10"), new BigDecimal("10.01")));
    }

    @Test
    @DisplayName("BB3 - Invalid: consume 1 from stock of 0 → InsufficientStockException")
    void bb3_consumeFromEmptyStock() {
        assertThrows(InsufficientStockException.class,
                () -> validator.validateConsumption(
                        BigDecimal.ZERO, new BigDecimal("1")));
    }
}
