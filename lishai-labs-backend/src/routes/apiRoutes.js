const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const auth = require('../controllers/AuthController');
const content = require('../controllers/ContentController');
const site = require('../controllers/SiteController');
const chat = require('../controllers/ChatController');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(extension)
        ? extension
        : '';
      callback(null, `${crypto.randomBytes(16).toString('hex')}${safeExtension}`);
    },
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_, file, callback) => {
    if (/^image\/(jpeg|png|webp|gif|svg\+xml)$/.test(file.mimetype)) callback(null, true);
    else callback(new Error('Only JPEG, PNG, WEBP, GIF and SVG images are allowed.'));
  },
});
const documentUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const allowed = ['.pdf', '.doc', '.docx'];
      callback(null, `${crypto.randomBytes(16).toString('hex')}${allowed.includes(extension) ? extension : ''}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) callback(null, true);
    else callback(new Error('CV and application letter must be PDF, DOC or DOCX.'));
  },
});

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const allowed = ['.mp4', '.webm', '.mov'];
      callback(null, `${crypto.randomBytes(16).toString('hex')}${allowed.includes(extension) ? extension : ''}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (/^video\/(mp4|webm|quicktime)$/.test(file.mimetype)) callback(null, true);
    else callback(new Error('Only MP4, WebM and MOV videos are allowed.'));
  },
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post('/auth/login', authLimiter, auth.login);
router.post('/auth/verify-otp', authLimiter, auth.verifyOtp);
router.get('/auth/me', requireAuth, auth.me);
router.put('/auth/password', requireAuth, auth.updatePassword);
router.put('/auth/profile', requireAuth, auth.updateProfile);

router.get('/posts', content.listPosts);
router.get('/posts/:slug', content.getPost);
router.post('/posts', requireAuth, content.createPost);
router.put('/posts/:id', requireAuth, content.updatePost);
router.delete('/posts/:id', requireAuth, content.deletePost);

router.get('/projects', content.listProjects);
router.post('/projects', requireAuth, content.createProject);
router.put('/projects/:id', requireAuth, content.updateProject);
router.delete('/projects/:id', requireAuth, content.deleteProject);

router.get('/opportunities', content.listOpportunities);
router.get('/opportunities/:slug', content.getOpportunity);
router.post('/opportunities', requireAuth, content.createOpportunity);
router.put('/opportunities/:id', requireAuth, content.updateOpportunity);
router.delete('/opportunities/:id', requireAuth, content.deleteOpportunity);

router.get('/settings', site.getSettings);
router.put('/settings', requireAuth, site.updateSettings);
router.get('/policies/:type', site.getPolicy);
router.put('/policies/:type', requireAuth, site.updatePolicy);

router.post('/contact', site.submitContact);
router.post('/support/conversations', chatLimiter, site.createSupportConversation);
router.get('/support/conversations/:key', chatLimiter, site.getSupportConversation);
router.post('/support/conversations/:key/messages', chatLimiter, site.addSupportVisitorMessage);
router.get('/support/admin/conversations', requireAuth, site.listSupportConversations);
router.get('/support/admin/conversations/:id', requireAuth, site.getSupportConversationAdmin);
router.post('/support/admin/conversations/:id/replies', requireAuth, site.replySupportConversation);
router.post('/project-applications', site.submitProjectApplication);
router.get('/messages', requireAuth, site.listMessages);
router.get('/project-applications', requireAuth, site.listProjectApplications);
router.patch('/project-applications/:id/status', requireAuth, site.updateProjectApplicationStatus);
router.post('/opportunity-applications',
  documentUpload.fields([{ name: 'cv', maxCount: 1 }, { name: 'application_letter', maxCount: 1 }]),
  site.submitOpportunityApplication
);
router.get('/opportunity-applications', requireAuth, site.listOpportunityApplications);
router.patch('/opportunity-applications/:id/status', requireAuth, site.updateOpportunityApplicationStatus);
router.get('/dashboard/stats', requireAuth, site.dashboardStats);
router.post('/chat', chatLimiter, chat.chat);

router.post('/upload-video', requireAuth, videoUpload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No video uploaded.' });
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname,
  });
});

router.post('/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
  res.status(201).json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.originalname,
  });
});

module.exports = router;
