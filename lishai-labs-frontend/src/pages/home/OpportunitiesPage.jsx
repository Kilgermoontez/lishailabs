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
      <section className="section insight-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Careers & partnerships</span>
            <h1>Available opportunities.</h1>
          </div>
          <p>Explore open roles, internships, training cohorts, tenders, and partnerships.</p>
        </div>

        {loading ? (
          <div className="table-empty">Loading opportunities...</div>
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
                    />
                  ) : null}
                  <div className="post-meta">
                    <span>{opportunity.type}</span>
                    <span>{opportunity.location || 'Flexible'} · {opportunity.work_mode || 'On-site'}</span>
                  </div>
                  {hasLimit && (
                    <div className="post-meta">
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
        <div className="editor-overlay">
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
                  rows={5}
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
                  <Upload /> {form.cv ? form.cv.name : 'Upload CV'}
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
                  <Upload /> {form.application_letter ? form.application_letter.name : 'Upload application letter'}
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