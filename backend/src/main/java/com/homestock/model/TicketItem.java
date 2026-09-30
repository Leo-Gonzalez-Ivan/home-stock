package com.homestock.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "ticket_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_name_raw", length = 255)
    private String productNameRaw;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", nullable = false)
    private UnitType unitType;
}
