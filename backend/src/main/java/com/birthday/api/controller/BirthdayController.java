package com.birthday.api.controller;

import com.birthday.api.dto.*;
import com.birthday.api.service.CardService;
import com.birthday.api.service.FileUploadService;
import com.birthday.api.service.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api")
public class BirthdayController {

    private static final Logger log = LoggerFactory.getLogger(BirthdayController.class);

    private final MessageService messageService;
    private final FileUploadService fileUploadService;
    private final CardService cardService;

    public BirthdayController(MessageService messageService, FileUploadService fileUploadService, CardService cardService) {
        this.messageService = messageService;
        this.fileUploadService = fileUploadService;
        this.cardService = cardService;
    }

    /**
     * POST /api/generate-message
     * Uses Spring AI + Groq to generate a personalised birthday message
     */
    @PostMapping("/generate-message")
    public ResponseEntity<?> generateMessage(@RequestBody MessageRequest request) {
        try {
            log.info("Generating AI message for: {} ({})", request.recipientName(), request.relationship());
            String message = messageService.generateMessage(request);
            log.info("AI message generated successfully");
            return ResponseEntity.ok(new MessageResponse(message));
        } catch (Exception e) {
            log.error("Error generating message: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate message: " + e.getMessage()));
        }
    }

    /**
     * POST /api/upload
     * Accepts multipart image, uploads to Cloudinary, returns URL
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Uploading file: {}, size: {} bytes", file.getOriginalFilename(), file.getSize());
            UploadResponse response = fileUploadService.saveFile(file);
            log.info("File saved: {}", response.url());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Upload error: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * POST /api/cards
     * Saves the finished card so it can be shared via a link
     */
    @PostMapping("/cards")
    public ResponseEntity<?> createCard(@RequestBody CardRequest request) {
        try {
            CardResponse response = cardService.saveCard(request);
            log.info("Card saved with id: {}", response.id());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error saving card: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to save card: " + e.getMessage()));
        }
    }

    /**
     * GET /api/cards/{id}
     * Fetches a previously saved card so the recipient can view it
     */
    @GetMapping("/cards/{id}")
    public ResponseEntity<?> getCard(@PathVariable String id) {
        try {
            CardResponse response = cardService.getCard(id);
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching card: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch card: " + e.getMessage()));
        }
    }

    /**
     * GET /api/health
     * Simple health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Birthday API"));
    
    }
}
