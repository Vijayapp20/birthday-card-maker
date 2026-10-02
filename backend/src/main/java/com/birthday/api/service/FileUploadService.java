package com.birthday.api.service;

import com.birthday.api.dto.UploadResponse;
import com.birthday.api.entity.PhotoUpload;
import com.birthday.api.repository.PhotoUploadRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Logger log = LoggerFactory.getLogger(FileUploadService.class);

    /** Keep in sync with spring.servlet.multipart.max-file-size */
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final Cloudinary cloudinary;
    private final PhotoUploadRepository photoUploadRepository;
    private final ImageModerationService moderationService;

    public FileUploadService(Cloudinary cloudinary,
                             PhotoUploadRepository photoUploadRepository,
                             ImageModerationService moderationService) {
        this.cloudinary = cloudinary;
        this.photoUploadRepository = photoUploadRepository;
        this.moderationService = moderationService;
    }

    public UploadResponse saveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please choose a photo to upload.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Photo is too large. Please choose a photo under 5 MB.");
        }

        byte[] bytes = file.getBytes();

        // Don't trust the Content-Type header the client sends — check the real file signature.
        String detectedType = detectImageType(bytes);
        if (detectedType == null) {
            throw new IllegalArgumentException("Only JPG, PNG or WebP photos are allowed.");
        }

        // Refuse adult (18+) and graphic/bloody photos BEFORE anything is stored.
        moderationService.assertSafe(bytes, detectedType);

        String publicId = "birthday-cards/" + UUID.randomUUID();

        // Upload to Cloudinary (cloud storage — survives backend restarts/redeploys)
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                bytes,
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "resource_type", "image",
                        "overwrite", false
                )
        );

        String photoUrl = (String) uploadResult.get("secure_url");
        String storedFilename = (String) uploadResult.get("public_id");

        // Save metadata to MySQL
        PhotoUpload entity = PhotoUpload.builder()
                .originalFilename(safeFilename(file.getOriginalFilename()))
                .storedFilename(storedFilename)
                .photoUrl(photoUrl)
                .fileSize((long) bytes.length)
                .contentType(detectedType)
                .build();

        PhotoUpload saved = photoUploadRepository.save(entity);
        log.info("Photo uploaded to Cloudinary and saved to DB - id: {}", saved.getId());

        return new UploadResponse(photoUrl, storedFilename);
    }

    /** Returns the MIME type if the bytes are a JPEG, PNG or WebP image, otherwise null. */
    private String detectImageType(byte[] b) {
        // JPEG: FF D8 FF
        if (b.length > 3
                && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (b.length > 8
                && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return "image/png";
        }
        // WebP: "RIFF" .... "WEBP"
        if (b.length > 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    /** Strips any path, control characters and excess length from the client-supplied file name. */
    private String safeFilename(String name) {
        if (name == null || name.isBlank()) return "upload";
        String n = name.replace('\\', '/');
        n = n.substring(n.lastIndexOf('/') + 1).replaceAll("\\p{Cc}", "").trim();
        if (n.isEmpty()) return "upload";
        return n.length() > 200 ? n.substring(0, 200) : n;
    }
}
