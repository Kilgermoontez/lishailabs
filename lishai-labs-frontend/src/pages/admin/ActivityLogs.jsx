import { useEffect, useState } from 'react';
import { API, authHeaders } from '../../shared/site';
import { Calendar, Search, User, X, Zap } from 'lucide-react';

export function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const response = await fetch(`${API}/auth/activity-logs?limit=${limit}&offset=${offset}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action) => {
    const colors = {
      LOGIN: '#4CAF50',
      LOGOUT: '#FF9800',
      AVATAR_UPLOADED: '#2196F3',
      PASSWORD_CHANGED: '#F44336',
      PROFILE_UPDATED: '#9C27B0',
      POST_CREATED: '#00BCD4',
      POST_UPDATED: '#FFC107',
      POST_DELETED: '#E91E63',
      PROJECT_CREATED: '#00BCD4',
      PROJECT_UPDATED: '#FFC107',
      PROJECT_DELETED: '#E91E63',
      OPPORTUNITY_CREATED: '#00BCD4',
      OPPORTUNITY_UPDATED: '#FFC107',
      OPPORTUNITY_DELETED: '#E91E63',
      SETTINGS_UPDATED: '#9C27B0',
      POLICY_UPDATED: '#673AB7',
    };
    return colors[action] || '#757575';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredLogs = normalizedQuery
    ? logs.filter((log) => [
        log.email,
        log.admin_name,
        log.action,
        log.description,
        log.ip_address,
        formatDate(log.created_at),
      ].some((field) => String(field || '').toLowerCase().includes(normalizedQuery)))
    : logs;

  const pages = Math.ceil(total / limit);

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span>Administration</span>
          <h1>Activity Logs</h1>
        </div>
        <div style={{ fontSize: '12px', color: '#929aab' }}>
          Total Activities: <strong>{total}</strong>
        </div>
      </div>

      <div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search logs by email, admin, action, description, IP or date..."
          aria-label="Search activity logs"
          style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear activity logs search"
            style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading activity logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          {normalizedQuery ? `No activity logs match "${searchQuery}".` : 'No activity logs found'}
        </div>
      ) : (
        <>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e7eaf1', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e7eaf1' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#929aab', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Time</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#929aab', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Admin Email</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#929aab', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Action</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#929aab', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Description</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#929aab', textTransform: 'uppercase', letterSpacing: '0.8px' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderTop: '1px solid #eef0f4', fontSize: '13px' }}>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={16} style={{ color: '#6976d8', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: '#777f90' }}>{formatDate(log.created_at)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={16} style={{ color: '#6976d8', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#252d40' }}>{log.email || 'Unknown'}</div>
                          <div style={{ fontSize: '11px', color: '#929aab' }}>{log.admin_name || 'Admin'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          backgroundColor: getActionBadgeColor(log.action),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#657087', fontSize: '12px' }}>
                      {log.description || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#777f90', whiteSpace: 'nowrap' }}>
                      {log.ip_address || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid #e5e8ee',
                  background: page === 1 ? '#f5f7fb' : 'white',
                  borderRadius: '7px',
                  color: page === 1 ? '#ccc' : '#6976d8',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                First
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid #e5e8ee',
                  background: page === 1 ? '#f5f7fb' : 'white',
                  borderRadius: '7px',
                  color: page === 1 ? '#ccc' : '#6976d8',
                  cursor: page === 1 ? 'default' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '12px', color: '#777f90', margin: '0 8px', whiteSpace: 'nowrap' }}>
                Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} total)
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pages}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid #e5e8ee',
                  background: page === pages ? '#f5f7fb' : 'white',
                  borderRadius: '7px',
                  color: page === pages ? '#ccc' : '#6976d8',
                  cursor: page === pages ? 'default' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                Next →
              </button>
              <button
                onClick={() => setPage(pages)}
                disabled={page === pages}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  border: '1px solid #e5e8ee',
                  background: page === pages ? '#f5f7fb' : 'white',
                  borderRadius: '7px',
                  color: page === pages ? '#ccc' : '#6976d8',
                  cursor: page === pages ? 'default' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                Last
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}