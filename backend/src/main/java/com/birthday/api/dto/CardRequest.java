package com.birthday.api.dto;

public class CardRequest {
    private String recipientName;
    private String senderName;
    private String relationship;
    private String message;
    private String photoUrl;
    private String characterGif;
    private String occasionType;

    public CardRequest() {}

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String v) { this.recipientName = v; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String v) { this.senderName = v; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String v) { this.relationship = v; }

    public String getMessage() { return message; }
    public void setMessage(String v) { this.message = v; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String v) { this.photoUrl = v; }

    public String getCharacterGif() { return characterGif; }
    public void setCharacterGif(String v) { this.characterGif = v; }

    public String getOccasionType() { return occasionType; }
    public void setOccasionType(String v) { this.occasionType = v; }
}
