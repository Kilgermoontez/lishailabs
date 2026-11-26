import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { API, absoluteAssetUrl } from '../../shared/site';
import PasswordInput from '../../shared/PasswordInput';

export function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  
  useEffect(() => {
    fetch(`${API}/settings`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : {})
      .then(setSettings)
      .catch(() => {});
  }, []);
  
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      if (data.otpRequired) {
        setOtpEmail(data.email);
        setError('');
        return;
      }
      localStorage.setItem('lishai_token', data.token);
      localStorage.setItem('lishai_admin', JSON.stringify(data.admin));
      navigate(data.admin.must_reset_password ? '/admin/change-password' : '/admin');
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  };
  
  const verify = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, code: otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('lishai_token', data.token);
      localStorage.setItem('lishai_admin', JSON.stringify(data.admin));
      navigate(data.admin.must_reset_password ? '/admin/change-password' : '/admin');
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  };

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setError('');
      setResetStep(2);
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  };

  const submitResetCode = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResetStep(3);
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    setError('');
    if (resetPassword !== resetConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword: resetPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResetMode(false);
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setResetPassword('');
      setResetConfirm('');
      setError('Password reset successfully. You can now log in with your new password.');
    } catch (error) { setError(error.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-art">
          <Link className="brand" to="/"><span className="brand-mark"><Sparkles size={18} /></span><span>Lishai Labs</span></Link>
          {settings.company_logo ? (
            <img className="login-art-bg" src={absoluteAssetUrl(settings.company_logo)} alt="Company logo" />
          ) : null}
        </div>
        {resetMode
          ? resetStep === 1
            ? <form className="login-form" onSubmit={requestPasswordReset}><div className="login-heading"><span>Password reset</span><h2>Forgot your password?</h2></div><p>Enter your email address and we'll send you a code to reset your password.</p><label>Email address<input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={loading} /></label>{error && <p className={error.includes('successfully') ? 'form-success' : 'form-error'}>{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset code'} {!loading && <ArrowRight size={18} />}</button><button type="button" className="story-button" onClick={() => { setResetMode(false); setError(''); }} disabled={loading}>← Back to login</button></form>
            : resetStep === 2
              ? <form className="login-form" onSubmit={submitResetCode}><div className="login-heading"><span>Password reset</span><h2>Enter reset code</h2></div><p>We sent a 6-digit code to {resetEmail}.</p><label>Reset code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} disabled={loading} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify code'} {!loading && <ArrowRight size={18} />}</button><button type="button" className="story-button" onClick={() => { setResetStep(1); setResetCode(''); }} disabled={loading}>← Change email</button></form>
              : <form className="login-form" onSubmit={submitResetPassword}><div className="login-heading"><span>Password reset</span><h2>Create new password</h2></div><label className="password-field-label">New password<PasswordInput required minLength={8} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="At least 8 characters" /></label><label className="password-field-label">Confirm password<PasswordInput required minLength={8} value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} placeholder="Confirm your password" /></label>{error && <p className={error.includes('successfully') ? 'form-success' : 'form-error'}>{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'} {!loading && <ArrowRight size={18} />}</button><button type="button" className="story-button" onClick={() => { setResetMode(false); setResetStep(1); setError(''); }} disabled={loading}>← Back to login</button></form>
          : otpEmail
            ? <form className="login-form" onSubmit={verify}><div className="login-heading"><span>Email verification</span><h2>Enter your OTP</h2></div><p>We sent a 6-digit code to {otpEmail}.</p><label>Verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} disabled={loading} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify and sign in'} {!loading && <ArrowRight size={18} />}</button><button type="button" className="story-button" onClick={() => { setOtpEmail(''); setOtp(''); }} disabled={loading}>← Use another account</button></form>
            : <form className="login-form" onSubmit={submit}><div className="login-heading"><span>Admin console</span><h2>Welcome back</h2></div><label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={loading} /></label><label className="password-field-label">Password<PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Continue'} {!loading && <ArrowRight size={18} />}</button><button type="button" className="story-button" onClick={() => setResetMode(true)} disabled={loading}>Forgot password?</button><Link to="/">← Back to website</Link></form>}
      </div>
      <style>{`
        .login-page .login-art {
          position: relative;
          overflow: hidden;
        }
        .login-page .login-art .login-art-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          z-index: 1;
          pointer-events: none;
        }
        .login-page .login-art .brand {
          position: relative;
          z-index: 2;
        }
        .login-form .password-field-label > * {
          position: relative !important;
          display: flex !important;
          align-items: center !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .login-form .password-field-label input {
          width: 100% !important;
          flex: 1 1 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          padding-right: 44px !important;
        }
        .login-form .password-field-label button {
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 2 !important;
          margin: 0 !important;
        }
      `}</style>
    </>
  );
}