package com.birthday.api.dto;

public class CardRequest {
    private String recipientName;
    private String senderName;
    private String relationship;
    private String message;
    private String photoUrl;
    private String characterGif; // e.g. "pusn", "mikir", "g5" etc.

    public CardRequest() {
    }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getCharacterGif() { return characterGif; }
    public void setCharacterGif(String characterGif) { this.characterGif = characterGif; }
}
