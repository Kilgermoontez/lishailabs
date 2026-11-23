const pool = require('../config/database');

const AdminModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, avatar, created_at, updated_at FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    await pool.execute('UPDATE admins SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, id]);
  },

  async updateProfile(id, { name, email }) {
    await pool.execute('UPDATE admins SET name = ?, email = ?, updated_at = NOW() WHERE id = ?', [name, email, id]);
  },
};

module.exports = AdminModel;

