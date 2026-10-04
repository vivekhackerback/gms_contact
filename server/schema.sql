-- =====================================================================
-- School Contacts Database (GMS Contact) - MySQL Schema & Seed Data
-- =====================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS `u109731178_gms_contact_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `u109731178_gms_contact_db`;

-- ---------------------------------------------------------------------
-- Table: contacts (Base table for all contact categories)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `local_id` VARCHAR(100) DEFAULT NULL UNIQUE COMMENT 'Mobile device UUID for offline synchronization',
  `contact_type` ENUM('student', 'parent', 'teacher', 'staff', 'driver', 'management', 'other') NOT NULL,
  `full_name` VARCHAR(191) NOT NULL,
  `mobile_number` VARCHAR(20) NOT NULL,
  `alternate_mobile` VARCHAR(20) DEFAULT NULL,
  `whatsapp_number` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT NULL,
  `pincode` VARCHAR(20) DEFAULT NULL,
  `profile_photo` LONGTEXT DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `notes` TEXT DEFAULT NULL,
  `sync_version` INT DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_contacts_type` (`contact_type`),
  INDEX `idx_contacts_mobile` (`mobile_number`),
  INDEX `idx_contacts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: students (Role details for Students)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `student_name` VARCHAR(191) NOT NULL,
  `admission_number` VARCHAR(50) NOT NULL,
  `class` VARCHAR(50) NOT NULL,
  `section` VARCHAR(50) NOT NULL,
  `father_name` VARCHAR(191) NOT NULL,
  `parent_mobile` VARCHAR(20) NOT NULL,
  `academic_session` VARCHAR(50) NOT NULL,
  `roll_number` VARCHAR(50) DEFAULT NULL,
  `dob` DATE DEFAULT NULL,
  `gender` ENUM('Male', 'Female', 'Other') DEFAULT NULL,
  `mother_name` VARCHAR(191) DEFAULT NULL,
  `mother_mobile` VARCHAR(20) DEFAULT NULL,
  `father_mobile` VARCHAR(20) DEFAULT NULL,
  `guardian_mobile` VARCHAR(20) DEFAULT NULL,
  `student_whatsapp` VARCHAR(20) DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT NULL,
  `previous_school` VARCHAR(255) DEFAULT NULL,
  `transport_required` TINYINT(1) DEFAULT 0,
  `bus_route` VARCHAR(150) DEFAULT NULL,
  `pickup_point` VARCHAR(150) DEFAULT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  UNIQUE KEY `uq_students_admission` (`admission_number`),
  INDEX `idx_students_class_section` (`class`, `section`),
  INDEX `idx_students_parent_mobile` (`parent_mobile`),
  CONSTRAINT `fk_students_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: parents (Role details for Parents/Guardians)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `parents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `parent_name` VARCHAR(191) NOT NULL,
  `relationship_with_student` VARCHAR(50) NOT NULL,
  `father_name` VARCHAR(191) DEFAULT NULL,
  `mother_name` VARCHAR(191) DEFAULT NULL,
  `occupation` VARCHAR(150) DEFAULT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  CONSTRAINT `fk_parents_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: student_parent (Link table for parent <-> student relationship)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `student_parent` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `parent_contact_id` INT NOT NULL,
  `student_contact_id` INT DEFAULT NULL,
  `student_name` VARCHAR(191) NOT NULL,
  `student_admission_number` VARCHAR(50) DEFAULT NULL,
  `class_section` VARCHAR(50) DEFAULT NULL,
  `relationship` VARCHAR(50) NOT NULL,
  INDEX `idx_sp_parent` (`parent_contact_id`),
  INDEX `idx_sp_student` (`student_contact_id`),
  CONSTRAINT `fk_sp_parent_contact`
    FOREIGN KEY (`parent_contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sp_student_contact`
    FOREIGN KEY (`student_contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: teachers (Role details for Teachers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `teacher_name` VARCHAR(191) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `department_subject` VARCHAR(100) NOT NULL,
  `joining_date` DATE DEFAULT NULL,
  `qualification` VARCHAR(255) DEFAULT NULL,
  `classes_assigned` VARCHAR(150) DEFAULT NULL,
  `section_assigned` VARCHAR(50) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT 'Teacher',
  `dob` DATE DEFAULT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  UNIQUE KEY `uq_teachers_employee_id` (`employee_id`),
  INDEX `idx_teachers_subject` (`department_subject`),
  CONSTRAINT `fk_teachers_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: staff (Role details for Non-Teaching Staff)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `staff_name` VARCHAR(191) NOT NULL,
  `employee_id` VARCHAR(50) NOT NULL,
  `designation` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `joining_date` DATE DEFAULT NULL,
  `qualification` VARCHAR(255) DEFAULT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  UNIQUE KEY `uq_staff_employee_id` (`employee_id`),
  INDEX `idx_staff_department` (`department`),
  CONSTRAINT `fk_staff_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: drivers (Role details for Transport Staff / Drivers)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `driver_name` VARCHAR(191) NOT NULL,
  `driver_id` VARCHAR(50) NOT NULL,
  `license_number` VARCHAR(100) NOT NULL,
  `vehicle_number` VARCHAR(50) NOT NULL,
  `license_expiry_date` DATE DEFAULT NULL,
  `vehicle_type` VARCHAR(100) DEFAULT NULL,
  `route` VARCHAR(255) DEFAULT NULL,
  `emergency_contact` VARCHAR(20) DEFAULT NULL,
  UNIQUE KEY `uq_drivers_driver_id` (`driver_id`),
  INDEX `idx_drivers_route` (`route`),
  CONSTRAINT `fk_drivers_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table: management (Role details for Management & Admin Staff)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `management` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `contact_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `designation` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  INDEX `idx_management_designation` (`designation`),
  CONSTRAINT `fk_management_contact`
    FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- Initial Seed Data (Matches the project's default dataset)
-- =====================================================================

-- 1. Contacts
INSERT INTO `contacts` (`id`, `local_id`, `contact_type`, `full_name`, `mobile_number`, `alternate_mobile`, `whatsapp_number`, `email`, `address`, `city`, `state`, `pincode`, `status`, `notes`, `sync_version`, `created_at`, `updated_at`) VALUES
(1, 'loc_seed_1', 'student', 'Rahul Kumar', '9876543210', '9876543219', '9876543210', 'rahul.k@school.edu', 'Maliyabagh, Near SBI', 'Rohtas', 'Bihar', '802218', 'Active', 'Class monitor and cricket team captain', 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(2, 'loc_seed_2', 'student', 'Priya Kumar', '9876543210', NULL, '9876543210', 'priya.k@school.edu', 'Maliyabagh, Near SBI', 'Rohtas', 'Bihar', '802218', 'Active', 'Active in cultural and dance events', 1, '2026-01-12 10:00:00', '2026-01-12 10:00:00'),
(3, 'loc_seed_3', 'student', 'Aarav Sharma', '9811223344', NULL, '9811223344', 'aarav.sh@school.edu', NULL, 'Patna', 'Bihar', '800001', 'Active', 'National Science Olympiad qualifier', 1, '2026-01-15 11:00:00', '2026-01-15 11:00:00'),
(4, 'loc_seed_4', 'parent', 'Raj Kumar', '9876543210', NULL, '9876543210', 'raj.kumar.biz@gmail.com', 'Maliyabagh, Near SBI', 'Rohtas', 'Bihar', '802218', 'Active', 'PTA Vice President & Parent Representative', 1, '2026-01-10 10:00:00', '2026-01-10 10:00:00'),
(5, 'loc_seed_5', 'parent', 'Sunil Sharma', '9811223344', NULL, '9811223344', 'sunil.sharma@gmail.com', NULL, 'Patna', 'Bihar', '800001', 'Active', 'Parent of Aarav Sharma', 1, '2026-01-15 11:00:00', '2026-01-15 11:00:00'),
(6, 'loc_seed_6', 'teacher', 'Neha Sharma', '9822334455', NULL, '9822334455', 'neha.sharma@school.edu', NULL, 'Rohtas', 'Bihar', NULL, 'Active', 'Senior Mathematics faculty, Middle Wing', 1, '2026-01-05 09:00:00', '2026-01-05 09:00:00'),
(7, 'loc_seed_7', 'teacher', 'Rajesh Verma', '9833445566', NULL, '9833445566', 'rajesh.verma@school.edu', NULL, 'Rohtas', 'Bihar', NULL, 'Active', 'Head of Science Department', 1, '2026-01-05 09:30:00', '2026-01-05 09:30:00'),
(8, 'loc_seed_8', 'staff', 'Anita Singh', '9844556677', NULL, '9844556677', 'anita.accounts@school.edu', NULL, 'Rohtas', 'Bihar', NULL, 'Active', 'In-charge of student fees and billing inquiries', 1, '2026-01-02 08:30:00', '2026-01-02 08:30:00'),
(9, 'loc_seed_9', 'driver', 'Mahendra Yadav', '9855667788', NULL, '9855667788', NULL, NULL, 'Rohtas', 'Bihar', NULL, 'Active', 'Bus Route 4 Morning & Evening route', 1, '2026-01-02 08:00:00', '2026-01-02 08:00:00'),
(10, 'loc_seed_10', 'management', 'Dr. Vikram Malhotra', '9899001122', NULL, '9899001122', 'principal@school.edu', NULL, 'Rohtas', 'Bihar', NULL, 'Active', 'School Principal & Academic Director', 1, '2026-01-01 08:00:00', '2026-01-01 08:00:00')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- 2. Students
INSERT INTO `students` (`id`, `contact_id`, `student_name`, `admission_number`, `class`, `section`, `father_name`, `parent_mobile`, `academic_session`, `roll_number`, `dob`, `gender`, `mother_name`, `mother_mobile`, `father_mobile`, `student_whatsapp`, `blood_group`, `previous_school`, `transport_required`, `bus_route`, `pickup_point`, `emergency_contact`) VALUES
(1, 1, 'Rahul Kumar', 'ADM1024', '5', 'A', 'Raj Kumar', '9876543210', '2025-2026', '12', '2015-08-14', 'Male', 'Sita Devi', '9876543211', '9876543210', '9876543210', 'B+', 'St. Paul Academy', 1, 'Route 4 - City Center', 'Maliyabagh Chowk', '9876543210'),
(2, 2, 'Priya Kumar', 'ADM1099', '2', 'B', 'Raj Kumar', '9876543210', '2025-2026', '05', '2018-03-22', 'Female', 'Sita Devi', NULL, NULL, NULL, 'O+', NULL, 1, 'Route 4 - City Center', 'Maliyabagh Chowk', '9876543210'),
(3, 3, 'Aarav Sharma', 'ADM1055', '8', 'A', 'Sunil Sharma', '9811223344', '2025-2026', '01', NULL, 'Male', NULL, NULL, NULL, NULL, 'A+', NULL, 0, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);

-- 3. Parents
INSERT INTO `parents` (`id`, `contact_id`, `parent_name`, `relationship_with_student`, `father_name`, `mother_name`, `occupation`, `emergency_contact`) VALUES
(1, 4, 'Raj Kumar', 'Father', 'Late H. Kumar', 'Sita Devi', 'Business Owner (Retail & Agro)', '9876543210'),
(2, 5, 'Sunil Sharma', 'Father', NULL, NULL, 'Senior Telecom Engineer', '9811223344')
ON DUPLICATE KEY UPDATE `parent_name` = VALUES(`parent_name`);

-- 4. Student-Parent mapping
INSERT INTO `student_parent` (`id`, `parent_contact_id`, `student_contact_id`, `student_name`, `student_admission_number`, `class_section`, `relationship`) VALUES
(1, 4, 1, 'Rahul Kumar', 'ADM1024', '5-A', 'Father'),
(2, 4, 2, 'Priya Kumar', 'ADM1099', '2-B', 'Father'),
(3, 5, 3, 'Aarav Sharma', 'ADM1055', '8-A', 'Father')
ON DUPLICATE KEY UPDATE `student_name` = VALUES(`student_name`);

-- 5. Teachers
INSERT INTO `teachers` (`id`, `contact_id`, `teacher_name`, `employee_id`, `department_subject`, `joining_date`, `qualification`, `classes_assigned`, `section_assigned`, `designation`, `dob`, `emergency_contact`) VALUES
(1, 6, 'Neha Sharma', 'TCH102', 'Mathematics', '2021-06-15', 'M.Sc (Mathematics), B.Ed', '5, 6, 7', 'A, B', 'Senior Math Teacher', NULL, '9822334400'),
(2, 7, 'Rajesh Verma', 'TCH105', 'Science', '2019-04-10', 'M.Sc Physics, B.Ed', '8, 9, 10', NULL, 'HOD Science', NULL, NULL)
ON DUPLICATE KEY UPDATE `teacher_name` = VALUES(`teacher_name`);

-- 6. Staff
INSERT INTO `staff` (`id`, `contact_id`, `staff_name`, `employee_id`, `designation`, `department`, `joining_date`, `qualification`, `emergency_contact`) VALUES
(1, 8, 'Anita Singh', 'STF201', 'Accountant', 'Accounts & Finance', '2020-02-01', 'M.Com, Tally ERP', NULL)
ON DUPLICATE KEY UPDATE `staff_name` = VALUES(`staff_name`);

-- 7. Drivers
INSERT INTO `drivers` (`id`, `contact_id`, `driver_name`, `driver_id`, `license_number`, `vehicle_number`, `license_expiry_date`, `vehicle_type`, `route`, `emergency_contact`) VALUES
(1, 9, 'Mahendra Yadav', 'DRV04', 'DL-BR-2018-98441', 'BR-24-EA-5541', NULL, 'School Bus (42 Seater)', 'Route 4 - City Center to Campus', '9855667700')
ON DUPLICATE KEY UPDATE `driver_name` = VALUES(`driver_name`);

-- 8. Management
INSERT INTO `management` (`id`, `contact_id`, `name`, `designation`, `department`) VALUES
(1, 10, 'Dr. Vikram Malhotra', 'Principal / Director', 'School Administration')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
