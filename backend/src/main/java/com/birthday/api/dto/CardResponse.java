package com.birthday.api.dto;

public record CardResponse(String id, String recipientName, String senderName, String relationship, String message,
		String photoUrl) {

}
