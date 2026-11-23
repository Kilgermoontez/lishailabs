const pool = require('../config/database');
const { sendMail } = require('../services/mailer');
const crypto = require('crypto');

const getSettings = async (req, res) => {
  const [rows] = await pool.execute('SELECT setting_key, setting_value FROM site_settings');
  res.json(Object.fromEntries(rows.map((row) => [row.setting_key, row.setting_value])));
};

const updateSettings = async (req, res) => {
  const entries = Object.entries(req.body).filter(([key]) => /^[a-zA-Z0-9_.-]+$/.test(key));
  for (const [key, value] of entries) {
    await pool.execute(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)',
      [key, String(value)]
    );
  }
  res.json({ message: 'Settings saved.' });
};

const getPolicy = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM policies WHERE policy_type = ? LIMIT 1',
    [req.params.type]
  );
  if (!rows[0]) return res.json({ title: req.params.type, content: '', updated_at: null });
  res.json(rows[0]);
};

const updatePolicy = async (req, res) => {
  const { title, content } = req.body;
  await pool.execute(
    `INSERT INTO policies (policy_type, title, content, updated_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), updated_at=NOW()`,
    [req.params.type, title || req.params.type, content || '']
  );
  res.json({ message: 'Policy updated.' });
};

const submitContact = async (req, res) => {
  const { name, email, company, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Name, email and message are required.' });
  await pool.execute(
    'INSERT INTO contact_messages (name, email, company, subject, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, company || '', subject || 'Website enquiry', message]
  );
  await sendMail({
    to: process.env.SMTP_USER,
    subject: subject || 'Website support request',
    text: `New support request from ${name} (${email})\n\n${message}`,
  });
  await sendMail({
    to: email,
    subject: 'We received your Lish AI Labs support request',
    text: `Hi ${name},\n\nWe received your request and a member of our team will get back to you.\n\nLish AI Labs`,
  });
  res.status(201).json({ message: 'Thanks. Our team will be in touch soon.' });
};

const submitProjectApplication = async (req, res) => {
  const { name, email, company, projectType, budget, timeline, message } = req.body;
  if (!name || !email || !projectType || !message) {
    return res.status(400).json({ message: 'Name, email, project type and project brief are required.' });
  }
  const [result] = await pool.execute(
    `INSERT INTO project_applications
      (name, email, company, project_type, budget, timeline, brief_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, email, company || '', projectType, budget || '', timeline || '', message]
  );
  await sendMail({
    to: email,
    subject: 'We received your Lish AI Labs project application',
    text: `Hi ${name},\n\nWe received your application for ${projectType}. Our team will review it and notify you of the decision by email.\n\nLish AI Labs`,
    html: `<p>Hi ${name},</p><p>We received your application for <strong>${projectType}</strong>.</p><p>Our team will review it and notify you of the decision by email.</p><p>Lish AI Labs</p>`,
  });
  await sendMail({
    to: process.env.SMTP_USER,
    subject: `New project application: ${projectType}`,
    text: `A new project application was submitted by ${name} (${email}). Application ID: ${result.insertId}`,
  });
  res.status(201).json({ message: 'Your project application has been received. Our team will contact you soon.' });
};

const listProjectApplications = async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM project_applications ORDER BY created_at DESC LIMIT 100'
  );
  res.json(rows);
};

const updateProjectApplicationStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!['new', 'reviewing', 'approved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid application status.' });
    }
    const [rows] = await pool.execute('SELECT * FROM project_applications WHERE id=? LIMIT 1', [req.params.id]);
    const application = rows[0];
    if (!application) return res.status(404).json({ message: 'Application not found.' });

    await pool.execute('UPDATE project_applications SET status=? WHERE id=?', [status, req.params.id]);
    const approved = status === 'approved';
    const declined = status === 'declined';
    if (approved || declined) {
      await sendMail({
        to: application.email,
        subject: approved ? 'Your Lish AI Labs project application was approved' : 'Update on your Lish AI Labs project application',
        text: approved
          ? `Hi ${application.name},\n\nYour project application for ${application.project_type} has been approved. Our team will contact you with next steps.\n\nLish AI Labs`
          : `Hi ${application.name},\n\nYour project application for ${application.project_type} has been reviewed and we cannot proceed at this time. We appreciate your interest in Lish AI Labs.`,
        html: approved
          ? `<p>Hi ${application.name},</p><p>Your project application for <strong>${application.project_type}</strong> has been <strong>approved</strong>.</p><p>Our team will contact you with next steps.</p><p>Lish AI Labs</p>`
          : `<p>Hi ${application.name},</p><p>Your project application for <strong>${application.project_type}</strong> has been reviewed and we cannot proceed at this time.</p><p>We appreciate your interest in Lish AI Labs.</p>`,
      });
    }
    res.json({ message: `Application ${status}.`, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update the application.' });
  }
};

const submitOpportunityApplication = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { opportunityId, name, email, phone, description } = req.body;
    if (!opportunityId || !name || !email || !phone || !description) {
      return res.status(400).json({ message: 'Opportunity, name, email, phone and description are required.' });
    }
    const cv = req.files?.cv?.[0];
    const letter = req.files?.application_letter?.[0];
    if (!cv || !letter) {
      return res.status(400).json({ message: 'Both your CV and application letter are required.' });
    }
    await connection.beginTransaction();
    const [opportunities] = await connection.execute(
      'SELECT id, title, application_limit FROM opportunities WHERE id=? AND status=? LIMIT 1 FOR UPDATE',
      [opportunityId, 'published']
    );
    if (!opportunities[0]) {
      await connection.rollback();
      return res.status(404).json({ message: 'This opportunity is not available.' });
    }
    if (opportunities[0].application_limit !== null) {
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) AS count FROM opportunity_applications WHERE opportunity_id=?',
        [opportunityId]
      );
      if (Number(countRows[0].count) >= Number(opportunities[0].application_limit)) {
        await connection.rollback();
        return res.status(409).json({ message: 'The application limit for this opportunity has been reached.' });
      }
    }

    const cvUrl = `/uploads/${cv.filename}`;
    const letterUrl = `/uploads/${letter.filename}`;
    await connection.execute(
      `INSERT INTO opportunity_applications
       (opportunity_id, name, email, phone, description, cv_url, application_letter_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [opportunityId, name.trim(), email.trim().toLowerCase(), phone.trim(), description.trim(), cvUrl, letterUrl]
    );
    await connection.commit();
    await sendMail({
      to: email,
      subject: `Application received: ${opportunities[0].title}`,
      text: `Hi ${name},\n\nWe received your application for ${opportunities[0].title}. Our team will review it and contact you by email.\n\nLish AI Labs`,
    });
    await sendMail({
      to: process.env.SMTP_USER,
      subject: `New opportunity application: ${opportunities[0].title}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${description}`,
    });
    res.status(201).json({ message: 'Your application was submitted successfully.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Unable to submit your application.' });
  } finally {
    connection.release();
  }
};

const listOpportunityApplications = async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT oa.*, o.title AS opportunity_title
     FROM opportunity_applications oa
     JOIN opportunities o ON o.id=oa.opportunity_id
     ORDER BY oa.created_at DESC LIMIT 200`
  );
  res.json(rows);
};

const updateOpportunityApplicationStatus = async (req, res) => {
  try {
    const status = String(req.body.status || '').toLowerCase();
    if (!['new', 'reviewing', 'approved', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid application status.' });
    }
    const [rows] = await pool.execute(
      `SELECT oa.*, o.title AS opportunity_title
       FROM opportunity_applications oa
       JOIN opportunities o ON o.id=oa.opportunity_id
       WHERE oa.id=? LIMIT 1`,
      [req.params.id]
    );
    const application = rows[0];
    if (!application) return res.status(404).json({ message: 'Application not found.' });
    await pool.execute('UPDATE opportunity_applications SET status=? WHERE id=?', [status, req.params.id]);
    if (status === 'approved' || status === 'declined') {
      const approved = status === 'approved';
      await sendMail({
        to: application.email,
        subject: approved ? `Application approved: ${application.opportunity_title}` : `Application update: ${application.opportunity_title}`,
        text: approved
          ? `Hi ${application.name},\n\nYour application for ${application.opportunity_title} has been approved. Our team will contact you with next steps.\n\nLish AI Labs`
          : `Hi ${application.name},\n\nYour application for ${application.opportunity_title} was reviewed and we cannot proceed at this time.\n\nLish AI Labs`,
      });
    }
    res.json({ message: `Application ${status}.`, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update the application.' });
  }
};

const createSupportConversation = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required.' });
    }
    const conversationKey = crypto.randomBytes(24).toString('hex');
    const [result] = await pool.execute(
      'INSERT INTO support_conversations (conversation_key, name, email, status) VALUES (?, ?, ?, ?)',
      [conversationKey, name.trim(), email.trim().toLowerCase(), 'open']
    );
    await pool.execute(
      'INSERT INTO support_messages (conversation_id, sender, message) VALUES (?, ?, ?)',
      [result.insertId, 'visitor', message.trim()]
    );
    await pool.execute(
      'UPDATE support_conversations SET last_message_at=NOW() WHERE id=?',
      [result.insertId]
    );
    await sendMail({
      to: process.env.SMTP_USER,
      subject: 'New human support chat request',
      text: `New support request from ${name} (${email}).\n\n${message}`,
    });
    await sendMail({
      to: email,
      subject: 'Your Lish AI Labs support conversation is open',
      text: `Hi ${name},\n\nWe received your message and our team will reply here and by email.\n\nLish AI Labs`,
    });
    res.status(201).json({ conversationKey, message: 'Your support conversation was sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to start a support conversation.' });
  }
};

const getSupportConversation = async (req, res) => {
  try {
    const [conversations] = await pool.execute(
      'SELECT id, conversation_key, name, email, status, created_at, updated_at FROM support_conversations WHERE conversation_key=? LIMIT 1',
      [req.params.key]
    );
    const conversation = conversations[0];
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    const [messages] = await pool.execute(
      'SELECT id, sender, message, created_at FROM support_messages WHERE conversation_id=? ORDER BY created_at ASC',
      [conversation.id]
    );
    res.json({ conversation, messages });
  } catch (_) {
    res.status(500).json({ message: 'Unable to load the conversation.' });
  }
};

const addSupportVisitorMessage = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Message is required.' });
    const [conversations] = await pool.execute(
      'SELECT * FROM support_conversations WHERE conversation_key=? LIMIT 1',
      [req.params.key]
    );
    const conversation = conversations[0];
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    await pool.execute(
      'INSERT INTO support_messages (conversation_id, sender, message) VALUES (?, ?, ?)',
      [conversation.id, 'visitor', message]
    );
    await pool.execute(
      'UPDATE support_conversations SET status=?, last_message_at=NOW() WHERE id=?',
      ['open', conversation.id]
    );
    await sendMail({
      to: process.env.SMTP_USER,
      subject: `New reply in support conversation - ${conversation.name}`,
      text: `${conversation.name} (${conversation.email}) replied:\n\n${message}`,
    });
    res.status(201).json({ message: 'Reply sent.' });
  } catch (_) {
    res.status(500).json({ message: 'Unable to send your reply.' });
  }
};

const listSupportConversations = async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT sc.*,
      (SELECT sm.message FROM support_messages sm WHERE sm.conversation_id=sc.id ORDER BY sm.created_at DESC LIMIT 1) AS latest_message,
      (SELECT sm.sender FROM support_messages sm WHERE sm.conversation_id=sc.id ORDER BY sm.created_at DESC LIMIT 1) AS latest_sender
     FROM support_conversations sc
     ORDER BY sc.last_message_at DESC LIMIT 200`
  );
  res.json(rows);
};

