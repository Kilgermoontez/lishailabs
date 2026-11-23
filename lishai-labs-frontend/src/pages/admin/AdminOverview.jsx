import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders } from '../../shared/site';

export function AdminOverview() {
  const [stats, setStats] = useState({ posts: 0, projects: 0, messages: 0, publishedPosts: 0, publishedProjects: 0 });
  useEffect(() => { fetch(`${API}/dashboard/stats`, { headers: authHeaders() }).then((r) => r.ok ? r.json() : {}).then(setStats).catch(() => {}); }, []);
  const cards = [
    ['Published insights', stats.publishedPosts, PenTool],
    ['AI projects', stats.publishedProjects, Rocket],
    ['Total enquiries', stats.messages, MessageSquareText],
    ['Content items', stats.posts + stats.projects, Globe2],
  ];
  return <><div className="admin-page-heading"><div><span>Overview</span><h1>Good morning.</h1></div><Link className="admin-primary" to="/admin/posts"><Plus /> New story</Link></div><div className="stat-grid">{cards.map(([label, value, Icon]) => <article key={label}><div><span>{label}</span><strong>{value}</strong></div><Icon /></article>)}</div><div className="admin-panels"><article><div className="panel-heading"><div><span>Content health</span><h3>Publishing activity</h3></div><b>Live</b></div><div className="activity-chart"><div className="chart-bars">{[42,65,48,82,58,92,72,88,68,96,78,84].map((height, i) => <span key={i} style={{ height: `${height}%` }} />)}</div></div></article><article><div className="panel-heading"><div><span>Quick actions</span><h3>Manage your website</h3></div></div><div className="quick-actions"><Link to="/admin/posts"><PenTool /><span>Write a story</span><ChevronRight /></Link><Link to="/admin/projects"><Rocket /><span>Add a project</span><ChevronRight /></Link><Link to="/admin/settings"><Settings /><span>Update settings</span><ChevronRight /></Link></div></article></div></>;
}