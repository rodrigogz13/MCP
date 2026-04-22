-- Grades REST API — Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS grades_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE grades_db;

CREATE TABLE IF NOT EXISTS students (
  id   INT          NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS grades (
  id         INT          NOT NULL AUTO_INCREMENT,
  student_id INT          NOT NULL,
  subject    VARCHAR(100) NOT NULL,
  grade      FLOAT        NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_grades_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
);

-- Sample data
INSERT INTO students (name) VALUES ('Rodrigo'), ('Maria'), ('Carlos');

INSERT INTO grades (student_id, subject, grade) VALUES
  (1, 'Math', 8),
  (1, 'AI',   7),
  (2, 'Math', 9),
  (3, 'AI',   6);
