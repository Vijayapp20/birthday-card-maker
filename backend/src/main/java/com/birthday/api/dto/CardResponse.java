package com.birthday.api.dto;

public class CardResponse {
    private String id;
    private String recipientName;
    private String senderName;
    private String relationship;
    private String message;
    private String photoUrl;
    private String characterGif;
    private String occasionType;

    public CardResponse() {}

    public CardResponse(String id, String recipientName, String senderName, String relationship,
                        String message, String photoUrl, String characterGif, String occasionType) {
        this.id = id;
        this.recipientName = recipientName;
        this.senderName = senderName;
        this.relationship = relationship;
        this.message = message;
        this.photoUrl = photoUrl;
        this.characterGif = characterGif;
        this.occasionType = occasionType;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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

    public String getOccasionType() { return occasionType; }
    public void setOccasionType(String occasionType) { this.occasionType = occasionType; }
}
