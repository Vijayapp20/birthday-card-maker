-- ─────────────────────────────────────────────────────────────────────────────
-- Birthday Card Maker — MySQL Schema
-- Run this once before starting the backend
-- ─────────────────────────────────────────────────────────────────────────────

-- Create database
CREATE DATABASE IF NOT EXISTS birthday_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE birthday_db;

-- ── photo_uploads table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photo_uploads (
  id                BIGINT          NOT NULL AUTO_INCREMENT,
  original_filename VARCHAR(255)    NOT NULL COMMENT 'Original file name from user',
  stored_filename   VARCHAR(255)    NOT NULL UNIQUE COMMENT 'UUID-based filename on disk',
  photo_url         VARCHAR(500)    NOT NULL COMMENT 'Relative URL e.g. /uploads/uuid.jpg',
  file_size         BIGINT          COMMENT 'File size in bytes',
  content_type      VARCHAR(100)    COMMENT 'MIME type e.g. image/jpeg',
  uploaded_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Upload timestamp',

  PRIMARY KEY (id),
  INDEX idx_stored_filename (stored_filename),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores uploaded photo metadata for birthday cards';

-- ── birthday_cards table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS birthday_cards (
  id              VARCHAR(36)   NOT NULL COMMENT 'UUID used in the shareable link',
  recipient_name  VARCHAR(255)  NOT NULL,
  sender_name     VARCHAR(255)  NOT NULL,
  relationship    VARCHAR(100)  NOT NULL,
  message         TEXT          NOT NULL,
  photo_url       VARCHAR(500)  COMMENT 'Relative URL e.g. /uploads/uuid.jpg',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores generated birthday cards for sharing via link';
