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
            "Write a warm, personal message (50-60 words) for:%n" +
            "- Recipient: %s%n" +
            "- From: %s%n" +
            "- Relationship: %s%n" +
            "- Occasion: %s%n%n" +
            "Tone guide:%n" +
            "- Relationship tone: %s%n" +
            "- Occasion tone: %s%n%n" +
            "Rules:%n" +
            "- Use both names naturally%n" +
            "- 3-4 sentences, no bullet points%n" +
            "- End with a warm closing%n" +
            "- Do NOT open with greetings (already on card)%n" +
            "- Write ONLY the message body",
            req.recipientName(), req.senderName(),
            req.relationship(), occasion,
            relationshipTone, occasionTone
        );
    }

    private String getRelationshipTone(String relationship) {
        if (relationship == null) return "warm and sincere";
        return switch (relationship.toLowerCase()) {
            case "wife", "husband", "lover" -> "deeply romantic, intimate, and passionate";
            case "mother", "father"         -> "respectful, grateful, and loving";
            case "brother", "sister"        -> "playful, warm, and sibling-bond-filled";
            case "friend"                   -> "fun, genuine, and heartfelt";
            case "children"                 -> "proud, tender, and encouraging";
            case "engagement"               -> "romantic and joyful";
            default                         -> "warm, sincere, and personal";
        };
    }

    private String getOccasionTone(String occasion) {
        return switch (occasion.toLowerCase()) {
            case "birthday"    -> "celebratory, joyful, life-affirming";
            case "anniversary" -> "romantic, nostalgic, timeless";
            case "graduation"  -> "proud, inspiring, forward-looking";
            case "newjob"      -> "motivating, excited, encouraging";
            case "newhome"     -> "warm, excited, homey";
            case "babyshower"  -> "joyful, tender, hopeful";
            case "engagement"  -> "romantic, joyful, future-focused";
            default            -> "heartfelt, celebratory, uplifting";
        };
    }
}
