const pool = require('../config/database');
const BaseModel = require('./BaseModel');

class ContentModel extends BaseModel {
  async createPost(data) {
    const [result] = await pool.execute(
      `INSERT INTO posts (title, slug, excerpt, content, cover_image, category, author, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, data.excerpt || '', data.content || '', data.cover_image || '', data.category || 'AI Insights', data.author || 'Lishai Labs', data.status || 'draft', data.status === 'published' ? new Date() : null]
    );
    return this.findById(result.insertId);
  }

  async updatePost(id, data) {
    await pool.execute(
      `UPDATE posts SET title=?, slug=?, excerpt=?, content=?, cover_image=?, category=?, author=?, status=?, published_at=?,
       updated_at=NOW() WHERE id=?`,
      [data.title, data.slug, data.excerpt || '', data.content || '', data.cover_image || '', data.category || 'AI Insights', data.author || 'Lishai Labs', data.status || 'draft', data.status === 'published' ? new Date() : null, id]
    );
    return this.findById(id);
  }

  async createProject(data) {
    const [result] = await pool.execute(
      `INSERT INTO projects (title, slug, summary, description, category, image, tags, status, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, data.summary || '', data.description || '', data.category || 'Artificial Intelligence', data.image || '', JSON.stringify(data.tags || []), data.status || 'published', data.featured ? 1 : 0]
    );
    return this.findById(result.insertId);
  }

  async updateProject(id, data) {
    await pool.execute(
      `UPDATE projects SET title=?, slug=?, summary=?, description=?, category=?, image=?, tags=?, status=?, featured=?, updated_at=NOW() WHERE id=?`,
      [data.title, data.slug, data.summary || '', data.description || '', data.category || 'Artificial Intelligence', data.image || '', JSON.stringify(data.tags || []), data.status || 'published', data.featured ? 1 : 0, id]
    );
    return this.findById(id);
  }

  async createOpportunity(data) {
    const [result] = await pool.execute(
      `INSERT INTO opportunities (title, slug, description, location, type, image, status, application_url, application_limit, work_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, data.description || '', data.location || '', data.type || 'General', data.image || '', data.status || 'draft', data.application_url || '', data.application_limit ?? null, data.work_mode || 'On-site']
    );
    return this.findById(result.insertId);
  }

  async updateOpportunity(id, data) {
    await pool.execute(
      `UPDATE opportunities SET title=?, slug=?, description=?, location=?, type=?, image=?, status=?, application_url=?, application_limit=?, work_mode=?, updated_at=NOW()
       WHERE id=?`,
      [data.title, data.slug, data.description || '', data.location || '', data.type || 'General', data.image || '', data.status || 'draft', data.application_url || '', data.application_limit ?? null, data.work_mode || 'On-site', id]
    );
    return this.findById(id);
  }
}

module.exports = ContentModel;
