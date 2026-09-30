package com.homestock.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "raw_qr_data", columnDefinition = "TEXT")
    private String rawQrData;

    @CreationTimestamp
    @Column(name = "scanned_at", updatable = false)
    private LocalDateTime scannedAt;

    @Column(nullable = false)
    private boolean processed;

    @Column(name = "store_name", length = 200)
    private String storeName;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketItem> items = new ArrayList<>();
}
