import { useEffect, useState } from 'react';
import { ArrowRight, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl } from '../../shared/site';
import { PublicLayout } from './Layout';

export function OpportunitiesPage() {
  const emptyForm = {
    name: '',
    email: '',
    phone: '',
    description: '',
    cv: null,
    application_letter: null,
  };

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/opportunities?status=published&limit=100`);
      const data = await response.json().catch(() => ({ rows: [] }));
      setOpportunities(Array.isArray(data.rows) ? data.rows : []);
    } catch {
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    if (!selectedOpportunity) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) {
        setSelectedOpportunity(null);
        setForm(emptyForm);
        setFeedback({ type: '', message: '' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedOpportunity, submitting]);

  const getLimitState = (opportunity) => {
    const hasLimit =
      opportunity.application_limit !== null &&
      opportunity.application_limit !== undefined &&
      opportunity.application_limit !== '';
    const remaining = hasLimit
      ? Math.max(
          0,
          opportunity.remaining_applications !== undefined && opportunity.remaining_applications !== null
            ? Number(opportunity.remaining_applications)
            : Number(opportunity.application_limit) - Number(opportunity.applications_count ?? 0)
        )
      : null;
    const isFull = hasLimit && remaining <= 0;
    return { hasLimit, remaining, isFull };
  };

  const openModal = (opportunity) => {
    setSelectedOpportunity(opportunity);
    setForm(emptyForm);
    setFeedback({ type: '', message: '' });
  };

  const closeModal = () => {
    if (submitting) return;
    setSelectedOpportunity(null);
    setForm(emptyForm);
    setFeedback({ type: '', message: '' });
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!selectedOpportunity) return;

    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const body = new FormData();
      body.append('opportunity_id', selectedOpportunity.id);
      body.append('name', form.name.trim());
      body.append('email', form.email.trim());
      body.append('phone', form.phone.trim());
      body.append('description', form.description.trim());
      if (form.cv) body.append('cv', form.cv);
      if (form.application_letter) body.append('application_letter', form.application_letter);

      const response = await fetch(`${API}/opportunity-applications`, {
        method: 'POST',
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit your application.');
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Application submitted successfully.',
      });
      setForm(emptyForm);
      await loadOpportunities();
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <style>{`
        .opportunities-mobile-scope .section-heading .section-kicker {
          letter-spacing: 0.08em !important;
          word-spacing: normal !important;
          line-height: 1.4 !important;
        }

        .opportunities-mobile-scope .section-heading h1,
        .opportunities-mobile-scope .post-card h3,
        .opportunities-mobile-scope .post-card p,
        .opportunities-mobile-scope .section-heading p {
          letter-spacing: normal !important;
          word-spacing: normal !important;
          font-kerning: normal;
        }

        .opportunities-mobile-scope .post-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        .opportunities-mobile-scope .opportunity-home-image {
          width: 100%;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          display: block;
          border-radius: 12px;
        }

        .opportunities-mobile-scope .post-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem 0.65rem;
          min-width: 0;
        }

        .opportunities-mobile-scope .post-meta span {
          max-width: 100%;
          word-break: break-word;
          line-height: 1.35;
        }

        .opportunities-mobile-scope .opportunity-limit-meta span {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          background: rgba(29, 78, 216, 0.08);
          color: #1d4ed8;
        }

        .opportunities-mobile-scope .opportunity-limit-meta.is-full span {
          background: rgba(220, 38, 38, 0.1);
          color: #b91c1c;
        }

        .opportunities-mobile-scope .post-card h3 {
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .opportunities-mobile-scope .post-card p {
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .opportunities-mobile-scope .post-card .button {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          min-height: 44px;
        }

        .opportunities-mobile-scope .opportunity-skeleton-card {
          padding: 1.15rem;
          border-radius: 16px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .opportunities-mobile-scope .opportunity-skeleton-box {
          border-radius: 10px;
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: oppShimmer 1.4s infinite linear;
        }

        @keyframes oppShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Application Modal Responsive Rules */
        .opportunities-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          box-sizing: border-box;
        }

        .opportunities-modal-overlay .editor-panel {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 560px;
          max-height: 90dvh;
          overflow: hidden;
          box-sizing: border-box;
        }

        .opportunities-modal-overlay .editor-header {
          flex-shrink: 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .opportunities-modal-overlay .editor-header h2 {
          margin: 0.2rem 0 0;
          letter-spacing: normal !important;
          word-spacing: normal !important;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .opportunities-modal-overlay .editor-header button {
          flex-shrink: 0;
          min-width: 40px;
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .opportunities-modal-overlay .editor-body {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .opportunities-modal-overlay .editor-body label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }

        .opportunities-modal-overlay .editor-body input,
        .opportunities-modal-overlay .editor-body textarea {
          width: 100%;
          box-sizing: border-box;
          font-size: 16px;
        }

        .opportunities-modal-overlay .editor-body .upload-label span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 44px;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }

        .opportunities-modal-overlay .editor-body .upload-label .upload-file-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .opportunities-modal-overlay .editor-footer {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.65rem;
        }

        .opportunities-modal-overlay .editor-footer button {
          min-height: 44px;
        }

        @media (max-width: 768px) {
          .opportunities-mobile-scope.insight-section {
            padding: 1.35rem 0.95rem 2.25rem !important;
          }

          .opportunities-mobile-scope .section-heading {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.55rem !important;
            margin-bottom: 1.35rem !important;
          }

          .opportunities-mobile-scope .section-heading h1 {
            font-size: 1.6rem !important;
            line-height: 1.25 !important;
            margin: 0.25rem 0 0 !important;
          }

          .opportunities-mobile-scope .section-heading p {
            font-size: 0.95rem !important;
            line-height: 1.5 !important;
            margin: 0 !important;
          }

          .opportunities-mobile-scope .post-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 1.1rem !important;
          }

          .opportunities-mobile-scope .post-card {
            padding: 1rem !important;
            gap: 0.7rem !important;
            border-radius: 16px !important;
          }

          .opportunities-mobile-scope .post-card h3 {
            font-size: 1.15rem !important;
            margin: 0.15rem 0 0 !important;
          }

          .opportunities-mobile-scope .post-card p {
            font-size: 0.94rem !important;
            margin: 0 0 0.35rem !important;
          }

          .opportunities-mobile-scope .post-card .button {
            width: 100%;
          }
        }

        @media (max-width: 640px) {
          .opportunities-modal-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .opportunities-modal-overlay .editor-panel {
            max-width: 100%;
            max-height: 92dvh;
            border-radius: 20px 20px 0 0 !important;
            margin: 0 !important;
          }

          .opportunities-modal-overlay .editor-header {
            padding: 1rem 1rem 0.85rem !important;
          }

          .opportunities-modal-overlay .editor-header h2 {
            font-size: 1.12rem !important;
          }

          .opportunities-modal-overlay .editor-body {
            padding: 0.85rem 1rem 1rem !important;
          }

          .opportunities-modal-overlay .editor-footer {
            padding: 0.8rem 1rem calc(0.85rem + env(safe-area-inset-bottom, 0px)) !important;
          }

          .opportunities-modal-overlay .editor-footer button {
            flex: 1 1 0;
          }
        }
      `}</style>

      <section className="section insight-section opportunities-mobile-scope">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Careers & partnerships</span>
            <h1>Available opportunities.</h1>
          </div>
          <p>Explore open roles, internships, training cohorts, tenders, and partnerships.</p>
        </div>

        {loading ? (
          <div className="post-grid" aria-busy="true" aria-label="Loading opportunities">
            {[1, 2, 3].map((item) => (
              <div className="opportunity-skeleton-card" key={item}>
                <div className="opportunity-skeleton-box" style={{ height: '165px', width: '100%' }} />
                <div className="opportunity-skeleton-box" style={{ height: '14px', width: '55%' }} />
                <div className="opportunity-skeleton-box" style={{ height: '22px', width: '85%' }} />
                <div className="opportunity-skeleton-box" style={{ height: '54px', width: '100%' }} />
                <div className="opportunity-skeleton-box" style={{ height: '44px', width: '100%' }} />
              </div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="table-empty">No open opportunities right now. Check back soon.</div>
        ) : (
          <div className="post-grid">
            {opportunities.map((opportunity) => {
              const { hasLimit, remaining, isFull } = getLimitState(opportunity);
              return (
                <article className="post-card" key={opportunity.id}>
                  {opportunity.image ? (
                    <img
                      className="opportunity-home-image"
                      src={absoluteAssetUrl(opportunity.image)}
                      alt={opportunity.title}
                      loading="lazy"
                    />
                  ) : null}
                  <div className="post-meta">
                    <span>{opportunity.type}</span>
                    <span>{opportunity.location || 'Flexible'} · {opportunity.work_mode || 'On-site'}</span>
                  </div>
                  {hasLimit && (
                    <div className={`post-meta opportunity-limit-meta ${isFull ? 'is-full' : ''}`}>
                      <span>
                        {isFull
                          ? '0 applications remaining (Closed)'
                          : `${remaining} of ${opportunity.application_limit} ${
                              remaining === 1 ? 'application' : 'applications'
                            } remaining`}
                      </span>
                    </div>
                  )}
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.description}</p>
                  <button
                    type="button"
                    className="button nexus-primary"
                    disabled={isFull}
                    onClick={() => openModal(opportunity)}
                  >
                    {isFull ? 'Application limit reached' : <>Apply now <ArrowRight size={15} /></>}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedOpportunity && (
        <div
          className="editor-overlay opportunities-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <form className="editor-panel" onSubmit={submitApplication}>
            <div className="editor-header">
              <div>
                <span>Apply for opportunity</span>
                <h2>{selectedOpportunity.title}</h2>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close">
                <X />
              </button>
            </div>

            <div className="editor-body">
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>

              <label>
                Phone number
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>

              <label>
                Brief note / cover summary
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <label className="upload-label">
                CV (PDF, DOC, DOCX)
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setForm({ ...form, cv: e.target.files[0] || null })}
                />
                <span>
                  <Upload size={18} style={{ flexShrink: 0 }} />
                  <span className="upload-file-text">{form.cv ? form.cv.name : 'Upload CV'}</span>
                </span>
              </label>

              <label className="upload-label">
                Application letter (PDF, DOC, DOCX)
                <input
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) =>
                    setForm({ ...form, application_letter: e.target.files[0] || null })
                  }
                />
                <span>
                  <Upload size={18} style={{ flexShrink: 0 }} />
                  <span className="upload-file-text">
                    {form.application_letter ? form.application_letter.name : 'Upload application letter'}
                  </span>
                </span>
              </label>

              {feedback.message && (
                <p className={`form-status ${feedback.type}`}>{feedback.message}</p>
              )}
            </div>

            <div className="editor-footer">
              <button type="button" onClick={closeModal} disabled={submitting}>
                Close
              </button>
              <button
                type="submit"
                className={`admin-primary ${submitting ? 'loading' : ''}`}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </PublicLayout>
  );
}