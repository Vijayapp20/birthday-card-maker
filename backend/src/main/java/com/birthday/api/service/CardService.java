package com.birthday.api.service;

import com.birthday.api.dto.CardRequest;
import com.birthday.api.dto.CardResponse;
import com.birthday.api.entity.BirthdayCardEntity;
import com.birthday.api.repository.BirthdayCardRepository;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class CardService {

    private final BirthdayCardRepository birthdayCardRepository;

    public CardService(BirthdayCardRepository birthdayCardRepository) {
        this.birthdayCardRepository = birthdayCardRepository;
    }

    public CardResponse saveCard(CardRequest request) {
        BirthdayCardEntity entity = new BirthdayCardEntity();
        entity.setId(UUID.randomUUID().toString());
        entity.setRecipientName(request.getRecipientName());
        entity.setSenderName(request.getSenderName());
        entity.setRelationship(request.getRelationship());
        entity.setMessage(request.getMessage());
        entity.setPhotoUrl(request.getPhotoUrl());

        BirthdayCardEntity saved = birthdayCardRepository.save(entity);
        return toResponse(saved);
    }

    public CardResponse getCard(String id) {
        BirthdayCardEntity entity = birthdayCardRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Card not found: " + id));
        return toResponse(entity);
    }

    private CardResponse toResponse(BirthdayCardEntity entity) {
        return new CardResponse(
                entity.getId(),
                entity.getRecipientName(),
                entity.getSenderName(),
                entity.getRelationship(),
                entity.getMessage(),
                entity.getPhotoUrl()
        );
    }
}
