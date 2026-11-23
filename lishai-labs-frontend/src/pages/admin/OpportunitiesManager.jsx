import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders, notifyAdmin } from '../../shared/site';

export function OpportunitiesManager() {
  const empty = { title: '', slug: '', description: '', location: '', type: 'General', work_mode: 'On-site', image: '', status: 'draft', application_limit: '' };
  const [items, setItems] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [uploadStatus, setUploadStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const load = () => fetch(`${API}/opportunities?limit=100`, { headers: authHeaders() }).then((r) => r.json()).then((d) => setItems(d.rows || [])).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const getRemainingApplications = (item) => {
    if (item.application_limit === null || item.application_limit === undefined || item.application_limit === '') {
      return null;
    }
    if (item.remaining_applications !== undefined && item.remaining_applications !== null) {
      return Math.max(0, Number(item.remaining_applications));
    }
    return Math.max(0, Number(item.application_limit) - Number(item.applications_count ?? 0));
  };
  const openEditor = (item = null) => {
    setEditing(item);
    setForm(item ? { ...empty, ...item, application_limit: item.application_limit ?? '' } : empty);
    setUploadStatus('');
    setShowEditor(true);
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const parsedLimit =
        form.application_limit === '' || form.application_limit === null || form.application_limit === undefined
          ? null
          : Number(form.application_limit);
      if (parsedLimit !== null && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
        throw new Error('Application limit must be a whole number of at least 1.');
      }
      const payload = { ...form, application_limit: parsedLimit };
      const response = await fetch(`${API}/opportunities${editing ? `/${editing.id}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to save opportunity.');
      setShowEditor(false);
      setEditing(null);
      load();
      notifyAdmin(editing ? 'Opportunity updated successfully.' : 'Opportunity created successfully.');
    } catch (error) {
      notifyAdmin(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return;
    await fetch(`${API}/opportunities/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  };
  const uploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploadStatus('Uploading image...');
    const body = new FormData();
    body.append('image', file);
    try {
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload image.');
      setForm((current) => ({ ...current, image: data.url }));
      setUploadStatus('Image uploaded. Save the opportunity to publish it.');
    } catch (error) {
      setUploadStatus(error.message);
    } finally {
      event.target.value = '';
    }
  };
  return (
    <>
      <div className="admin-page-heading"><div><span>Careers & partnerships</span><h1>Opportunities</h1></div><button className="admin-primary" onClick={() => openEditor()}><Plus /> Add opportunity</button></div>
      <div className="content-table"><div className="table-header"><span>Title</span><span>Type</span><span>Status</span><span>Actions</span></div>{items.length === 0 ? <div className="table-empty">No opportunities yet.</div> : items.map((item) => {
        const remaining = getRemainingApplications(item);
        return (
          <div className="table-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <small>
                {item.location || 'Flexible location'} · {item.work_mode || 'On-site'}
                {remaining !== null
                  ? ` · ${remaining} of ${item.application_limit} applications remaining`
                  : ' · Unlimited applications'}
              </small>
            </div>
            <span>{item.type}</span>
            <b className={`status-pill ${item.status}`}>{item.status}</b>
            <div className="row-actions"><button onClick={() => openEditor(item)}>Edit</button><button onClick={() => remove(item.id)} aria-label="Delete"><Trash2 /></button></div>
          </div>
        );
      })}</div>
      {showEditor && (
        <div className="editor-overlay">
          <form className="editor-panel" onSubmit={save}>
            <div className="editor-header">
              <div><span>{editing ? 'Edit' : 'Create'} opportunity</span><h2>{editing ? editing.title : 'New opportunity'}</h2></div>
              <button type="button" onClick={() => setShowEditor(false)}><X /></button>
            </div>
            <div className="editor-body">
              <label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label>Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
              <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>General</option><option>Job</option><option>Internship</option><option>Partnership</option><option>Tender</option><option>Training</option></select></label>
              <label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
              <label>Work mode<select value={form.work_mode || 'On-site'} onChange={(e) => setForm({ ...form, work_mode: e.target.value })}><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
              <label>Application limit (leave blank for unlimited)<input type="number" min="1" step="1" placeholder="e.g. 50" value={form.application_limit} onChange={(e) => setForm({ ...form, application_limit: e.target.value })} /></label>
              <label>Description<textarea rows={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select></label>
              <label className="upload-label">
                Opportunity image
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={uploadImage} />
                <span><Upload /> {uploadStatus === 'Uploading image...' ? 'Uploading...' : 'Upload image'}</span>
              </label>
              {form.image && <div className="admin-image-preview"><img src={absoluteAssetUrl(form.image)} alt="Opportunity preview" /></div>}
              {uploadStatus && <p className="form-status">{uploadStatus}</p>}
            </div>
            <div className="editor-footer"><button type="button" onClick={() => setShowEditor(false)} disabled={saving}>Cancel</button><button type="submit" className={`admin-primary ${saving ? 'loading' : ''}`} disabled={saving}>{saving ? 'Saving...' : 'Save opportunity'}</button></div>
          </form>
        </div>
      )}
    </>
  );
}