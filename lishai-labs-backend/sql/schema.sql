CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  avatar VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  excerpt TEXT,
  content LONGTEXT,
  cover_image VARCHAR(500),
  category VARCHAR(100) DEFAULT 'AI Insights',
  author VARCHAR(120) DEFAULT 'Lishai Labs',
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  summary TEXT,
  description LONGTEXT,
  category VARCHAR(100) DEFAULT 'Artificial Intelligence',
  image VARCHAR(500),
  tags JSON,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS policies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  policy_type VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  content LONGTEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  company VARCHAR(180),
  subject VARCHAR(180),
  message TEXT NOT NULL,
  status ENUM('new','read','resolved') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_conversations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_key VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  status ENUM('open','pending','resolved') NOT NULL DEFAULT 'open',
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT UNSIGNED NOT NULL,
  sender ENUM('visitor','admin') NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_support_messages_conversation (conversation_id, created_at),
  CONSTRAINT fk_support_messages_conversation FOREIGN KEY (conversation_id) REFERENCES support_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS project_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  company VARCHAR(180),
  project_type VARCHAR(180) NOT NULL,
  budget VARCHAR(100),
  timeline VARCHAR(100),
  brief_message TEXT NOT NULL,
  status ENUM('new','reviewing','approved','declined') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_otps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consumed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_otps_admin_created (admin_id, created_at),
  CONSTRAINT fk_admin_otps_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_password_resets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consumed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_password_resets_admin_created (admin_id, created_at),
  CONSTRAINT fk_admin_password_resets_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  source_name VARCHAR(255),
  content LONGTEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS opportunities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(190) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  location VARCHAR(180) DEFAULT '',
  type VARCHAR(80) DEFAULT 'General',
  image VARCHAR(500),
  status ENUM('draft','published','closed','archived') NOT NULL DEFAULT 'draft',
  application_url VARCHAR(500),
  application_limit INT UNSIGNED DEFAULT NULL,
  work_mode ENUM('On-site','Hybrid','Remote') NOT NULL DEFAULT 'On-site',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS opportunity_applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  opportunity_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  description TEXT NOT NULL,
  cv_url VARCHAR(500) NOT NULL,
  application_letter_url VARCHAR(500) NOT NULL,
  status ENUM('new','reviewing','approved','declined') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_opportunity_applications_opportunity (opportunity_id),
  INDEX idx_opportunity_applications_status (status),
  CONSTRAINT fk_opportunity_applications_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  status ENUM('success','error','pending') NOT NULL DEFAULT 'success',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_activity_logs_admin (admin_id),
  INDEX idx_admin_activity_logs_created (created_at),
  INDEX idx_admin_activity_logs_action (action),
  CONSTRAINT fk_admin_activity_logs_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('company_name', 'Lishai Labs'),
  ('tagline', 'Building intelligent systems for a human future'),
  ('hero_title', 'Innovate. Automate. Grow with AI.'),
  ('hero_description', 'Lishai Labs empowers people and businesses with cutting-edge artificial intelligence tools to work smarter, move faster and build a better tomorrow.'),
  ('email', 'hello@lishailabs.com'),
  ('phone', '+1 (555) 014-2026'),
  ('office_address', 'Innovation District · Global'),
  ('linkedin', 'https://linkedin.com'),
  ('twitter', 'https://x.com'),
  ('github', 'https://github.com'),
  ('facebook_url', ''),
  ('tiktok_url', ''),
  ('linkedin_url', 'https://linkedin.com'),
  ('instagram_url', ''),
  ('home_about_title', 'Empowering Africa Through Digital Innovation'),
  ('home_about_description', 'Lish AI Labs bridges the digital divide and creates sustainable employment through digital and AI-powered solutions across Kenya and beyond.'),
  ('home_about_image', ''),
  ('home_pillar_1_title', 'Filling the Digital Skills Gap'),
  ('home_pillar_1_description', 'Equipping youth with relevant digital, technical and AI skills through structured training, mentorship and certification.'),
  ('home_pillar_1_image', ''),
  ('home_pillar_2_title', 'Creating Sustainable Digital Jobs'),
  ('home_pillar_2_description', 'Establishing pathways to freelancing, AI work and enterprise development through digital hubs nationwide.'),
  ('home_pillar_2_image', ''),
  ('home_pillar_3_title', 'Driving Innovation & Responsible AI'),
  ('home_pillar_3_description', 'Developing localized AI solutions that address real-world challenges and promote ethical digital transformation.'),
  ('demo_title', 'See Lish AI Labs in action'),
  ('demo_description', 'Explore how we turn African talent and applied intelligence into practical digital solutions.'),
  ('demo_video', ''),
  ('demo_ai_title', 'AI & Data Annotation'),
  ('demo_ai_description', 'Training, annotation and quality systems that help organizations build accurate, responsible AI models.'),
  ('demo_ai_image', ''),
  ('demo_engineering_title', 'AI Engineering'),
  ('demo_engineering_description', 'Applied machine learning, predictive systems, automation and intelligent products designed for real-world impact.'),
  ('demo_engineering_image', ''),
  ('demo_software_title', 'Software Development'),
  ('demo_software_description', 'Secure, scalable enterprise platforms, workforce systems and digital services built for African markets.'),
  ('demo_software_image', ''),
  ('home_pillar_3_image', '');

INSERT IGNORE INTO policies (policy_type, title, content) VALUES
  ('privacy', 'Privacy Policy', 'We respect your privacy and protect the personal information you share with Lishai Labs.'),
  ('terms', 'Terms and Conditions', 'By using Lishai Labs services, you agree to use them lawfully and responsibly.'),
  ('cookies', 'Cookie Policy', 'We use essential technologies to deliver, secure and improve our website experience.');
