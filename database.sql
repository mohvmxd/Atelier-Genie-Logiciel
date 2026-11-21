CREATE DATABASE IF NOT EXISTS school_transport
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE school_transport;

-- Utilisateurs internes (ONG, MAIRIE, ADMIN)
-- Position encoded in email format: firstname.position@organization.local
-- Positions: director, hr_manager, accounting_manager
CREATE TABLE users (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ONG','MAIRIE','ADMIN') NOT NULL DEFAULT 'ONG',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Parents
CREATE TABLE parents (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  fullname VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Écoles
CREATE TABLE schools (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Points de ramassage
CREATE TABLE stops (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  area VARCHAR(150),
  description VARCHAR(255)
) ENGINE=InnoDB;

-- Bus
CREATE TABLE buses (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  plate_number VARCHAR(50) NOT NULL UNIQUE,
  capacity INT UNSIGNED NOT NULL,
  driver_name VARCHAR(100),
  active TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Circuits (lignes) : un bus qui dessert une école à une heure donnée
CREATE TABLE routes (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  school_id INT UNSIGNED NOT NULL,
  bus_id INT UNSIGNED NOT NULL,
  departure_time TIME NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id)
) ENGINE=InnoDB;

-- Élèves
CREATE TABLE students (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  fullname VARCHAR(150) NOT NULL,
  school_id INT UNSIGNED NOT NULL,
  stop_id INT UNSIGNED,
  active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (school_id) REFERENCES schools(id),
  FOREIGN KEY (stop_id) REFERENCES stops(id)
) ENGINE=InnoDB;

-- Lien parent ↔ élève
CREATE TABLE parent_students (
  parent_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (parent_id, student_id),
  FOREIGN KEY (parent_id) REFERENCES parents(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB;

-- Journée de trajet pour une route donnée
CREATE TABLE trip_days (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  route_id INT UNSIGNED NOT NULL,
  date DATE NOT NULL,
  status ENUM('NON_DEMARREE','EN_COURS','TERMINE') NOT NULL DEFAULT 'NON_DEMARREE',
  UNIQUE KEY uniq_route_date (route_id, date),
  FOREIGN KEY (route_id) REFERENCES routes(id)
) ENGINE=InnoDB;

-- Présence des élèves par journée de trajet
CREATE TABLE attendances (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  trip_day_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  present TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_trip_student (trip_day_id, student_id),
  FOREIGN KEY (trip_day_id) REFERENCES trip_days(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB;

-- Planification / optimisation simple
CREATE TABLE planning_runs (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE bus_assignments (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  planning_run_id INT UNSIGNED NOT NULL,
  bus_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (planning_run_id) REFERENCES planning_runs(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
) ENGINE=InnoDB;
