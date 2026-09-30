package com.homestock.service;

import com.homestock.dto.TicketDTO;
import com.homestock.dto.TicketItemDTO;
import com.homestock.model.*;
import com.homestock.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;

    public TicketDTO parseQrContent(String qrContent) {
        if (qrContent == null || qrContent.isBlank()) {
            return new TicketDTO(qrContent, null, List.of());
        }
        if (qrContent.contains("afip.gob.ar") || qrContent.contains("afip.gov.ar")) {
            log.info("Detected AFIP QR, attempting to scrape: {}", qrContent);
            return scrapeAfipTicket(qrContent);
        }
        if (qrContent.startsWith("http")) {
            return new TicketDTO(qrContent, extractStoreFromUrl(qrContent), List.of());
        }
        return new TicketDTO(qrContent, null, List.of());
    }

    private TicketDTO scrapeAfipTicket(String url) {
        String storeName = null;
        List<TicketItemDTO> items = new ArrayList<>();
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10_000)
                    .get();

            // Try store name
            Elements razonSocial = doc.select("[class*=razon], [class*=empresa], [class*=emisor]");
            if (!razonSocial.isEmpty()) {
                Element next = razonSocial.first().nextElementSibling();
                if (next != null) storeName = next.text().trim();
            }

            // Try product table
            Elements tables = doc.select("table");
            for (Element table : tables) {
                String headerText = table.select("th").text().toLowerCase();
                if (headerText.contains("descripci") || headerText.contains("denominaci") ||
                        headerText.contains("producto") || headerText.contains("detalle")) {

                    int descCol = -1, qtyCol = -1, unitCol = -1;
                    Elements ths = table.select("th");
                    for (int i = 0; i < ths.size(); i++) {
                        String th = ths.get(i).text().toLowerCase();
                        if (th.contains("descripci") || th.contains("denominaci") || th.contains("producto")) descCol = i;
                        if (th.contains("cantidad") || th.equals("cant")) qtyCol = i;
                        if (th.contains("unidad") || th.contains("u.m.")) unitCol = i;
                    }
                    if (descCol == -1) continue;

                    Elements rows = table.select("tr");
                    for (int r = 1; r < rows.size(); r++) {
                        Elements cells = rows.get(r).select("td");
                        if (cells.size() <= descCol) continue;
                        String description = cells.get(descCol).text().trim();
                        if (description.isBlank()) continue;

                        BigDecimal qty = BigDecimal.ONE;
                        if (qtyCol >= 0 && cells.size() > qtyCol) {
                            try {
                                qty = new BigDecimal(cells.get(qtyCol).text().trim().replace(".", "").replace(",", "."));
                            } catch (NumberFormatException e) { qty = BigDecimal.ONE; }
                        }

                        UnitType unitType = UnitType.UNITS;
                        if (unitCol >= 0 && cells.size() > unitCol) {
                            String unit = cells.get(unitCol).text().toLowerCase();
                            if (unit.contains("kg") || unit.contains("gram") || unit.contains("gr")) {
                                unitType = UnitType.GRAMS;
                                if (unit.contains("kg")) qty = qty.multiply(new BigDecimal("1000"));
                            } else if (unit.contains("lt") || unit.contains("litr") || unit.contains("ml")) {
                                unitType = UnitType.MILLILITERS;
                                if (unit.contains("lt") || unit.contains("litr")) qty = qty.multiply(new BigDecimal("1000"));
                            }
                        }
                        items.add(new TicketItemDTO(description, null, null, unitType, qty));
                    }
                    if (!items.isEmpty()) break;
                }
            }
            log.info("AFIP scraping: {} products found for '{}'", items.size(), storeName);
        } catch (Exception e) {
            log.warn("Failed to scrape AFIP ticket: {}", e.getMessage());
        }
        return new TicketDTO(url, storeName, items);
    }

    private String extractStoreFromUrl(String url) {
        try {
            return url.split("/")[2].replace("www.", "").split("\\.")[0];
        } catch (Exception e) { return null; }
    }

    @Transactional
    public Ticket processTicket(TicketDTO dto) {
        Ticket ticket = new Ticket();
        ticket.setRawQrData(dto.rawQrData());
        ticket.setStoreName(dto.storeName());
        ticket.setProcessed(true);

        for (TicketItemDTO itemDto : dto.items()) {
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
                    categoryRepository.findById(itemDto.categoryId()).ifPresent(product::setCategory);
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
