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

        String relationshipTone = getRelationshipTone(req.relationship());
        String occasionTone     = getOccasionTone(occasion);

        return String.format(
            "You are a heartfelt message writer for special occasions.%n%n" +
            "Write a personal message STRICTLY between 50-60 words for:%n" +
            "- Recipient: %s%n" +
            "- From: %s%n" +
            "- Relationship: The recipient is the sender's %s%n" +
            "- Occasion: %s%n%n" +
            "Tone: %s + %s%n%n" +
            "STRICT RULES:%n" +
            "- MAXIMUM 60 words, MINIMUM 50 words - count carefully%n" +
            "- Do NOT mention birthday, age, or year of life unless occasion is birthday%n" +
            "- Match the occasion: write about %s specifically%n" +
            "- Use both names naturally%n" +
            "- 2-3 sentences only%n" +
            "- Warm closing that fits the occasion%n" +
            "- Do NOT start with Happy/Congratulations (card already has it)%n" +
            "- Write ONLY the message body, nothing else%n" +
            "- STOP at 60 words",
            req.recipientName(),
            req.senderName(),
            req.relationship(),
            occasion,
            relationshipTone,
            occasionTone,
            occasion
        );
    }

    private String getRelationshipTone(String relationship) {
        if (relationship == null) return "warm and sincere";
        return switch (relationship.toLowerCase()) {
            case "wife", "husband", "lover" -> "deeply romantic and intimate";
            case "mother", "father"         -> "respectful, grateful, and loving";
            case "brother", "sister"        -> "playful, warm, and sibling-bond-filled";
            case "friend"                   -> "fun, genuine, and heartfelt";
            case "children"                 -> "proud, tender, and encouraging";
            default                         -> "warm, sincere, and personal";
        };
    }

    private String getOccasionTone(String occasion) {
        return switch (occasion.toLowerCase()) {
            case "birthday"    -> "celebratory and life-affirming";
            case "anniversary" -> "romantic and nostalgic";
            case "graduation"  -> "proud and inspiring";
            case "newjob"      -> "motivating and excited about the new career chapter";
            case "newhome"     -> "warm and excited about the new home";
            case "babyshower"  -> "joyful and tender about the new arrival";
            case "engagement"  -> "romantic and joyful about the future together";
            default            -> "heartfelt and celebratory";
        };
    }
}
