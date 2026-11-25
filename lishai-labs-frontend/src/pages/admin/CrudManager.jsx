import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Search, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders, notifyAdmin } from '../../shared/site';

export function CrudManager({ type }) {
  const isPost = type === 'posts';
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(isPost ? { title: '', slug: '', excerpt: '', content: '', category: 'AI Insights', author: 'Lishai Labs', status: 'draft', cover_image: '' } : { title: '', slug: '', summary: '', description: '', category: 'Artificial Intelligence', image: '', tags: [], status: 'published', featured: false });
  const load = useCallback(
    () => fetch(`${API}/${type}?limit=100`, { headers: authHeaders() }).then((r) => r.json()).then((d) => { const rows = d.rows || []; setItems(rows); }).catch(() => { setItems([]); }),
    [type]
  );
  useEffect(() => {
    setSearchQuery('');
    load();
  }, [load, type]);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const displayedItems = normalizedQuery
    ? items.filter((item) => [
        item.title,
        item.category,
        item.slug,
        item.status,
        item.author,
        item.excerpt,
        item.summary,
        item.description,
        Array.isArray(item.tags) ? item.tags.join(' ') : item.tags,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedQuery)))
    : items;
  const openEditor = (item = null) => {
    setEditing(item);
    setShowEditor(true);
    if (item) setForm({ ...item, tags: Array.isArray(item.tags) ? item.tags : (() => { try { return JSON.parse(item.tags || '[]'); } catch (error) { console.warn(error); return []; } })() });
  };
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = isPost ? form : { ...form, tags: typeof form.tags === 'string' ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : form.tags };
    try {
      const response = await fetch(`${API}/${type}${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Unable to save ${isPost ? 'story' : 'project'}.`);
      setShowEditor(false);
      setEditing(null);
      load();
      notifyAdmin(editing ? `${isPost ? 'Story' : 'Project'} updated successfully.` : `${isPost ? 'Story' : 'Project'} created successfully.`);
    } catch (error) {
      notifyAdmin(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id) => { if (!window.confirm('Delete this item?')) return; await fetch(`${API}/${type}/${id}`, { method: 'DELETE', headers: authHeaders() }); load(); };
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
      setForm((current) => ({ ...current, [isPost ? 'cover_image' : 'image']: data.url }));
      setUploadStatus('Image uploaded. Save the item to publish it.');
    } catch (error) {
      setUploadStatus(error.message);
    } finally {
      event.target.value = '';
    }
  };
  return <><div className="admin-page-heading"><div><span>Content</span><h1>{isPost ? 'Stories & blogs' : 'AI projects'}</h1></div><button className="admin-primary" onClick={() => { setEditing(null); setForm(isPost ? { title: '', slug: '', excerpt: '', content: '', category: 'AI Insights', author: 'Lishai Labs', status: 'draft', cover_image: '' } : { title: '', slug: '', summary: '', description: '', category: 'Artificial Intelligence', image: '', tags: [], status: 'published', featured: false }); setShowEditor(true); }}><Plus /> Add new</button></div><div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}><Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${isPost ? 'stories' : 'projects'} by title, category, slug or status...`} aria-label={`Search ${isPost ? 'stories' : 'projects'}`} style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }} />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>}</div><div className="content-table"><div className="table-header"><span>Title</span><span>Category</span><span>Status</span><span>Actions</span></div>{displayedItems.length === 0 ? <div className="table-empty">{normalizedQuery ? `No ${isPost ? 'stories' : 'projects'} match "${searchQuery}".` : `No ${isPost ? 'stories' : 'projects'} yet.`}</div> : displayedItems.map((item) => <div className="table-row" key={item.id}><div><strong>{item.title}</strong><small>{item.slug}</small></div><span>{item.category}</span><b className={`status-pill ${item.status}`}>{item.status}</b><div className="row-actions"><button onClick={() => openEditor(item)}>Edit</button><button onClick={() => remove(item.id)} aria-label="Delete"><Trash2 /></button></div></div>)}</div>{showEditor && <div className="editor-overlay"><form className="editor-panel" onSubmit={save}><div className="editor-header"><div><span>{editing ? 'Edit' : 'Create'} {isPost ? 'story' : 'project'}</span><h2>{editing ? editing.title : `New ${isPost ? 'story' : 'project'}`}</h2></div><button type="button" onClick={() => setShowEditor(false)}><X /></button></div><div className="editor-body"><label>Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Slug<input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated from title" /></label><label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>{isPost ? <><label>Author<input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label><label>Excerpt<textarea rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></label><label>Content<textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label></> : <><label>Summary<textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label><label>Description<textarea rows={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label>Tags <small>comma separated</small><input value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></label><label className="check-label"><input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured project</label></>}<label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="upload-label">Cover image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadImage} /><span><Upload /> Upload image</span></label>{uploadStatus && <p className="form-status">{uploadStatus}</p>}</div>    {((isPost && form.cover_image) || (!isPost && form.image)) && (
    <div className="admin-image-preview">
      <img src={absoluteAssetUrl(isPost ? form.cover_image : form.image)} alt="Uploaded item preview" />
    </div>
  )}
  <div className="editor-footer"><button type="button" onClick={() => setShowEditor(false)} disabled={saving}>Cancel</button><button type="submit" className={`admin-primary ${saving ? 'loading' : ''}`} disabled={saving}>{saving ? 'Saving...' : `Save ${isPost ? 'story' : 'project'}`}</button></div></form></div>}</>;
}