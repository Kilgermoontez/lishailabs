import OpportunityModel from '../models/opportunityModel.js';

const ALLOWED_APPLICATION_STATUSES = ['pending', 'reviewing', 'approved', 'declined'];

export async function listOpportunityApplications(req, res) {
  try {
    const applications = await OpportunityModel.findAllApplications();
    return res.json(applications);
  } catch (error) {
    console.error('listOpportunityApplications error:', error);
    return res.status(500).json({ message: 'Unable to load opportunity applications.' });
  }
}

export async function submitOpportunityApplication(req, res) {
  try {
    const {
      opportunity_id,
      name,
      email,
      phone,
      description = '',
      cv_url: bodyCvUrl,
      application_letter_url: bodyLetterUrl,
    } = req.body;

    if (!opportunity_id) {
      return res.status(400).json({ message: 'Opportunity ID is required.' });
    }
    if (!name || !String(name).trim() || !email || !String(email).trim() || !phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'Name, email, and phone are required.' });
    }

    const cvFile = req.files?.cv?.[0];
    const letterFile = req.files?.application_letter?.[0];

    const cv_url = cvFile ? `/uploads/applications/${cvFile.filename}` : (bodyCvUrl || '');
    const application_letter_url = letterFile
      ? `/uploads/applications/${letterFile.filename}`
      : (bodyLetterUrl || '');

    if (!cv_url || !application_letter_url) {
      return res.status(400).json({ message: 'Both CV and application letter are required.' });
    }

    const result = await OpportunityModel.createApplicationWithLimitCheck({
      opportunity_id: Number(opportunity_id),
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      description: String(description || '').trim(),
      cv_url,
      application_letter_url,
    });

    return res.status(201).json({
      message: 'Application submitted successfully.',
      ...result,
    });
  } catch (error) {
    console.error('submitOpportunityApplication error:', error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      message: error.statusCode ? error.message : 'Unable to submit application.',
    });
  }
}

export async function updateOpportunityApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid application status.' });
    }

    const updated = await OpportunityModel.updateApplicationStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: 'Opportunity application not found.' });
    }

    // Hook your existing Nodemailer helper here if you send emails on 'approved' or 'declined':
    // if (status === 'approved' || status === 'declined') {
    //   await sendOpportunityStatusEmail(updated);
    // }

    return res.json(updated);
  } catch (error) {
    console.error('updateOpportunityApplicationStatus error:', error);
    return res.status(500).json({ message: 'Unable to update application status.' });
  }
}