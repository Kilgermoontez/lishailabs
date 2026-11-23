import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders } from '../../shared/site';

export function AdminProtected({ children }) {
  const token = localStorage.getItem('lishai_token');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    const showToast = (event) => {
      setToast(event.detail);
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => setToast(null), 3200);
    };
    window.addEventListener('lishai-admin-toast', showToast);
    return () => {
      window.removeEventListener('lishai-admin-toast', showToast);
      window.clearTimeout(showToast.timer);
    };
  }, []);
  const admin = JSON.parse(localStorage.getItem('lishai_admin') || '{}');
  const links = [
    ['/admin', 'Overview', BarChart3],
    ['/admin/posts', 'Stories & blogs', PenTool],
    ['/admin/projects', 'AI projects', Rocket],
    ['/admin/opportunities', 'Opportunities', Globe2],
    ['/admin/messages', 'Enquiries', MessageSquareText],
    ['/admin/applications', 'Project applications', Building2],
    ['/admin/opportunity-applications', 'Opportunity applications', FileText],
    ['/admin/policies', 'Policies', FileText],
    ['/admin/settings', 'Settings', Settings],
  ];
  const logout = () => { localStorage.removeItem('lishai_token'); localStorage.removeItem('lishai_admin'); navigate('/admin/login'); };
  return (
    <div className="admin-shell">
      <aside className={mobileOpen ? 'admin-sidebar open' : 'admin-sidebar'}>
        <Link className="brand admin-brand" to="/"><span className="brand-mark"><Sparkles size={18} /></span><span>Lishai Labs</span></Link>
        <nav>{links.map(([path, label, Icon]) => <Link key={path} to={path} onClick={() => setMobileOpen(false)} className={window.location.pathname === path ? 'active' : ''}><Icon /><span>{label}</span></Link>)}</nav>
        <button className="logout-button" onClick={logout}><LogOut /> Log out</button>
      </aside>
      <div className="admin-main">
        <header className="admin-header"><button onClick={() => setMobileOpen(!mobileOpen)}><Menu /></button><div><span>Welcome back</span><strong>{admin.name || 'Administrator'}</strong></div><div className="admin-avatar"><CircleUserRound /></div></header>
        <main className="admin-content">{children}</main>
      </div>
      {toast && <div className={`admin-toast ${toast.type}`} role="status"><span>{toast.type === 'error' ? '!' : '✓'}</span>{toast.message}<button type="button" onClick={() => setToast(null)}>×</button></div>}
    </div>
  );
}