const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AdminModel = require('../models/AdminModel');
const pool = require('../config/database');
const { sendMail } = require('../services/mailer');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    if (email.toLowerCase() !== 'masakarobert69@gmail.com') {
      return res.status(403).json({ message: 'This account is not authorized to manage Lishai Labs.' });
    }

    const admin = await AdminModel.findByEmail(email.toLowerCase());
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    await pool.execute('UPDATE admin_otps SET consumed=1 WHERE admin_id=? AND consumed=0', [admin.id]);
    await pool.execute(
      'INSERT INTO admin_otps (admin_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [admin.id, codeHash]
    );
    await sendMail({
      to: admin.email,
      subject: 'Lish AI Labs admin login verification',
      text: `Your administrator verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your administrator verification code is:</p><h2 style="letter-spacing:6px">${code}</h2><p>It expires in 10 minutes.</p>`,
    });
    res.json({ otpRequired: true, email: admin.email, message: 'A verification code was sent to your administrator email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to sign in.' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and verification code are required.' });
    const normalizedEmail = email.toLowerCase();
    const admin = await AdminModel.findByEmail(normalizedEmail);
    if (!admin) return res.status(401).json({ message: 'Invalid verification request.' });

    const codeHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    const [rows] = await pool.execute(
      `SELECT * FROM admin_otps
       WHERE admin_id=? AND consumed=0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [admin.id]
    );
    const otp = rows[0];
    if (!otp) return res.status(400).json({ message: 'The verification code has expired. Please sign in again.' });
    if (otp.attempts >= 5) return res.status(429).json({ message: 'Too many incorrect attempts. Please sign in again.' });
    if (otp.code_hash !== codeHash) {
      await pool.execute('UPDATE admin_otps SET attempts=attempts+1 WHERE id=?', [otp.id]);
      return res.status(401).json({ message: 'Invalid verification code.' });
    }

    await pool.execute('UPDATE admin_otps SET consumed=1 WHERE id=?', [otp.id]);
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'lishai-development-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    // Log the login activity
    await AdminModel.logActivity(
      admin.id,
      'LOGIN',
      `Admin logged in successfully`,
      { email: admin.email },
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );
    
    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, avatar: admin.avatar },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to verify the login code.' });
  }
};

const me = async (req, res) => {
  try {
    res.json({ admin: await AdminModel.findById(req.admin.id) });
  } catch (_) {
    res.status(500).json({ message: 'Unable to load account.' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords are required.' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password must be at least 8 characters.' });

    const admin = await AdminModel.findByEmail(req.admin.email);
    if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    await AdminModel.updatePassword(admin.id, await bcrypt.hash(newPassword, 12));
    res.json({ message: 'Password updated successfully.' });
  } catch (_) {
    res.status(500).json({ message: 'Unable to update password.' });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const admin = await AdminModel.findByEmail(email.toLowerCase());
    if (!admin) {
      return res.status(400).json({ message: 'If an account exists with this email, a reset code will be sent.' });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    
    await pool.execute('UPDATE admin_password_resets SET consumed=1 WHERE admin_id=? AND consumed=0', [admin.id]);
    await pool.execute(
      'INSERT INTO admin_password_resets (admin_id, code_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))',
      [admin.id, codeHash]
    );
    
    await sendMail({
      to: admin.email,
      subject: 'Reset your Lishai Labs admin password',
      text: `Your password reset code is ${code}. It expires in 15 minutes. Do not share this code with anyone.`,
      html: `<p>Your password reset code is:</p><h2 style="letter-spacing:6px">${code}</h2><p>It expires in 15 minutes. Do not share this code with anyone.</p>`,
    });
    
    res.json({ message: 'If an account exists with this email, a reset code will be sent.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to process password reset request.' });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and reset code are required.' });
    
    const admin = await AdminModel.findByEmail(email.toLowerCase());
    if (!admin) return res.status(400).json({ message: 'Invalid reset request.' });

    const codeHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    const [rows] = await pool.execute(
      `SELECT * FROM admin_password_resets
       WHERE admin_id=? AND consumed=0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [admin.id]
    );
    
    const reset = rows[0];
    if (!reset) return res.status(400).json({ message: 'The reset code has expired. Please request a new one.' });
    if (reset.attempts >= 5) return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new reset code.' });
    if (reset.code_hash !== codeHash) {
      await pool.execute('UPDATE admin_password_resets SET attempts=attempts+1 WHERE id=?', [reset.id]);
      return res.status(401).json({ message: 'Invalid reset code.' });
    }

    res.json({ message: 'Reset code verified. You can now reset your password.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to verify reset code.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'Email, reset code, and new password are required.' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    
    const admin = await AdminModel.findByEmail(email.toLowerCase());
    if (!admin) return res.status(400).json({ message: 'Invalid reset request.' });

    const codeHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');
    const [rows] = await pool.execute(
      `SELECT * FROM admin_password_resets
       WHERE admin_id=? AND consumed=0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [admin.id]
    );
    
    const reset = rows[0];
    if (!reset) return res.status(400).json({ message: 'The reset code has expired. Please request a new one.' });
    if (reset.code_hash !== codeHash) return res.status(401).json({ message: 'Invalid reset code.' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await AdminModel.updatePassword(admin.id, passwordHash);
    await pool.execute('UPDATE admin_password_resets SET consumed=1 WHERE id=?', [reset.id]);
    
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to reset password.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });
    await AdminModel.updateProfile(req.admin.id, { name, email: email.toLowerCase() });
    res.json({ admin: await AdminModel.findById(req.admin.id), message: 'Profile updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update profile.' });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    await AdminModel.updateAvatar(req.admin.id, avatarUrl);
    
    // Log the activity
    await AdminModel.logActivity(
      req.admin.id,
      'AVATAR_UPLOADED',
      'Admin uploaded a new profile picture',
      { filename: req.file.filename, size: req.file.size },
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent')
    );
    
    res.json({ 
      avatar: avatarUrl, 
      admin: await AdminModel.findById(req.admin.id),
      message: 'Profile picture updated successfully.' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update profile picture.' });
  }
};

const getActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await AdminModel.getActivityLogs(null, limit, offset);
    const total = await AdminModel.getActivityLogCount();
    
    res.json({ 
      logs, 
      total, 
      limit, 
      offset,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch activity logs.' });
  }
};

const getMyActivityLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await AdminModel.getActivityLogs(req.admin.id, limit, offset);
    const total = await AdminModel.getActivityLogCount(req.admin.id);
    
    res.json({ 
      logs, 
      total, 
      limit, 
      offset,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to fetch your activity logs.' });
  }
};

module.exports = { login, verifyOtp, me, updatePassword, requestPasswordReset, verifyResetCode, resetPassword, updateProfile, updateAvatar, getActivityLogs, getMyActivityLogs };

