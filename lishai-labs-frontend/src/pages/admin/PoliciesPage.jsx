import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, authHeaders, notifyAdmin } from '../../shared/site';

export function PoliciesPage() {
  const [active, setActive] = useState('privacy');
  const [form, setForm] = useState({ title: '', content: '' });
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch(`${API}/policies/${active}`)
      .then((response) => response.ok ? response.json() : {})
      .then((data) => setForm({ title: data.title || '', content: data.content || '' }))
      .catch(() => setForm({ title: '', content: '' }));
  }, [active]);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved('Saving policy...');
    try {
      const response = await fetch(`${API}/policies/${active}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to save policy.');
      setSaved('Policy updated successfully.');
      notifyAdmin('Policy updated successfully.');
    } catch (error) {
      setSaved(error.message);
      notifyAdmin(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  return <><div className="admin-page-heading"><div><span>Legal</span><h1>Policies & terms</h1></div></div><div className="settings-layout"><aside className="settings-nav">{[['privacy', 'Privacy Policy'], ['terms', 'Terms & Conditions'], ['cookies', 'Cookie Policy']].map(([key, label]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}><FileText /> {label}</button>)}</aside><form className="settings-form" onSubmit={save}><h2>Policy content</h2><label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Content<textarea rows={16} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label>{saved && <p className="form-status">{saved}</p>}  <button className={`admin-primary ${saving ? 'loading' : ''}`} type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save policy'}</button></form></div></>;
}