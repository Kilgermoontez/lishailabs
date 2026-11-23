require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const main = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const database = process.env.DB_NAME || 'lishai_labs';
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${database}\``);

  const schema = fs.readFileSync(path.join(__dirname, '../../sql/schema.sql'), 'utf8');
  await connection.query(schema);

  const [limitColumns] = await connection.query(
    "SHOW COLUMNS FROM opportunities LIKE 'application_limit'"
  );
  if (limitColumns.length === 0) {
    await connection.query(
      'ALTER TABLE opportunities ADD COLUMN application_limit INT UNSIGNED DEFAULT NULL AFTER application_url'
    );
  }

  const [workModeColumns] = await connection.query(
    "SHOW COLUMNS FROM opportunities LIKE 'work_mode'"
  );
  if (workModeColumns.length === 0) {
    await connection.query(
      "ALTER TABLE opportunities ADD COLUMN work_mode ENUM('On-site','Hybrid','Remote') NOT NULL DEFAULT 'On-site' AFTER application_limit"
    );
  }

  const documentFiles = [
    ['Lish-AI-Labs-Empowering-Africa-Through-Digital-Innovation', 'C:\\Users\\masak\\Downloads\\Lish-AI-Labs-Empowering-Africa-Through-Digital-Inn_260223_110426.pdf'],
    ['LISH AI LABS - Pan-African Innovation', 'C:\\Users\\masak\\Downloads\\LISH-AI-LABS_260226_121224.pdf'],
  ];
  for (const [title, filePath] of documentFiles) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const parser = new PDFParse({ data: fs.readFileSync(filePath) });
      const parsed = await parser.getText();
      const content = String(parsed.text || '').trim();
      await parser.destroy();
      if (content) {
        await connection.execute(
          'DELETE FROM knowledge_documents WHERE source_name=?',
          [path.basename(filePath)]
        );
        await connection.execute(
          'INSERT INTO knowledge_documents (title, source_name, content, is_active) VALUES (?, ?, ?, 1)',
          [title, path.basename(filePath), content]
        );
      }
    } catch (error) {
      console.warn(`Could not index ${path.basename(filePath)}: ${error.message}`);
    }
  }

  const adminEmail = 'masakarobert69@gmail.com';
  const adminPassword = 'Godisgood@966';
  await connection.execute('DELETE FROM admins WHERE LOWER(email) <> ?', [adminEmail]);
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await connection.execute(
    `INSERT INTO admins (name, email, password_hash, role)
     VALUES (?, ?, ?, 'super_admin')
     ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role='super_admin', updated_at=NOW()`,
    ['Masaka Robert', adminEmail, passwordHash]
  );

  await connection.end();
  console.log(`Database initialized: ${database}`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

