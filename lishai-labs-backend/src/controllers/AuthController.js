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

module.exports = { login, verifyOtp, me, updatePassword, updateProfile };

