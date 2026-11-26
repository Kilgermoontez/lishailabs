const pool = require('../config/database');

const AdminModel = {
  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, avatar, must_reset_password, created_at, updated_at FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    await pool.execute('UPDATE admins SET password_hash = ?, must_reset_password = 0, updated_at = NOW() WHERE id = ?', [passwordHash, id]);
  },

  async updateProfile(id, { name, email }) {
    await pool.execute('UPDATE admins SET name = ?, email = ?, updated_at = NOW() WHERE id = ?', [name, email, id]);
  },

  async updateAvatar(id, avatarUrl) {
    await pool.execute('UPDATE admins SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, id]);
  },

  async logActivity(adminId, action, description = null, details = null, ipAddress = null, userAgent = null) {
    try {
      await pool.execute(
        'INSERT INTO admin_activity_logs (admin_id, action, description, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
        [adminId, action, description, details ? JSON.stringify(details) : null, ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async getActivityLogs(adminId = null, limit = 100, offset = 0) {
    let query = `SELECT 
      aal.id, 
      aal.admin_id, 
      a.email, 
      a.name as admin_name,
      aal.action, 
      aal.description, 
      aal.details, 
      aal.ip_address, 
      aal.user_agent,
      aal.status,
      aal.created_at 
    FROM admin_activity_logs aal
    LEFT JOIN admins a ON aal.admin_id = a.id`;
    const params = [];
    
    if (adminId) {
      query += ' WHERE aal.admin_id = ?';
      params.push(adminId);
    }
    
    query += ' ORDER BY aal.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async getActivityLogCount(adminId = null) {
    let query = 'SELECT COUNT(*) as count FROM admin_activity_logs aal';
    const params = [];
    
    if (adminId) {
      query += ' WHERE aal.admin_id = ?';
      params.push(adminId);
    }
    
    const [rows] = await pool.execute(query, params);
    return rows[0]?.count || 0;
  },
};

module.exports = AdminModel;

