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

    private final Cloudinary cloudinary;
    private final PhotoUploadRepository photoUploadRepository;

    public FileUploadService(Cloudinary cloudinary, PhotoUploadRepository photoUploadRepository) {
        this.cloudinary = cloudinary;
        this.photoUploadRepository = photoUploadRepository;
    }

    public UploadResponse saveFile(MultipartFile file) throws IOException {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed!");
        }

        String originalFilename = file.getOriginalFilename() != null
                ? file.getOriginalFilename() : "upload";
        String publicId = "birthday-cards/" + UUID.randomUUID();

        // Upload to Cloudinary (cloud storage — survives backend restarts/redeploys)
        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
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
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .photoUrl(photoUrl)
                .fileSize(file.getSize())
                .contentType(contentType)
                .build();

        PhotoUpload saved = photoUploadRepository.save(entity);
        log.info("Photo uploaded to Cloudinary and saved to DB - id: {}, url: {}", saved.getId(), photoUrl);

        return new UploadResponse(photoUrl, storedFilename);
    }
}
