package com.homestock.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record TicketDTO(
        String rawQrData,
        String storeName,
        @NotEmpty(message = "Ticket must have at least one item") @Valid List<TicketItemDTO> items
) {}
