package com.birthday.api.controller;

import com.birthday.api.dto.*;
import com.birthday.api.service.CardService;
import com.birthday.api.service.FileUploadService;
import com.birthday.api.service.MessageService;
import com.birthday.api.validation.RequestValidator;
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
    private final RequestValidator validator;

    public BirthdayController(MessageService messageService,
                              FileUploadService fileUploadService,
                              CardService cardService,
                              RequestValidator validator) {
        this.messageService = messageService;
        this.fileUploadService = fileUploadService;
        this.cardService = cardService;
        this.validator = validator;
    }

    /**
     * POST /api/generate-message
     * Uses Spring AI + Groq to generate a personalised message
     */
    @PostMapping("/generate-message")
    public ResponseEntity<?> generateMessage(@RequestBody MessageRequest request) {
        try {
            MessageRequest clean = validator.validate(request);
            log.info("Generating AI message (occasion={}, relationship={})",
                    clean.occasionType(), clean.relationship());
            String message = messageService.generateMessage(clean);
            log.info("AI message generated (length={} chars)", message == null ? 0 : message.length());
            if (message == null || message.isBlank()) {
                // The model answered but produced no text (e.g. a reasoning model ran out of tokens)
                log.warn("AI returned an empty message - check GROQ_MODEL and max-tokens");
                return ResponseEntity.internalServerError()
                        .body(Map.of("error", "Could not generate a message right now. Please try again."));
            }
            return ResponseEntity.ok(new MessageResponse(message.trim()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Log the real cause on the server, but never send internals to the client
            log.error("Error generating message", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Could not generate a message right now. Please try again."));
        }
    }

    /**
     * POST /api/upload
     * Accepts multipart image, uploads to Cloudinary, returns URL
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            UploadResponse response = fileUploadService.saveFile(file);
            log.info("Photo uploaded ({} bytes)", file.getSize());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Upload error", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Could not upload the photo right now. Please try again."));
        }
    }

    /**
     * POST /api/cards
     * Saves the finished card so it can be shared via a link
     */
    @PostMapping("/cards")
    public ResponseEntity<?> createCard(@RequestBody CardRequest request) {
        try {
            CardResponse response = cardService.saveCard(validator.validate(request));
            log.info("Card saved with id: {}", response.getId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error saving card", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Could not save the card right now. Please try again."));
        }
    }

    /**
     * GET /api/cards/{id}
     * Fetches a previously saved card so the recipient can view it
     */
    @GetMapping("/cards/{id}")
    public ResponseEntity<?> getCard(@PathVariable String id) {
        if (!validator.isValidCardId(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            CardResponse response = cardService.getCard(id);
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching card", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Could not load the card right now. Please try again."));
        }
    }

    /**
     * GET /api/health
     * Simple health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "Celebration Wishes API"));
    }
}
