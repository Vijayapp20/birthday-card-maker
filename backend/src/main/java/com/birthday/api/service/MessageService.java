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
                ? req.occasionType()
                : "celebration";

        return String.format(
            "You are a warm and heartfelt message writer for special occasions.%n%n" +
            "Write a sincere, emotional, and uplifting message with these details:%n" +
            "- Recipient's Name: %s%n" +
            "- Sender's Name: %s%n" +
            "- Relationship: %s (the recipient is the sender's %s)%n" +
            "- Occasion: %s%n%n" +
            "Requirements:%n" +
            "- Make it personal using both names%n" +
            "- Tone must match the occasion appropriately%n" +
            "- Anniversary: romantic, nostalgic%n" +
            "- Graduation: proud, encouraging%n" +
            "- New Job or Promotion: motivating, excited%n" +
            "- New Home: warm, excited%n" +
            "- Baby Shower or New Born: joyful, tender%n" +
            "- Engagement: romantic, joyful%n" +
            "- Birthday: warm, celebratory%n" +
            "- Custom or Other: match the occasion tone appropriately%n" +
            "- 3-5 sentences max, no bullet points%n" +
            "- End with a warm closing line that fits the occasion%n" +
            "- Do NOT start with greetings like Happy Birthday or Congratulations (the card already has them)%n" +
            "- Write ONLY the message body, nothing else",
            req.recipientName(),
            req.senderName(),
            req.relationship(),
            req.relationship(),
            occasion
        );
    }
}
