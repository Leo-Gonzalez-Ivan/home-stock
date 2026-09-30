package com.homestock.controller;

import com.homestock.dto.TicketDTO;
import com.homestock.model.Ticket;
import com.homestock.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/scan")
    public ResponseEntity<TicketDTO> parseQr(@RequestBody Map<String, String> body) {
        String qrContent = body.getOrDefault("qrContent", "");
        TicketDTO parsed = ticketService.parseQrContent(qrContent);
        return ResponseEntity.ok(parsed);
    }

    @PostMapping("/process")
    public ResponseEntity<Ticket> processTicket(@RequestBody @Valid TicketDTO dto) {
        Ticket ticket = ticketService.processTicket(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getAll() {
        return ResponseEntity.ok(ticketService.findAll());
    }
}
