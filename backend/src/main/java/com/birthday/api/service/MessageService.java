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
        return String.format("""
            You are a warm and heartfelt birthday message writer.
            
            Write a sincere, emotional, and uplifting birthday message with these details:
            - Recipient's Name: %s
            - Sender's Name: %s
            - Relationship: %s (the recipient is the sender's %s)
            
            Requirements:
            - Make it personal using both names
            - Tone should match the relationship (e.g., warm & loving for Wife/Husband/Lover, respectful for Father/Mother, playful for Friend, sweet for Children)
            - 3-5 sentences max, no bullet points
            - End with a warm closing line
            - Do NOT include any greetings like "Happy Birthday" at the start (the card already has that)
            - Write ONLY the message body, nothing else
            """,
            req.recipientName(),
            req.senderName(),
            req.relationship(),
            req.relationship()
        );
    }
}
