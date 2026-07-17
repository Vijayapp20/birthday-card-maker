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
        String prompt = buildPrompt(request);
        return chatClient.prompt()
                .user(prompt)
                .call()
                .content();
    }

    private String buildPrompt(MessageRequest req) {
        String occasion = req.occasionType() != null ? req.occasionType() : "birthday";
        return String.format("""
            You are a warm and heartfelt celebration message writer.

            Write a sincere, emotional, and uplifting celebration message with these details:
            - Recipient's Name: %s
            - Sender's Name: %s
            - Relationship: %s (the recipient is the sender's %s)
            - Occasion: %s

            Requirements:
            - Make it personal using both names
            - Tone should match the relationship AND occasion
            - For Birthday: warm, celebratory; Anniversary: romantic, nostalgic; Graduation: proud, encouraging; New Job/Promotion: motivating, excited; New Home: excited, warm; Baby Shower: joyful, tender; Engagement: romantic, joyful; Custom: match the occasion tone
            - 3-5 sentences max, no bullet points
            - End with a warm closing line matching the occasion
            - Do NOT include greetings like "Happy Birthday"/"Congratulations" at the start (the card already has that)
            - Write ONLY the message body, nothing else
            """,
            req.recipientName(),
            req.senderName(),
            req.relationship(),
            req.relationship(),
            occasion
        );
    }
}
