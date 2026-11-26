const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AdminModel = require('../src/models/AdminModel');
const pool = require('../src/config/database');
const mailer = require('../src/services/mailer');
const { requireAuth } = require('../src/middleware/auth');

test('new administrators need email verification and must change password before admin access', async t => {
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret-for-admin-access';
  t.after(() => {
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });
  let mustReset = 1;
  let passwordHash = await bcrypt.hash('admin@example.test', 4);
  const admin = () => ({ id: 1, name: 'Admin', email: 'admin@example.test', role: 'admin', must_reset_password: mustReset, password_hash: passwordHash });
  t.mock.method(AdminModel, 'findByEmail', async email => email === 'admin@example.test' ? admin() : null);
  t.mock.method(AdminModel, 'findById', async () => admin());
  t.mock.method(AdminModel, 'updatePassword', async (_id, hash) => { passwordHash = hash; mustReset = 0; });
  t.mock.method(AdminModel, 'logActivity', async () => {});
  let otpHash;
  t.mock.method(pool, 'execute', async (sql, params) => {
    if (sql.startsWith('INSERT INTO admin_otps')) otpHash = params[1];
    if (sql.includes('SELECT * FROM admin_otps')) return [[{ id: 2, code_hash: otpHash, attempts: 0 }]];
    return [[]];
  });
  let code;
  t.mock.method(mailer, 'sendMail', async message => {
    code = message.text.match(/\b\d{6}\b/)[0];
    return {};
  });
  const auth = require('../src/controllers/AuthController');
  const app = express();
  app.use(express.json());
  app.post('/auth/login', auth.login);
  app.post('/auth/verify-otp', auth.verifyOtp);
  app.put('/auth/password', requireAuth, auth.updatePassword);
  app.get('/auth/me', requireAuth, auth.me);
  app.get('/posts', requireAuth, (_req, res) => res.json({ ok: true }));
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, method, body, token) => fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const login = await request('/auth/login', 'POST', { email: 'ADMIN@example.test', password: 'admin@example.test' });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).otpRequired, true);
  const verify = await request('/auth/verify-otp', 'POST', { email: 'admin@example.test', code });
  const session = await verify.json();
  assert.equal(session.admin.must_reset_password, 1);
  assert.equal(jwt.verify(session.token, process.env.JWT_SECRET).id, 1);
  assert.equal((await request('/posts', 'GET', null, session.token)).status, 403);
  assert.equal((await request('/auth/me', 'GET', null, session.token)).status, 200);
  assert.equal((await request('/auth/password', 'PUT', { currentPassword: 'admin@example.test', newPassword: 'admin@example.test' }, session.token)).status, 400);
  assert.equal((await request('/auth/password', 'PUT', { currentPassword: 'admin@example.test', newPassword: 'a-new-secret-password' }, session.token)).status, 200);
  assert.equal((await request('/posts', 'GET', null, session.token)).status, 200);
  assert.equal(await bcrypt.compare('a-new-secret-password', passwordHash), true);
});
