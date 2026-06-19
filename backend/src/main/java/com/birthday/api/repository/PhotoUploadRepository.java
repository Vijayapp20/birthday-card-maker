package com.birthday.api.repository;

import com.birthday.api.entity.PhotoUpload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhotoUploadRepository extends JpaRepository<PhotoUpload, Long> {

    Optional<PhotoUpload> findByStoredFilename(String storedFilename);

    Optional<PhotoUpload> findByPhotoUrl(String photoUrl);
}
