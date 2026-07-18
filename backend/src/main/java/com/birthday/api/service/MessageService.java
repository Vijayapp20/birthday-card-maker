package com.birthday.api.service;

import com.birthday.api.dto.MessageRequest;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class MessageService {

    private final ChatClient chatClient;

    public MessageService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String generateMessage(MessageRequest request) {
        return chatClient.prompt()
                .user(buildPrompt(request))
                .call()
                .content();
    }

    private String buildPrompt(MessageRequest req) {
        String occasion = (req.occasionType() != null && !req.occasionType().isBlank())
                ? req.occasionType() : "celebration";

        return String.format(
            "Write a SHORT celebration message. STRICT RULES:%n" +
            "1. EXACTLY 50-60 words - count carefully, stop at 60%n" +
            "2. This is for: %s (NOT a birthday - do NOT mention birthday, age, or years of life)%n" +
            "3. Recipient: %s | From: %s | Relationship: %s%n" +
            "4. Tone: %s%n" +
            "5. Use both names naturally%n" +
            "6. NO greeting at start (card already has it)%n" +
            "7. End with one warm closing sentence%n" +
            "8. Output ONLY the message - no labels, no formatting%n%n" +
            "IMPORTANT: The occasion is '%s'. Every sentence must relate to THIS occasion only.",
            occasion,
            req.recipientName(),
            req.senderName(),
            req.relationship(),
            getRelationshipTone(req.relationship()),
            occasion
        );
    }

    private String getRelationshipTone(String rel) {
        if (rel == null) return "warm and sincere";
        return switch (rel.toLowerCase()) {
            case "wife", "husband", "lover" -> "deeply romantic and intimate";
            case "mother", "father"         -> "respectful, grateful, and loving";
            case "brother", "sister"        -> "playful, warm, sibling-bonded";
            case "friend"                   -> "fun, genuine, and heartfelt";
            case "children"                 -> "proud, tender, encouraging";
            default                         -> "warm, sincere, and personal";
        };
    }
}
