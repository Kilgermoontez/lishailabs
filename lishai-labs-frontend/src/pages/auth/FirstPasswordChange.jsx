import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { API, authHeaders } from '../../shared/site';
import PasswordInput from '../../shared/PasswordInput';

export function FirstPasswordChange() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!localStorage.getItem('lishai_token')) return <Navigate to="/admin/login" replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/password`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      const admin = JSON.parse(localStorage.getItem('lishai_admin') || '{}');
      localStorage.setItem('lishai_admin', JSON.stringify({ ...admin, must_reset_password: 0 }));
      navigate('/admin', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    localStorage.removeItem('lishai_token');
    localStorage.removeItem('lishai_admin');
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-art"><Link className="brand" to="/">Lishai Labs</Link></div>
      <form className="login-form" onSubmit={submit}>
        <div className="login-heading"><span>Account security</span><h2>Change your password</h2></div>
        <p>Set a new password before accessing the admin console.</p>
        <label>Current password<PasswordInput required autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
        <label>New password<PasswordInput required minLength={8} autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
        <label>Confirm new password<PasswordInput required minLength={8} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary" disabled={loading}>{loading ? 'Updating...' : 'Update password'}</button>
        <button type="button" className="story-button" onClick={signOut} disabled={loading}>Sign out</button>
      </form>
    </div>
  );
}
