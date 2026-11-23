import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, UserRound } from 'lucide-react';
import { API } from '../../shared/site';
import { PublicLayout } from './Layout';

export function ChatPage() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [humanForm, setHumanForm] = useState({ name: '', email: '', message: '' });
  const [humanStatus, setHumanStatus] = useState('');
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [conversationKey, setConversationKey] = useState(() => localStorage.getItem('lishai_support_key') || '');
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportReply, setSupportReply] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I’m the Lish AI Labs assistant. Ask me about our services, projects, training programmes or opportunities.' },
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);
  useEffect(() => {
    if (!conversationKey) return undefined;
    let active = true;
    const load = () => fetch(`${API}/support/conversations/${encodeURIComponent(conversationKey)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active) setSupportMessages(data.messages || []); })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [conversationKey]);

  const send = async (event) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setInput('');
    setBusy(true);
    setMessages((current) => [...current, { role: 'user', content: message }]);
    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages }),
      });
      const data = await response.json();
      setMessages((current) => [...current, { role: 'assistant', content: response.ok ? data.reply : data.message }]);
    } catch (_) {
      setMessages((current) => [...current, { role: 'assistant', content: 'I could not answer right now. Please try again shortly.' }]);
    } finally {
      setBusy(false);
    }
  };
  const requestHuman = async (event) => {
    event.preventDefault();
    setHumanStatus('Sending request...');
    try {
      const response = await fetch(`${API}/support/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...humanForm,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem('lishai_support_key', data.conversationKey);
      setConversationKey(data.conversationKey);
      setHumanStatus('Human support conversation opened.');
      setHumanForm({ name: '', email: '', message: '' });
    } catch (_) {
      setHumanStatus('Unable to send the request. Please try again.');
    }
  };
  const sendSupportReply = async (event) => {
    event.preventEvent?.();
    event.preventDefault();
    const message = supportReply.trim();
    if (!message || !conversationKey) return;
    setHumanStatus('Sending reply...');
    try {
      const response = await fetch(`${API}/support/conversations/${encodeURIComponent(conversationKey)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSupportReply('');
      setHumanStatus('Reply sent.');
    } catch (error) {
      setHumanStatus(error.message);
    }
  };

  return (
    <PublicLayout>
      <section className="chat-page">
        <div className="chat-page-heading">
          <span className="section-kicker">Lish AI Assistant</span>
          <h1>Ask us anything about Lish AI Labs.</h1>
          <p>Get answers from our services, projects, opportunities and company information.</p>
          <button type="button" className="human-agent-button" onClick={() => setShowHumanForm((current) => !current)}>
            <UserRound size={18} /> Speak to a human agent
          </button>
          {showHumanForm && (
            conversationKey
              ? <div className="human-agent-thread">
                  <div className="human-thread-messages">
                    {supportMessages.map((message) => (
                      <div key={message.id} className={`chat-page-message ${message.sender === 'admin' ? 'assistant' : 'user'}`}>
                        <small>{message.sender === 'admin' ? 'Support team' : 'You'}</small>
                        {message.message}
                      </div>
                    ))}
                  </div>
                  <form className="human-thread-form" onSubmit={sendSupportReply}>
                    <input required value={supportReply} onChange={(event) => setSupportReply(event.target.value)} placeholder="Reply to support..." />
                    <button type="submit" className="button button-primary">Send</button>
                  </form>
                  {humanStatus && <p className="form-status">{humanStatus}</p>}
                </div>
              : <form className="human-agent-form" onSubmit={requestHuman}>
                  <label>Your name<input required value={humanForm.name} onChange={(event) => setHumanForm({ ...humanForm, name: event.target.value })} /></label>
                  <label>Email<input type="email" required value={humanForm.email} onChange={(event) => setHumanForm({ ...humanForm, email: event.target.value })} /></label>
                  <label>How can we help?<textarea required rows={3} value={humanForm.message} onChange={(event) => setHumanForm({ ...humanForm, message: event.target.value })} /></label>
                  <button type="submit" className="button button-primary">Send to support</button>
                  {humanStatus && <p className="form-status">{humanStatus}</p>}
                </form>
          )}
        </div>
        <div className="chat-page-shell">
          <div className="chat-page-header"><Sparkles size={20} /><div><strong>Lish AI Assistant</strong><span>Online</span></div></div>
          <div className="chat-page-messages" role="log" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={`chat-page-message ${message.role}`}>{message.content}</div>
            ))}
            {busy && <div className="chat-page-message assistant">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-page-form" onSubmit={send}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about Lish AI Labs..." aria-label="Chat message" />
            <button type="submit" disabled={busy} aria-label="Send message"><Send /></button>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
