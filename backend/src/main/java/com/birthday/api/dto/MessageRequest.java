package com.birthday.api.dto;

public record MessageRequest(
    String recipientName,
    String senderName,
    String relationship,
    String occasionType,
    String language // optional — e.g. "ta" for Tamil. Only used by /generate-poem; null means English.
) {}
