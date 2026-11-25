import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Sparkles, UserRound } from 'lucide-react';
import { API } from '../../shared/site';
import { Header } from './Layout';

const CANNOT_ANSWER_PATTERN =
  /\b(i (can't|cannot|can not|could not|couldn't|don't|do not|am unable to|was unable to) (answer|help|find|verify|provide|confirm|assist|access)|not sure|no information|don't have (enough |that |any )?information|do not have (enough |that |any )?information|outside (my|the) (scope|knowledge)|beyond (my|the)|unable to answer|speak (to|with) a human|human agent|contact (our |the )?(team|support)|reach out to (our |the )?(team|support)|please try again)\b/i;

const ASKING_FOR_HUMAN_PATTERN =
  /\b(human|real person|live agent|support agent|talk to someone|speak to someone|speak to a human|customer care|customer support)\b/i;

function shouldOfferHuman(replyText, responseOk, data, userMessage) {
  if (!responseOk) return true;
  if (data?.needsHuman || data?.escalate || data?.fallback || data?.unanswered) return true;
  if (CANNOT_ANSWER_PATTERN.test(replyText || '')) return true;
  if (ASKING_FOR_HUMAN_PATTERN.test(userMessage || '')) return true;
  return false;
}

export function ChatPage() {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [humanForm, setHumanForm] = useState({ name: '', email: '', message: '' });
  const [humanStatus, setHumanStatus] = useState('');
  const [showHumanOffer, setShowHumanOffer] = useState(() => Boolean(localStorage.getItem('lishai_support_key')));
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
  }, [messages, busy, showHumanOffer, showHumanForm]);

  useEffect(() => {
    if (supportMessagesRef.current) {
      supportMessagesRef.current.scrollTop = supportMessagesRef.current.scrollHeight;
    }
  }, [supportMessages, showHumanForm]);

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
    setShowHumanOffer(true);
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
      const replyText = response.ok ? data.reply : data.message;
      setMessages((current) => [...current, { role: 'assistant', content: replyText }]);

      if (shouldOfferHuman(replyText, response.ok, data, message)) {
        setShowHumanOffer(true);
        setHumanForm((current) => (current.message ? current : { ...current, message }));
      }
    } catch (_) {
      setMessages((current) => [...current, { role: 'assistant', content: 'I could not answer right now. Please try again shortly.' }]);
      setShowHumanOffer(true);
      setHumanForm((current) => (current.message ? current : { ...current, message }));
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

  const scrollSupportToBottom = () => {
    window.setTimeout(() => {
      if (supportMessagesRef.current) {
        supportMessagesRef.current.scrollTop = supportMessagesRef.current.scrollHeight;
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
          grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.4fr);
          gap: 2rem;
          align-items: stretch;
          box-sizing: border-box;
        }

        .chat-viewport .chat-page-heading {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.9rem;
          min-height: 0;
          padding-right: 0.5rem;
        }

        .chat-viewport .chat-page-heading .section-kicker {
          letter-spacing: 0.08em !important;
          word-spacing: normal !important;
          line-height: 1.4 !important;
        }

        .chat-viewport .chat-page-heading h1 {
          margin: 0;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-kerning: normal;
          line-height: 1.28 !important;
        }

        .chat-viewport .chat-page-heading > p {
          margin: 0;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          line-height: 1.6 !important;
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
          padding: 1.1rem;
        }

        .chat-viewport .chat-page-message {
          line-height: 1.55;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .chat-viewport .chat-page-message small {
          display: block;
          margin-bottom: 0.2rem;
          font-size: 0.72rem;
          opacity: 0.75;
        }

        /* In-chat human escalation bar (directly above typing space) */
        .chat-viewport .inchat-human-zone {
          flex-shrink: 0;
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          background: #f8fafc;
        }

        .chat-viewport .inchat-human-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.6rem 0.95rem;
        }

        .chat-viewport .inchat-human-prompt {
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.35;
          letter-spacing: normal !important;
          word-spacing: normal !important;
        }

        .chat-viewport .inchat-human-trigger {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.85rem;
          border-radius: 999px;
          border: 1px solid #1d4ed8;
          background: #ffffff;
          color: #1d4ed8;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .chat-viewport .inchat-human-trigger:hover {
          background: #eff6ff;
        }

        /* Dedicated Human Support page styles */
        .chat-viewport .back-to-ai-button {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 0.95rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #1e293b;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
        }

        .chat-viewport .back-to-ai-button:hover {
          background: #f1f5f9;
        }

        .chat-viewport .human-header-back {
          margin-left: auto;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.32);
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        .chat-viewport .human-header-back:hover {
          background: rgba(255, 255, 255, 0.24);
        }

        .chat-viewport .human-page-form-wrap {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 1.25rem;
          background: #f7f9fd;
          box-sizing: border-box;
        }

        .chat-viewport .human-agent-form {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          margin: 0;
          padding: 1.25rem;
          border: 1px solid #e1e6ef;
          border-radius: 14px;
          background: #ffffff;
        }

        .chat-viewport .human-agent-form label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }

        .chat-viewport .human-agent-form input,
        .chat-viewport .human-agent-form textarea {
          width: 100%;
          box-sizing: border-box;
          font-size: 16px;
        }

        .chat-viewport .human-page-status {
          flex-shrink: 0;
          margin: 0;
          padding: 0.45rem 1rem;
          border-top: 1px solid #edf0f5;
          background: #f8fafc;
          font-size: 0.82rem;
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
            padding: calc(var(--chat-fixed-header, 0px) + 0.6rem) 0.75rem 0.65rem !important;
          }

          .chat-viewport .chat-page {
            display: flex;
            flex-direction: column;
            gap: 0.65rem;
          }

          .chat-viewport .chat-page-heading {
            flex: 0 0 auto;
            gap: 0.35rem;
            padding: 0.1rem 0.25rem 0;
          }

          .chat-viewport .chat-page-heading .section-kicker {
            font-size: 0.72rem;
          }

          .chat-viewport .chat-page-heading h1 {
            font-size: 1.2rem !important;
            line-height: 1.3 !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }

          .chat-viewport .chat-page-heading > p {
            font-size: 0.88rem !important;
            line-height: 1.45 !important;
          }

          .chat-viewport .back-to-ai-button {
            display: none;
          }

          .chat-viewport .chat-page-shell {
            flex: 1 1 auto;
            min-height: 0;
          }

          .chat-viewport .chat-page-header {
            padding: 0.75rem 0.95rem;
          }

          .chat-viewport .chat-page-messages {
            padding: 0.85rem;
            gap: 0.75rem;
          }

          .chat-viewport .human-page-form-wrap {
            padding: 0.85rem;
          }

          .chat-viewport .human-agent-form {
            padding: 1rem;
            gap: 0.75rem;
          }

          .chat-viewport .inchat-human-banner {
            padding: 0.55rem 0.75rem;
          }

          .chat-viewport .chat-page-form {
            padding: 0.7rem 0.75rem calc(0.7rem + env(safe-area-inset-bottom, 0px));
            gap: 0.5rem;
          }
        }

        /* Hide the outer intro when the mobile soft keyboard shrinks the viewport */
        @media (max-width: 959px) and (max-height: 580px) {
          .chat-viewport .chat-page-heading {
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
        {showHumanForm ? (
          <section className="chat-page human-support-page">
            <div className="chat-page-heading">
              <span className="section-kicker">Human Support</span>
              <h1>Speak directly with our support team.</h1>
              <p>Share your question below and a member of the Lish AI Labs team will follow up with you here.</p>
              <button
                type="button"
                className="back-to-ai-button"
                onClick={() => setShowHumanForm(false)}
              >
                <ArrowLeft size={16} /> Back to AI Assistant
              </button>
            </div>
            <div className="chat-page-shell">
              <div className="chat-page-header">
                <UserRound size={20} />
                <div>
                  <strong>Human Support</strong>
                  <span>{conversationKey ? 'Support conversation active' : 'Connect with our team'}</span>
                </div>
                <button
                  type="button"
                  className="human-header-back"
                  onClick={() => setShowHumanForm(false)}
                >
                  <ArrowLeft size={15} /> AI Chat
                </button>
              </div>

              {conversationKey ? (
                <>
                  <div ref={supportMessagesRef} className="chat-page-messages" role="log" aria-live="polite">
                    {supportMessages.length === 0 ? (
                      <div className="chat-page-message assistant">
                        <small>Support team</small>
                        Your conversation is open. Send a message below and our team will reply here.
                      </div>
                    ) : (
                      supportMessages.map((message) => (
                        <div key={message.id} className={`chat-page-message ${message.sender === 'admin' ? 'assistant' : 'user'}`}>
                          <small>{message.sender === 'admin' ? 'Support team' : 'You'}</small>
                          {message.message}
                        </div>
                      ))
                    )}
                  </div>
                  {humanStatus && <p className="form-status human-page-status">{humanStatus}</p>}
                  <form className="chat-page-form" onSubmit={sendSupportReply}>
                    <input
                      required
                      value={supportReply}
                      onChange={(event) => setSupportReply(event.target.value)}
                      onFocus={scrollSupportToBottom}
                      placeholder="Reply to support..."
                      aria-label="Support message"
                    />
                    <button type="submit" aria-label="Send reply"><Send /></button>
                  </form>
                </>
              ) : (
                <div className="human-page-form-wrap">
                  <form className="human-agent-form" onSubmit={requestHuman}>
                    <label>
                      Your name
                      <input
                        required
                        value={humanForm.name}
                        onChange={(event) => setHumanForm({ ...humanForm, name: event.target.value })}
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        required
                        value={humanForm.email}
                        onChange={(event) => setHumanForm({ ...humanForm, email: event.target.value })}
                      />
                    </label>
                    <label>
                      How can we help?
                      <textarea
                        required
                        rows={4}
                        value={humanForm.message}
                        onChange={(event) => setHumanForm({ ...humanForm, message: event.target.value })}
                      />
                    </label>
                    <button type="submit" className="button button-primary">Send to support</button>
                    {humanStatus && <p className="form-status">{humanStatus}</p>}
                  </form>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="chat-page">
            <div className="chat-page-heading">
              <span className="section-kicker">Lish AI Assistant</span>
              <h1>Ask us anything about Lish AI Labs.</h1>
              <p>Get answers from our services, projects, opportunities and company information.</p>
            </div>
            <div className="chat-page-shell">
              <div className="chat-page-header"><Sparkles size={20} /><div><strong>Lish AI Assistant</strong><span>Online</span></div></div>
              <div ref={chatMessagesRef} className="chat-page-messages" role="log" aria-live="polite">
                {messages.map((message, index) => (
                  <div key={index} className={`chat-page-message ${message.role}`}>{message.content}</div>
                ))}
                {busy && <div className="chat-page-message assistant">Thinking...</div>}
              </div>

              {showHumanOffer && (
                <div className="inchat-human-zone">
                  <div className="inchat-human-banner">
                    <span className="inchat-human-prompt">
                      {conversationKey ? 'Your support chat is active.' : 'Need help from our team?'}
                    </span>
                    <button
                      type="button"
                      className="inchat-human-trigger"
                      onClick={() => setShowHumanForm(true)}
                    >
                      <UserRound size={16} /> {conversationKey ? 'Open human chat' : 'Speak to a human'}
                    </button>
                  </div>
                </div>
              )}

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
        )}
      </main>
    </div>
  );
}