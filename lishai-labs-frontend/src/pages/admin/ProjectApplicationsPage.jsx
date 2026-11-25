import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Search, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders, notifyAdmin } from '../../shared/site';

export function ProjectApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const loadApplications = () => {
    fetch(`${API}/project-applications`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : [])
      .then(setApplications)
      .catch(() => setApplications([]));
  };
  useEffect(() => {
    loadApplications();
  }, []);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredApplications = normalizedQuery
    ? applications.filter((application) => [
        application.name,
        application.email,
        application.project_type,
        application.company,
        application.brief_message,
        application.budget,
        application.timeline,
        application.status,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedQuery)))
    : applications;
  const updateStatus = async (id, status) => {
    const response = await fetch(`${API}/project-applications/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (response.ok) loadApplications();
  };
  return (
    <>
      <div className="admin-page-heading"><div><span>Projects</span><h1>Project applications</h1></div></div>
      <div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search project applications by name, email, type, company or status..."
          aria-label="Search project applications"
          style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear project applications search"
            style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="message-list">
        {filteredApplications.length === 0
          ? <div className="table-empty">{normalizedQuery ? `No project applications match "${searchQuery}".` : 'No project applications yet.'}</div>
          : filteredApplications.map((application) => (
            <article key={application.id}>
              <div className="message-avatar">{application.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="message-head"><strong>{application.name}</strong><span>{new Date(application.created_at).toLocaleString()}</span></div>
                <b>{application.project_type} · {application.company || 'Independent'}</b>
                <p>{application.brief_message}</p>
                <p className="application-meta">Budget: {application.budget || 'Not specified'} · Timeline: {application.timeline || 'Flexible'}</p>
                <a href={`mailto:${application.email}`}>{application.email}</a>
                <div className="application-actions">
                  <span className={`status-badge status-${application.status}`}>{application.status}</span>
                  {application.status !== 'approved' && <button type="button" className="admin-primary" onClick={() => updateStatus(application.id, 'approved')}>Approve & email</button>}
                  {application.status !== 'declined' && <button type="button" className="admin-danger" onClick={() => updateStatus(application.id, 'declined')}>Disapprove & email</button>}
                </div>
              </div>
            </article>
          ))}
      </div>
    </>
  );
}

export function OpportunityApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingId, setSavingId] = useState(null);
  const loadApplications = () => {
    fetch(`${API}/opportunity-applications`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : [])
      .then(setApplications)
      .catch(() => setApplications([]));
  };
  useEffect(() => {
    loadApplications();
  }, []);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredApplications = normalizedQuery
    ? applications.filter((application) => [
        application.name,
        application.email,
        application.phone,
        application.opportunity_title,
        application.description,
        application.status,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedQuery)))
    : applications;
  const updateStatus = async (id, status) => {
    setSavingId(id);
    try {
      const response = await fetch(`${API}/opportunity-applications/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to update application.');
      loadApplications();
      notifyAdmin(`Opportunity application ${status}.`);
    } catch (error) {
      notifyAdmin(error.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <div className="admin-page-heading"><div><span>Opportunities</span><h1>Opportunity applications</h1></div></div>
      <div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search applicants by name, email, phone, role or status..."
          aria-label="Search opportunity applications"
          style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear opportunity applications search"
            style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="message-list">
        {filteredApplications.length === 0
          ? <div className="table-empty">{normalizedQuery ? `No opportunity applications match "${searchQuery}".` : 'No opportunity applications yet.'}</div>
          : filteredApplications.map((application) => (
            <article key={application.id}>
              <div className="message-avatar">{application.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="message-head"><strong>{application.name}</strong><span>{new Date(application.created_at).toLocaleString()}</span></div>
                <b>{application.opportunity_title}</b>
                <p>{application.description}</p>
                <div className="application-contact">
                  <a href={`mailto:${application.email}`}>{application.email}</a>
                  <a href={`tel:${application.phone}`}>{application.phone}</a>
                </div>
                <div className="application-documents">
                  <a href={absoluteAssetUrl(application.cv_url)} target="_blank" rel="noopener noreferrer">Download CV</a>
                  <a href={absoluteAssetUrl(application.application_letter_url)} target="_blank" rel="noopener noreferrer">Download application letter</a>
                </div>
                <div className="application-actions">
                  <span className={`status-badge status-${application.status}`}>{application.status}</span>
                  {application.status !== 'reviewing' && <button type="button" className="admin-primary" disabled={savingId === application.id} onClick={() => updateStatus(application.id, 'reviewing')}>Mark reviewing</button>}
                  {application.status !== 'approved' && <button type="button" className="admin-primary" disabled={savingId === application.id} onClick={() => updateStatus(application.id, 'approved')}>Approve & email</button>}
                  {application.status !== 'declined' && <button type="button" className="admin-danger" disabled={savingId === application.id} onClick={() => updateStatus(application.id, 'declined')}>Decline & email</button>}
                </div>
              </div>
            </article>
          ))}
      </div>
    </>
  );
}