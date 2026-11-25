import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Search, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, authHeaders, notifyAdmin } from '../../shared/site';

export function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [thread, setThread] = useState({ conversation: null, messages: [] });
  const [sending, setSending] = useState(false);
  useEffect(() => {
    fetch(`${API}/messages`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : [])
      .then(setMessages)
      .catch(() => setMessages([]));
    fetch(`${API}/support/admin/conversations`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : [])
      .then(setConversations)
      .catch(() => setConversations([]));
  }, []);
  const normalizedConversationSearch = conversationSearch.trim().toLowerCase();
  const filteredConversations = normalizedConversationSearch
    ? conversations.filter((conversation) => [
        conversation.name,
        conversation.email,
        conversation.latest_message,
        conversation.status,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedConversationSearch)))
    : conversations;
  const normalizedEnquirySearch = enquirySearch.trim().toLowerCase();
  const filteredMessages = normalizedEnquirySearch
    ? messages.filter((message) => [
        message.name,
        message.email,
        message.subject,
        message.company,
        message.message,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedEnquirySearch)))
    : messages;
  const loadThread = (conversation) => {
    setSelected(conversation.id);
    fetch(`${API}/support/admin/conversations/${conversation.id}`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setThread)
      .catch(() => setThread({ conversation: null, messages: [] }));
  };
  const sendReply = async (event) => {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const response = await fetch(`${API}/support/admin/conversations/${selected}/replies`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: reply.trim(), status: 'pending' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setReply('');
      loadThread(thread.conversation);
      notifyAdmin('Reply sent to the visitor.');
    } catch (error) {
      notifyAdmin(error.message, 'error');
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      <div className="admin-page-heading"><div><span>Inbox</span><h1>Support conversations</h1></div></div>
      <div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} />
        <input
          type="text"
          value={conversationSearch}
          onChange={(e) => setConversationSearch(e.target.value)}
          placeholder="Search conversations by name, message or status..."
          aria-label="Search support conversations"
          style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
        {conversationSearch && (
          <button
            type="button"
            onClick={() => setConversationSearch('')}
            aria-label="Clear support conversations search"
            style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="support-admin-layout">
        <aside className="support-conversation-list">
          {filteredConversations.length === 0
            ? <div className="table-empty">{normalizedConversationSearch ? `No support conversations match "${conversationSearch}".` : 'No support conversations yet.'}</div>
            : filteredConversations.map((conversation) => (
              <button type="button" key={conversation.id} className={selected === conversation.id ? 'active' : ''} onClick={() => loadThread(conversation)}>
                <strong>{conversation.name}</strong>
                <span>{conversation.latest_message}</span>
                <small>{conversation.status} · {new Date(conversation.last_message_at).toLocaleString()}</small>
              </button>
            ))}
        </aside>
        <section className="support-admin-thread">
          {!thread.conversation
            ? <div className="table-empty">Select a support conversation.</div>
            : <>
                <div className="support-thread-header"><div><strong>{thread.conversation.name}</strong><a href={`mailto:${thread.conversation.email}`}>{thread.conversation.email}</a></div><span className={`status-badge status-${thread.conversation.status}`}>{thread.conversation.status}</span></div>
                <div className="support-thread-messages">
                  {thread.messages.map((message) => <div key={message.id} className={`support-thread-message ${message.sender}`}><small>{message.sender === 'admin' ? 'You' : thread.conversation.name}</small><p>{message.message}</p><time>{new Date(message.created_at).toLocaleString()}</time></div>)}
                </div>
                <form className="support-thread-form" onSubmit={sendReply}>
                  <textarea required rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this conversation..." />
                  <button type="submit" className={`admin-primary ${sending ? 'loading' : ''}`} disabled={sending}>{sending ? 'Sending...' : 'Send reply'}</button>
                </form>
              </>}
        </section>
      </div>
      <div className="admin-page-heading contact-enquiries-heading"><div><span>Website</span><h1>Contact enquiries</h1></div></div>
      <div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} />
        <input
          type="text"
          value={enquirySearch}
          onChange={(e) => setEnquirySearch(e.target.value)}
          placeholder="Search enquiries by name, email, subject or company..."
          aria-label="Search contact enquiries"
          style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
        {enquirySearch && (
          <button
            type="button"
            onClick={() => setEnquirySearch('')}
            aria-label="Clear contact enquiries search"
            style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="message-list">{filteredMessages.length === 0 ? <div className="table-empty">{normalizedEnquirySearch ? `No enquiries match "${enquirySearch}".` : 'No enquiries yet.'}</div> : filteredMessages.map((message) => <article key={message.id}><div className="message-avatar">{message.name.charAt(0).toUpperCase()}</div><div><div className="message-head"><strong>{message.name}</strong><span>{new Date(message.created_at).toLocaleString()}</span></div><b>{message.subject} · {message.company || 'Individual'}</b><p>{message.message}</p><a href={`mailto:${message.email}`}>{message.email}</a></div></article>)}</div>
    </>
  );
}