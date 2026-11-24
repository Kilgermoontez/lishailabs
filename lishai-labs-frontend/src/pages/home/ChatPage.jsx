import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, UserRound } from 'lucide-react';
import { API } from '../../shared/site';
import { Header } from './Layout';

export function ChatPage() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [humanForm, setHumanForm] = useState({ name: '', email: '', message: '' });
  const [humanStatus, setHumanStatus] = useState('');
  const [showHumanForm, setShowHumanForm] = useState(false);
  const [conversationKey, setConversationKey] = useState(() => localStorage.getItem('lishai_support_key') || '');
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportReply, setSupportReply] = useState('');
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' && window.visualViewport
      ? `${window.visualViewport.height}px`
      : '100dvh'
  );
  const [fixedHeaderOffset, setFixedHeaderOffset] = useState(0);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I’m the Lish AI Labs assistant. Ask me about our services, projects, training programmes or opportunities.' },
  ]);
  const viewportRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const supportMessagesRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    if (supportMessagesRef.current) {
      supportMessagesRef.current.scrollTop = supportMessagesRef.current.scrollHeight;
    }
  }, [supportMessages]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    const updateViewportMetrics = () => {
      const nextHeight = window.visualViewport
        ? `${Math.round(window.visualViewport.height)}px`
        : `${window.innerHeight}px`;
      setViewportHeight(nextHeight);

      const headerEl = viewportRef.current?.querySelector('header');
      if (headerEl) {
        const position = window.getComputedStyle(headerEl).position;
        setFixedHeaderOffset(position === 'fixed' ? Math.ceil(headerEl.getBoundingClientRect().height) : 0);
      } else {
        setFixedHeaderOffset(0);
      }
    };

    updateViewportMetrics();
    window.addEventListener('resize', updateViewportMetrics);
    window.visualViewport?.addEventListener('resize', updateViewportMetrics);
    window.visualViewport?.addEventListener('scroll', updateViewportMetrics);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      window.removeEventListener('resize', updateViewportMetrics);
      window.visualViewport?.removeEventListener('resize', updateViewportMetrics);
      window.visualViewport?.removeEventListener('scroll', updateViewportMetrics);
    };
  }, []);

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

  const scrollChatToBottom = () => {
    window.setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    }, 120);
  };

  return (
    <div
      ref={viewportRef}
      className="chat-viewport"
      style={{ '--chat-vh': viewportHeight, '--chat-fixed-header': `${fixedHeaderOffset}px` }}
    >
      <style>{`
        .chat-viewport {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: var(--chat-vh, 100dvh);
          max-height: var(--chat-vh, 100dvh);
          overflow: hidden;
        }

        .chat-viewport > header {
          flex-shrink: 0;
        }

        .chat-viewport .chat-main {
          flex: 1 1 auto;
          min-height: 0;
          height: auto !important;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: calc(var(--chat-fixed-header, 0px) + 1.25rem) 1.5rem 1.5rem !important;
          box-sizing: border-box;
        }

        .chat-viewport .chat-page {
          flex: 1 1 auto;
          min-height: 0;
          height: 100% !important;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(280px, 0.88fr) minmax(0, 1.35fr);
          gap: 2rem;
          align-items: stretch;
          box-sizing: border-box;
        }

        .chat-viewport .chat-page-heading {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          min-height: 0;
          overflow-y: auto;
          padding-right: 0.25rem;
          -webkit-overflow-scrolling: touch;
        }

        .chat-viewport .chat-page-heading h1 {
          margin: 0;
          line-height: 1.2;
        }

        .chat-viewport .chat-page-heading > p {
          margin: 0;
          line-height: 1.55;
        }

        .chat-viewport .human-agent-button {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .chat-viewport .human-agent-form,
        .chat-viewport .human-agent-thread {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.35rem;
        }

        .chat-viewport .human-thread-messages {
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          padding: 0.5rem 0.25rem;
          -webkit-overflow-scrolling: touch;
        }

        .chat-viewport .human-thread-form {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .chat-viewport .human-thread-form input,
        .chat-viewport .human-agent-form input,
        .chat-viewport .human-agent-form textarea {
          font-size: 16px;
        }

        .chat-viewport .human-thread-form input {
          flex: 1 1 auto;
          min-width: 0;
        }

        .chat-viewport .chat-page-shell {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
          height: 100% !important;
          max-height: 100% !important;
          overflow: hidden;
          box-sizing: border-box;
        }

        .chat-viewport .chat-page-header {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.9rem 1.15rem;
        }

        .chat-viewport .chat-page-messages {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 1.15rem;
        }

        .chat-viewport .chat-page-message {
          line-height: 1.5;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .chat-viewport .chat-page-form {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
          box-sizing: border-box;
        }

        .chat-viewport .chat-page-form input {
          flex: 1 1 auto;
          min-width: 0;
          font-size: 16px;
          min-height: 44px;
        }

        .chat-viewport .chat-page-form button {
          flex-shrink: 0;
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 959px) {
          .chat-viewport .chat-main {
            padding: calc(var(--chat-fixed-header, 0px) + 0.75rem) 0.75rem 0.75rem !important;
          }

          .chat-viewport .chat-page {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .chat-viewport .chat-page-heading {
            flex: 0 0 auto;
            gap: 0.45rem;
            padding: 0 0.25rem;
            max-height: 42%;
          }

          .chat-viewport .chat-page-heading h1 {
            font-size: 1.25rem;
          }

          .chat-viewport .chat-page-heading > p {
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .chat-viewport .human-agent-button {
            padding: 0.55rem 0.9rem;
            font-size: 0.9rem;
            margin-top: 0.15rem;
          }

          .chat-viewport .human-thread-messages {
            max-height: 150px;
          }

          .chat-viewport .chat-page-shell {
            flex: 1 1 auto;
            min-height: 0;
          }

          .chat-viewport .chat-page-header {
            padding: 0.75rem 0.95rem;
          }

          .chat-viewport .chat-page-messages {
            padding: 0.9rem;
            gap: 0.75rem;
          }

          .chat-viewport .chat-page-form {
            padding: 0.7rem 0.75rem calc(0.7rem + env(safe-area-inset-bottom, 0px));
            gap: 0.5rem;
          }
        }

        @media (max-width: 959px) and (max-height: 580px) {
          .chat-viewport .chat-page-heading > p,
          .chat-viewport .chat-page-heading .section-kicker {
            display: none;
          }
        }

        @media (max-height: 460px) and (orientation: landscape) {
          .chat-viewport {
            height: auto;
            min-height: 100dvh;
            max-height: none;
            overflow-y: auto;
          }

          .chat-viewport .chat-main,
          .chat-viewport .chat-page {
            overflow: visible;
          }

          .chat-viewport .chat-page-shell {
            min-height: 320px;
          }
        }
      `}</style>
      <Header />
      <main className="chat-main">
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
                    <div ref={supportMessagesRef} className="human-thread-messages">
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
            <div ref={chatMessagesRef} className="chat-page-messages" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={`chat-page-message ${message.role}`}>{message.content}</div>
              ))}
              {busy && <div className="chat-page-message assistant">Thinking...</div>}
            </div>
            <form className="chat-page-form" onSubmit={send}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onFocus={scrollChatToBottom}
                placeholder="Ask about Lish AI Labs..."
                aria-label="Chat message"
              />
              <button type="submit" disabled={busy} aria-label="Send message"><Send /></button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}