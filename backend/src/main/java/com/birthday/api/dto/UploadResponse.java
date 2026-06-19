package com.birthday.api.dto;

public class UploadResponse {
    private String url;
    private String filename;

    public UploadResponse() {
    }

    public UploadResponse(String url, String filename) {
        this.url = url;
        this.filename = filename;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