const getSupportConversationAdmin = async (req, res) => {
  const [conversations] = await pool.execute('SELECT * FROM support_conversations WHERE id=? LIMIT 1', [req.params.id]);
  if (!conversations[0]) return res.status(404).json({ message: 'Conversation not found.' });
  const [messages] = await pool.execute(
    'SELECT * FROM support_messages WHERE conversation_id=? ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json({ conversation: conversations[0], messages });
};

const replySupportConversation = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Reply message is required.' });
    const [conversations] = await pool.execute('SELECT * FROM support_conversations WHERE id=? LIMIT 1', [req.params.id]);
    const conversation = conversations[0];
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    await pool.execute(
      'INSERT INTO support_messages (conversation_id, sender, message) VALUES (?, ?, ?)',
      [conversation.id, 'admin', message]
    );
    await pool.execute(
      'UPDATE support_conversations SET status=?, last_message_at=NOW() WHERE id=?',
      [req.body.status || 'pending', conversation.id]
    );
    await sendMail({
      to: conversation.email,
      subject: `Reply from Lish AI Labs support`,
      text: `Hi ${conversation.name},\n\n${message}\n\nLish AI Labs Support`,
    });
    res.status(201).json({ message: 'Reply sent to the visitor.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to send the reply.' });
  }
};

