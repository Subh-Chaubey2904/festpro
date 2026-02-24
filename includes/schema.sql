-- =====================================================
-- FESTPRO - Database Schema
-- Run this SQL in phpMyAdmin or MySQL CLI
-- =====================================================

CREATE DATABASE IF NOT EXISTS festpro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE festpro_db;

-- ── Colleges / CC Codes ──────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cc_code     VARCHAR(20)  NOT NULL UNIQUE,
    cl_name     VARCHAR(100) NOT NULL,
    department  VARCHAR(50),
    total_pr    INT          DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cc_code (cc_code),
    INDEX idx_total_pr (total_pr DESC)
) ENGINE=InnoDB;

-- ── Events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    event_code      VARCHAR(10)  NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    department      ENUM('technical','cultural','sports','management') NOT NULL,
    description     TEXT,
    rules           TEXT,
    icon            VARCHAR(10)  DEFAULT '🎯',
    pr_participation INT DEFAULT 10,
    pr_first        INT DEFAULT 50,
    pr_second       INT DEFAULT 30,
    pr_third        INT DEFAULT 20,
    is_active       TINYINT(1)   DEFAULT 1,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Participants / Registrations ─────────────────────
CREATE TABLE IF NOT EXISTS registrations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    reg_id      VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    cc_code     VARCHAR(20)  NOT NULL,
    cl_name     VARCHAR(100) NOT NULL,
    contact     VARCHAR(15)  NOT NULL,
    email       VARCHAR(100),
    team_members TEXT,
    event_id    INT          NOT NULL,
    event_name  VARCHAR(100) NOT NULL,
    department  VARCHAR(50)  NOT NULL,
    status      ENUM('pending','approved','rejected') DEFAULT 'pending',
    pr_added    TINYINT(1)   DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_cc_code (cc_code),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ── PR Point Transactions ─────────────────────────────
CREATE TABLE IF NOT EXISTS pr_transactions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    cc_code     VARCHAR(20)  NOT NULL,
    event_id    INT          NOT NULL,
    position    TINYINT      NOT NULL COMMENT '0=participation,1=first,2=second,3=third',
    points      INT          NOT NULL,
    declared_by VARCHAR(50)  DEFAULT 'admin',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_award (cc_code, event_id, position),
    FOREIGN KEY (event_id) REFERENCES events(id)
) ENGINE=InnoDB;

-- ── Admin Users ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(100) NOT NULL COMMENT 'plain text password',
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default admin (username: admin | password: fest2024)
INSERT IGNORE INTO admins (username, password)
VALUES ('admin', 'fest2024');

-- ── Seed Events ───────────────────────────────────────
INSERT IGNORE INTO events (event_code, name, department, description, rules, icon, pr_participation, pr_first, pr_second, pr_third) VALUES
('t1','Code Clash','technical','Competitive programming battle across 3 elimination rounds.','Solo or pair|2 hour time limit|No AI tools|Any language','💻',10,50,30,20),
('t2','Hack Sprint','technical','24-hour hackathon to build innovative solutions.','Teams of 3-4|Original ideas|Working demo required|Mentors available','⚡',15,60,40,25),
('t3','Circuit Minds','technical','Electronics and hardware design challenge.','Team of 2|Components provided|Safety rules apply|Judged on innovation','🔌',10,50,30,20),
('c1','Rhythm Riot','cultural','Dance competition open to all styles.','4-8 minutes|No recorded vocals|Solo or group|Costumes encouraged','💃',10,50,30,20),
('c2','Stage Thunder','cultural','Drama and skit performance showcase.','Max 12 members|15 minute slot|Original script preferred|Props on request','🎭',10,50,30,20),
('c3','Vocal Storm','cultural','Solo and group singing competition.','Backing track allowed|5 minutes|Any language|No lip-syncing','🎤',10,50,30,20),
('s1','Turf Wars','sports','5-a-side football knockout tournament.','5 players + 2 subs|15-minute halves|Fair play enforced|Referee final','⚽',10,60,40,25),
('s2','Smash Arena','sports','Badminton singles and doubles championship.','Standard BWF rules|Equipment provided|Best of 3 sets|Singles and doubles','🏸',10,50,30,20),
('s3','Track Blaze','sports','100m 200m and 400m sprint events.','Standard athletics rules|Spiked shoes allowed|Three heats|Finals top 8','🏃',10,50,30,20),
('m1','Biz Pitch','management','Present your startup idea to industry judges.','Team of 2-4|10 min pitch + 5 Q&A|PPT required|Original business plan','📈',10,50,30,20),
('m2','Ad Blitz','management','Create a live advertisement campaign.','Team of 3 max|6 hours|Any medium|Judged on creativity','🎯',10,50,30,20),
('m3','Case Crunch','management','Analyze and solve a real business case.','Solo or duo|90 minutes|Written + verbal|Industry judges','🧩',10,50,30,20);