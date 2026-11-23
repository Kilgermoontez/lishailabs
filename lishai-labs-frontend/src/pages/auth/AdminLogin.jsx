import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';
import { API } from '../../shared/site';

export function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'masakarobert69@gmail.com', password: '' });
  const [otp, setOtp] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setError('');
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
      navigate('/admin');
    } catch (error) { setError(error.message); }
  };
  const verify = async (event) => {
    event.preventDefault();
    setError('');
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
      navigate('/admin');
    } catch (error) { setError(error.message); }
  };
  return <div className="login-page"><div className="login-art"><Link className="brand" to="/"><span className="brand-mark"><Sparkles size={18} /></span><span>Lishai Labs</span></Link><div><LockKeyhole /><h1>Control the intelligence.</h1><p>Secure administration for content, projects and company operations.</p></div></div>
    {otpEmail
      ? <form className="login-form" onSubmit={verify}><div className="login-heading"><span>Email verification</span><h2>Enter your OTP</h2></div><p>We sent a 6-digit code to {otpEmail}.</p><label>Verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" type="submit">Verify and sign in <ArrowRight size={18} /></button><button type="button" className="story-button" onClick={() => { setOtpEmail(''); setOtp(''); }}>← Use another account</button></form>
      : <form className="login-form" onSubmit={submit}><div className="login-heading"><span>Admin console</span><h2>Welcome back</h2></div><label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-primary" type="submit">Continue <ArrowRight size={18} /></button><Link to="/">← Back to website</Link></form>}
  </div>;
}