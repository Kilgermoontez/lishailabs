const pool = require('../config/database');

class BaseModel {
  constructor(table) {
    this.table = table;
  }

  async findAll({ page = 1, limit = 12, status, orderBy = 'created_at DESC' } = {}) {
    const offset = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);
    const safeLimit = Math.min(Math.max(Number(limit), 1), 100);
    const params = [];
    let where = '';
    if (status) {
      where = ' WHERE status = ?';
      params.push(status);
    }
    const [rows] = await pool.execute(
      `SELECT * FROM ${this.table}${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM ${this.table}${where}`,
      params
    );
    return { rows, total: countRows[0].total, page: Number(page), limit: safeLimit };
  }

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM ${this.table} WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  async remove(id) {
    const [result] = await pool.execute(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = BaseModel;