const listMessages = async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100');
  res.json(rows);
};

const dashboardStats = async (req, res) => {
  const [postCountResult, projectCountResult, messageCountResult, publishedPostsResult, publishedProjectsResult] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS count FROM posts'),
    pool.execute('SELECT COUNT(*) AS count FROM projects'),
    pool.execute('SELECT COUNT(*) AS count FROM contact_messages'),
    pool.execute("SELECT COUNT(*) AS count FROM posts WHERE status='published'"),
    pool.execute("SELECT COUNT(*) AS count FROM projects WHERE status='published'"),
  ]);
  const postCount = postCountResult[0][0].count;
  const projectCount = projectCountResult[0][0].count;
  const messageCount = messageCountResult[0][0].count;
  const publishedPosts = publishedPostsResult[0][0].count;
  const publishedProjects = publishedProjectsResult[0][0].count;
  res.json({
    posts: postCount,
    projects: projectCount,
    messages: messageCount,
    publishedPosts,
    publishedProjects,
  });
};

module.exports = {
  getSettings,
  updateSettings,
  getPolicy,
  updatePolicy,
  submitContact,
  submitProjectApplication,
  listMessages,
  listProjectApplications,
  updateProjectApplicationStatus,
  submitOpportunityApplication,
  listOpportunityApplications,
  updateOpportunityApplicationStatus,
  createSupportConversation,
  getSupportConversation,
  addSupportVisitorMessage,
  listSupportConversations,
  getSupportConversationAdmin,
  replySupportConversation,
  dashboardStats,
};

