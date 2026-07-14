package com.birthday.api.dto;

public record CardRequest(String recipientName, String senderName, String relationship, String message,
		String photoUrl) {

}
