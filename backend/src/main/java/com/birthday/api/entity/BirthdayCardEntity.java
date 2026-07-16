package com.birthday.api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "birthday_cards")
public class BirthdayCardEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @Column(name = "sender_name", nullable = false)
    private String senderName;

    @Column(name = "relationship", nullable = false)
    private String relationship;

    @Lob
    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "character_gif")
    private String characterGif;

    @Column(name = "occasion_type")
    private String occasionType;

    @Column(name = "occasion_type")
    private String occasionType;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public BirthdayCardEntity() {
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getRelationship() {
        return relationship;
    }

    public void setRelationship(String relationship) {
        this.relationship = relationship;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getCharacterGif() { return characterGif; }
    public void setCharacterGif(String characterGif) { this.characterGif = characterGif; }

    public String getOccasionType() { return occasionType; }
    public void setOccasionType(String occasionType) { this.occasionType = occasionType; }

    public String getOccasionType() { return occasionType; }
    public void setOccasionType(String occasionType) { this.occasionType = occasionType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
