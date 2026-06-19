package com.birthday.api.repository;

import com.birthday.api.entity.BirthdayCardEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BirthdayCardRepository extends JpaRepository<BirthdayCardEntity, String> {
}
