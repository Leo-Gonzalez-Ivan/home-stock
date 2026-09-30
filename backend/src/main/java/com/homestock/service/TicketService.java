package com.homestock.service;

import com.homestock.dto.TicketDTO;
import com.homestock.dto.TicketItemDTO;
import com.homestock.model.*;
import com.homestock.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;

    /**
     * Parses raw QR content. Returns a TicketDTO with extracted items if parseable,
     * or a DTO with the rawQrData and empty items list if not parseable
     * (caller should prompt user for manual entry).
     */
    public TicketDTO parseQrContent(String qrContent) {
        // Attempt structured parse (JSON format from some supermarkets)
        // For now we detect common patterns and return what we can
        if (qrContent == null || qrContent.isBlank()) {
            return new TicketDTO(qrContent, null, List.of());
        }
        // If it's just a URL (AFIP tickets), return empty items for manual entry
        if (qrContent.startsWith("http")) {
            return new TicketDTO(qrContent, extractStoreFromUrl(qrContent), List.of());
        }
        // Otherwise return empty for manual completion
        return new TicketDTO(qrContent, null, List.of());
    }

    private String extractStoreFromUrl(String url) {
        // Basic heuristic to get store name from URL domain
        try {
            String domain = url.split("/")[2];
            return domain.replace("www.", "").split("\\.")[0];
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional
    public Ticket processTicket(TicketDTO dto) {
        Ticket ticket = new Ticket();
        ticket.setRawQrData(dto.rawQrData());
        ticket.setStoreName(dto.storeName());
        ticket.setProcessed(true);

        for (TicketItemDTO itemDto : dto.items()) {
            // Find existing product by name+brand or create new one
            Optional<Product> existing = productRepository
                    .findByNameContainingIgnoreCase(itemDto.productName())
                    .stream()
                    .filter(p -> itemDto.productName().equalsIgnoreCase(p.getName()))
                    .findFirst();

            Product product;
            if (existing.isPresent()) {
                product = existing.get();
                product.setQuantity(product.getQuantity().add(itemDto.quantity()));
                product = productRepository.save(product);
            } else {
                product = new Product();
                product.setName(itemDto.productName().trim());
                product.setBrand(itemDto.brand());
                product.setUnitType(itemDto.unitType());
                product.setQuantity(itemDto.quantity());
                if (itemDto.categoryId() != null) {
                    categoryRepository.findById(itemDto.categoryId())
                            .ifPresent(product::setCategory);
                }
                product = productRepository.save(product);
            }

            TicketItem item = new TicketItem();
            item.setTicket(ticket);
            item.setProduct(product);
            item.setProductNameRaw(itemDto.productName());
            item.setQuantity(itemDto.quantity());
            item.setUnitType(itemDto.unitType());
            ticket.getItems().add(item);

            StockMovement movement = new StockMovement();
            movement.setProduct(product);
            movement.setMovementType(MovementType.IN);
            movement.setQuantity(itemDto.quantity());
            movement.setReason("Ticket scan");
            stockMovementRepository.save(movement);
        }

        return ticketRepository.save(ticket);
    }

    public List<Ticket> findAll() {
        return ticketRepository.findAllByOrderByScannedAtDesc();
    }
}
