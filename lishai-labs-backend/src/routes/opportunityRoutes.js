import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  listOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from '../controllers/opportunityController.js';
import {
  listOpportunityApplications,
  submitOpportunityApplication,
  updateOpportunityApplicationStatus,
} from '../controllers/opportunityApplicationController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const uploadDir = path.resolve('uploads/applications');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
});

// Opportunities
router.get('/opportunities', listOpportunities);
router.get('/opportunities/:id', getOpportunity);
router.post('/opportunities', requireAdmin, createOpportunity);
router.put('/opportunities/:id', requireAdmin, updateOpportunity);
router.delete('/opportunities/:id', requireAdmin, deleteOpportunity);

// Opportunity Applications
router.get('/opportunity-applications', requireAdmin, listOpportunityApplications);
router.post(
  '/opportunity-applications',
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'application_letter', maxCount: 1 },
  ]),
  submitOpportunityApplication
);
router.patch('/opportunity-applications/:id/status', requireAdmin, updateOpportunityApplicationStatus);

export default router;