const pool = require('../config/database');
const ContentModel = require('../models/ContentModel');
const AdminModel = require('../models/AdminModel');
const postModel = new ContentModel('posts');
const projectModel = new ContentModel('projects');
const opportunityModel = new ContentModel('opportunities');

const slugify = (value) => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const listPosts = async (req, res) => {
  try {
    const result = await postModel.findAll({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    res.json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to load posts.' });
  }
};

const getPost = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM posts WHERE slug = ? AND status = ? LIMIT 1', [req.params.slug, 'published']);
    if (!rows[0]) return res.status(404).json({ message: 'Article not found.' });
    res.json(rows[0]);
  } catch (_) {
    res.status(500).json({ message: 'Unable to load article.' });
  }
};

const createPost = async (req, res) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    const result = await postModel.createPost(data);
    await AdminModel.logActivity(
      req.admin.id,
      'POST_CREATED',
      `Created post: ${data.title}`,
      { postId: result.id, title: data.title },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.status(201).json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to create post.' });
  }
};

const updatePost = async (req, res) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    const result = await postModel.updatePost(req.params.id, data);
    await AdminModel.logActivity(
      req.admin.id,
      'POST_UPDATED',
      `Updated post: ${data.title}`,
      { postId: req.params.id, title: data.title },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to update post.' });
  }
};

const deletePost = async (req, res) => {
  try {
    await postModel.remove(req.params.id);
    await AdminModel.logActivity(
      req.admin.id,
      'POST_DELETED',
      `Deleted post ID: ${req.params.id}`,
      { postId: req.params.id },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.status(204).end();
  } catch (_) {
    res.status(500).json({ message: 'Unable to delete post.' });
  }
};

const listProjects = async (req, res) => {
  try {
    const result = await projectModel.findAll({
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status,
    });
    result.rows = result.rows.map((project) => {
      let tags = [];
      if (Array.isArray(project.tags)) tags = project.tags;
      else if (typeof project.tags === 'string') {
        try { tags = JSON.parse(project.tags); }
        catch (_) { tags = project.tags.split(',').map((tag) => tag.trim()).filter(Boolean); }
      }
      if (!Array.isArray(tags)) tags = [];
      return { ...project, tags };
    });
    res.json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to load projects.' });
  }
};

const createProject = async (req, res) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    const result = await projectModel.createProject(data);
    await AdminModel.logActivity(
      req.admin.id,
      'PROJECT_CREATED',
      `Created project: ${data.title}`,
      { projectId: result.id, title: data.title },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.status(201).json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to create project.' });
  }
};

const updateProject = async (req, res) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    const result = await projectModel.updateProject(req.params.id, data);
    await AdminModel.logActivity(
      req.admin.id,
      'PROJECT_UPDATED',
      `Updated project: ${data.title}`,
      { projectId: req.params.id, title: data.title },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to update project.' });
  }
};

const deleteProject = async (req, res) => {
  try {
    await projectModel.remove(req.params.id);
    await AdminModel.logActivity(
      req.admin.id,
      'PROJECT_DELETED',
      `Deleted project ID: ${req.params.id}`,
      { projectId: req.params.id },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.status(204).end();
  } catch (_) {
    res.status(500).json({ message: 'Unable to delete project.' });
  }
};

const getOpportunity = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT o.*,
        COUNT(oa.id) AS applications_count,
        CASE WHEN o.application_limit IS NULL THEN NULL
             ELSE GREATEST(o.application_limit - COUNT(oa.id), 0)
        END AS remaining_applications
       FROM opportunities o
       LEFT JOIN opportunity_applications oa ON oa.opportunity_id=o.id
       WHERE o.slug=? AND o.status=? 
       GROUP BY o.id LIMIT 1`,
      [req.params.slug, 'published']
    );
    if (!rows[0]) return res.status(404).json({ message: 'Opportunity not found.' });
    res.json(rows[0]);
  } catch (_) {
    res.status(500).json({ message: 'Unable to load opportunity.' });
  }
};

const listOpportunities = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (req.query.status) {
      where = ' WHERE o.status=?';
      params.push(req.query.status);
    }
    const [rows] = await pool.execute(
      `SELECT o.*,
        COUNT(oa.id) AS applications_count,
        CASE WHEN o.application_limit IS NULL THEN NULL
             ELSE GREATEST(o.application_limit - COUNT(oa.id), 0)
        END AS remaining_applications
       FROM opportunities o
       LEFT JOIN opportunity_applications oa ON oa.opportunity_id=o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM opportunities o${where}`,
      params
    );
    res.json({ rows, total: countRows[0].total, page, limit });
  } catch (_) {
    res.status(500).json({ message: 'Unable to load opportunities.' });
  }
};

const createOpportunity = async (req, res) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    const result = await opportunityModel.createOpportunity(data);
    await AdminModel.logActivity(
      req.admin.id,
      'OPPORTUNITY_CREATED',
      `Created opportunity: ${data.title}`,
      { opportunityId: result.id, title: data.title },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.status(201).json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to create opportunity.' });
  }
};

const updateOpportunity = async (req, res) => {
  try {
    const data = { ...req.body, slug: slugify(req.body.slug || req.body.title) };
    const result = await opportunityModel.updateOpportunity(req.params.id, data);
    await AdminModel.logActivity(
      req.admin.id,
      'OPPORTUNITY_UPDATED',
      `Updated opportunity: ${data.title}`,
      { opportunityId: req.params.id, title: data.title },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.json(result);
  } catch (_) {
    res.status(500).json({ message: 'Unable to update opportunity.' });
  }
};

const deleteOpportunity = async (req, res) => {
  try {
    await opportunityModel.remove(req.params.id);
    await AdminModel.logActivity(
      req.admin.id,
      'OPPORTUNITY_DELETED',
      `Deleted opportunity ID: ${req.params.id}`,
      { opportunityId: req.params.id },
      req.ip || req.connection.remoteAddress,
      req.get('user-agent')
    );
    res.status(204).end();
  } catch (_) {
    res.status(500).json({ message: 'Unable to delete opportunity.' });
  }
};

module.exports = {
  listPosts, getPost, createPost, updatePost, deletePost,
  listProjects, createProject, updateProject, deleteProject,
  getOpportunity, listOpportunities, createOpportunity, updateOpportunity, deleteOpportunity,
};
