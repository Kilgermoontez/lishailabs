import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, BrainCircuit, Building2, Check, Cpu, Globe2, LockKeyhole, MessageSquareText, Rocket, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { API, absoluteAssetUrl, fallbackPosts, fallbackProjects, useApi, useSiteSettings } from '../../shared/site';
import { PublicLayout } from './Layout';

export function SimplePage({ eyebrow, title, intro, children }) {
  return <PublicLayout><section className="page-hero"><div className="hero-grid" /><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></section><section className="section">{children}</section></PublicLayout>;
}

export function DemoPage() {
  const settings = useSiteSettings();
  const showcase = [
    ['demo_ai', BrainCircuit],
    ['demo_engineering', Cpu],
    ['demo_software', Rocket],
  ];
  return (
    <PublicLayout>
      <section className="demo-page">
        <div className="demo-heading">
          <span className="section-kicker">Watch our demo</span>
          <h1>{settings.demo_title || 'See Lish AI Labs in action'}</h1>
          <p>{settings.demo_description || 'Explore how we turn African talent and applied intelligence into practical digital solutions.'}</p>
        </div>
        <div className="demo-video-shell">
          {settings.demo_video
            ? <video src={absoluteAssetUrl(settings.demo_video)} controls preload="metadata" />
            : <div className="demo-video-placeholder"><Rocket /><span>Demo video will appear here</span></div>}
        </div>
        <div className="demo-showcase">
          {showcase.map(([key, Icon]) => (
            <article key={key}>
              {settings[`${key}_image`]
                ? <img src={absoluteAssetUrl(settings[`${key}_image`])} alt={settings[`${key}_title`]} />
                : <div className="demo-showcase-placeholder"><Icon /></div>}
              <div>
                <h2>{settings[`${key}_title`]}</h2>
                <p>{settings[`${key}_description`]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}

export function SolutionsPage() {
  const items = [
    ['Discovery & Strategy', 'We align opportunity, data, risk and business value in a focused AI roadmap.', CompassIcon],
    ['Generative AI Products', 'Chat, search, copilots and content systems grounded in your trusted knowledge.', Sparkles],
    ['Intelligent Automation', 'Agentic workflows that remove friction while keeping people in control.', Zap],
    ['Applied Machine Learning', 'Custom models that learn from your data and improve critical decisions.', BrainCircuit],
  ];
  return <SimplePage eyebrow="Solutions" title="AI expertise, engineered around your ambition." intro="Flexible capabilities for teams that need clarity, velocity and measurable outcomes.">
    <div className="solution-grid">{items.map(([title, copy, Icon]) => <article key={title}><Icon /><h3>{title}</h3><p>{copy}</p><div className="check-row"><Check /> Strategy-led delivery</div><div className="check-row"><Check /> Responsible by design</div></article>)}</div>
  </SimplePage>;
}

function CompassIcon(props) { return <Rocket {...props} />; }

export function ProjectsPage() {
  const { data } = useApi('/projects?status=published&limit=50', { rows: fallbackProjects });
  const projects = data?.rows || fallbackProjects;
  return <SimplePage eyebrow="Our work" title="Technology made visible through impact." intro="A selection of applied AI systems built for product teams, operators and enterprises.">
    <div className="project-grid">{projects.map((project, index) => <article className={`project-card project-${(index % 3) + 1}`} key={project.id}><div className="project-art">{project.image ? <img className="project-image" src={absoluteAssetUrl(project.image)} alt={project.title} /> : <><div className="project-orbit" /><div className="project-symbol"><BrainCircuit /></div></>}</div><div className="project-copy"><span>{project.category}</span><h3>{project.title}</h3><p>{project.summary || project.description}</p></div></article>)}</div>
  </SimplePage>;
}

export function AboutPage() {
  return <SimplePage eyebrow="The company" title="We build AI that earns trust." intro="Lishai Labs is a multidisciplinary team of strategists, engineers, designers and researchers.">
    <div className="about-layout"><div className="about-visual"><div className="about-ring" /><BrainCircuit /></div><div className="about-copy"><h2>Human judgment. Machine intelligence.</h2><p>We believe the best AI systems amplify people rather than replace them. That belief shapes every product decision, model architecture and operational safeguard we create.</p><div className="metric-row"><div><strong>10+</strong><span>Core disciplines</span></div><div><strong>100%</strong><span>Outcome focused</span></div><div><strong>24/7</strong><span>Systems thinking</span></div></div></div></div>
  </SimplePage>;
}

export function InsightsPage() {
  const { data } = useApi('/posts?status=published&limit=50', { rows: fallbackPosts });
  const posts = data?.rows || fallbackPosts;
  return <SimplePage eyebrow="Insights" title="Notes from the frontier." intro="Research, engineering lessons and perspectives on building useful artificial intelligence.">
    <div className="post-grid large-post-grid">{posts.map((post) => <article className="post-card" key={post.id}><div className="post-meta"><span>{post.category}</span><span>{post.author}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><button className="story-button">Read story <ArrowRight size={15} /></button></article>)}</div>
  </SimplePage>;
}

export function NewsPage() {
  const { data } = useApi('/posts?status=published&limit=50', { rows: fallbackPosts });
  const settings = useSiteSettings();
  const posts = data?.rows || fallbackPosts;
  return (
    <SimplePage
      eyebrow={`${settings.company_name || 'Lishai Labs'} News`}
      title="News, launches and company updates."
      intro="Follow the latest work, announcements and ideas from across our team."
    >
      <div className="news-grid">
        {posts.map((post) => (
          <article className="news-card" key={post.id}>
            {post.cover_image
              ? <img src={absoluteAssetUrl(post.cover_image)} alt={post.title} />
              : <div className="news-placeholder"><Sparkles /></div>}
            <div>
              <div className="post-meta"><span>{post.category}</span><span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recently'}</span></div>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </SimplePage>
  );
}

export function OpportunitiesPage() {
  const { data } = useApi('/opportunities?status=published&limit=50', { rows: [] });
  const opportunities = data?.rows || [];
  return (
    <SimplePage
      eyebrow="Join us"
      title="Current opportunities."
      intro="Explore open roles, partnerships and project opportunities at Lishai Labs."
    >
      <div className="opportunities-grid">
        {opportunities.length === 0
          ? <div className="table-empty">There are no published opportunities right now.</div>
          : opportunities.map((opportunity) => (
            <article className="opportunity-card" key={opportunity.id}>
              {opportunity.image
                ? <img src={absoluteAssetUrl(opportunity.image)} alt={opportunity.title} />
                : <div className="opportunity-placeholder"><Rocket /></div>}
              <div className="opportunity-copy">
                <div className="post-meta"><span>{opportunity.type}</span><span>{opportunity.location || 'Flexible'} · {opportunity.work_mode || 'On-site'}</span></div>
                <h3>{opportunity.title}</h3>
                <p>{opportunity.description}</p>
                  {opportunity.application_limit !== null && opportunity.application_limit !== undefined && opportunity.application_limit !== '' && (
                    <div className="application-limit-label">
                      {Number(opportunity.remaining_applications ?? opportunity.application_limit)} of {opportunity.application_limit} applications remaining
                    </div>
                  )}
                <Link className="text-link" to={`/opportunities/${opportunity.slug}`}>View & apply <ArrowRight size={16} /></Link>
              </div>
            </article>
          ))}
      </div>
    </SimplePage>
  );
}

export function OpportunityDetailPage() {
  const { slug } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', description: '', cv: null, applicationLetter: null });

  useEffect(() => {
    let active = true;
    fetch(`${API}/opportunities/${encodeURIComponent(slug)}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (active) setOpportunity(data); })
      .catch(() => { if (active) setOpportunity(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.cv || !form.applicationLetter) {
      setStatus('Please attach both your CV and application letter.');
      return;
    }
    setSubmitting(true);
    setStatus('Submitting application...');
    const body = new FormData();
    body.append('opportunityId', opportunity.id);
    body.append('name', form.name);
    body.append('email', form.email);
    body.append('phone', form.phone);
    body.append('description', form.description);
    body.append('cv', form.cv);
    body.append('application_letter', form.applicationLetter);
    try {
      const response = await fetch(`${API}/opportunity-applications`, { method: 'POST', body });
      const data = await response.json();
      setStatus(data.message);
      if (response.ok) setForm({ name: '', email: '', phone: '', description: '', cv: null, applicationLetter: null });
    } catch (_) {
      setStatus('Unable to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PublicLayout><section className="page-loading"><span className="loading-spinner" />Loading opportunity...</section></PublicLayout>;
  if (!opportunity) return <SimplePage eyebrow="Opportunities" title="Opportunity unavailable." intro="This opportunity may be closed or has moved." />;

  return (
    <PublicLayout>
      <section className="apply-page opportunity-detail-page">
        <div className="apply-copy">
          <span className="section-kicker">{opportunity.type}</span>
          <h1>{opportunity.title}</h1>
          <p>{opportunity.description}</p>
          <div className="apply-benefits">
            <div><Check /> {opportunity.location || 'Flexible location'}</div>
            <div><Check /> {opportunity.work_mode || 'On-site'} work mode</div>
            <div><Check /> Application confirmation by email</div>
            {opportunity.application_limit !== null && opportunity.application_limit !== undefined && opportunity.application_limit !== '' && (
              <div><Check /> {Number(opportunity.remaining_applications ?? opportunity.application_limit)} of {opportunity.application_limit} applications remaining</div>
            )}
          </div>
        </div>
        <form className="contact-form apply-form opportunity-application-form" onSubmit={submit}>
          <label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Email address<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Phone number<input type="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label className="form-grid-full">Brief description<textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell us about your experience and why you are interested..." /></label>
          <label className="document-upload">CV / Resume<input required type="file" accept=".pdf,.doc,.docx" onChange={(event) => setForm({ ...form, cv: event.target.files[0] || null })} /><span>{form.cv ? form.cv.name : 'Choose PDF, DOC or DOCX'}</span></label>
          <label className="document-upload">Application letter<input required type="file" accept=".pdf,.doc,.docx" onChange={(event) => setForm({ ...form, applicationLetter: event.target.files[0] || null })} /><span>{form.applicationLetter ? form.applicationLetter.name : 'Choose PDF, DOC or DOCX'}</span></label>
          <button className={`button button-primary ${submitting ? 'loading' : ''}`} type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit application'}</button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </section>
    </PublicLayout>
  );
}

export function ApplyProjectPage() {
  const [form, setForm] = useState({
    name: '', email: '', company: '', projectType: 'AI product development',
    budget: 'Not decided', timeline: 'Flexible', message: '',
  });
  const [status, setStatus] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setStatus('Submitting...');
    try {
      const response = await fetch(`${API}/project-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      setStatus(response.ok ? data.message : data.message);
      if (response.ok) setForm({ name: '', email: '', company: '', projectType: 'AI product development', budget: 'Not decided', timeline: 'Flexible', message: '' });
    } catch (_) {
      setStatus('We could not submit your application. Please try again.');
    }
  };
  return (
    <PublicLayout>
      <section className="apply-page">
        <div className="apply-copy">
          <span className="section-kicker">Project application</span>
          <h1>Let’s build your next intelligent product.</h1>
          <p>Share your idea, goals and timeline. Our team will review the opportunity and respond with a practical next step.</p>
          <div className="apply-benefits">
            <div><Check /> Product and AI strategy</div>
            <div><Check /> Rapid proof of concept</div>
            <div><Check /> Secure production delivery</div>
          </div>
        </div>
        <form className="contact-form apply-form" onSubmit={submit}>
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Company / organization<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
          <label>Project type<select value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}><option>AI product development</option><option>Generative AI / Copilot</option><option>Machine learning solution</option><option>Computer vision</option><option>AI strategy consulting</option><option>Automation and agents</option></select></label>
          <label>Estimated budget<select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}><option>Not decided</option><option>Under $5,000</option><option>$5,000 - $20,000</option><option>$20,000 - $50,000</option><option>$50,000+</option></select></label>
          <label>Desired timeline<select value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })}><option>Flexible</option><option>Within 1 month</option><option>1 - 3 months</option><option>3 - 6 months</option><option>More than 6 months</option></select></label>
          <label>Project brief<textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe the problem, users and expected outcome..." /></label>
          <button className="button button-primary" type="submit">Submit application <ArrowRight size={18} /></button>
          {status && <p className="form-status">{status}</p>}
        </form>
      </section>
    </PublicLayout>
  );
}

export function PolicyPage({ type }) {
  const names = { privacy: 'Privacy Policy', terms: 'Terms and Conditions', cookies: 'Cookie Policy' };
  const { data } = useApi(`/policies/${type}`);
  return <SimplePage eyebrow="Legal" title={names[type]} intro="Clear terms for a trustworthy partnership."><article className="policy-copy"><h2>{data?.title || names[type]}</h2><p>{data?.content || 'This policy is being prepared.'}</p></article></SimplePage>;
}

export function ContactPage() {
  const settings = useSiteSettings();
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: 'AI project enquiry', message: '' });
  const [status, setStatus] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    setStatus('Sending...');
    try {
      const response = await fetch(`${API}/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      setStatus(response.ok ? result.message : result.message);
      if (response.ok) setForm({ name: '', email: '', company: '', subject: 'AI project enquiry', message: '' });
    } catch (_) { setStatus('We could not send this message. Please try again.'); }
  };
  return <PublicLayout><section className="contact-page"><div className="contact-copy"><span className="section-kicker">Start a conversation</span><h1>What could intelligence unlock for you?</h1><p>Tell us about your challenge. We’ll help you define the opportunity, evaluate the risk and map the fastest path to value.</p><div className="contact-details"><div><MessageSquareText /><span><b>Email</b><a href={`mailto:${settings.email || 'hello@lishailabs.com'}`}>{settings.email || 'hello@lishailabs.com'}</a></span></div>{settings.phone && <div><Building2 /><span><b>Phone</b><a href={`tel:${settings.phone}`}>{settings.phone}</a></span></div>}<div><Building2 /><span><b>Office</b>{settings.office_address || 'Innovation District · Global'}</span></div></div></div><form className="contact-form" onSubmit={submit}><label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Work email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label><label>What can we help with?<select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option>AI project enquiry</option><option>AI strategy</option><option>Platform partnership</option><option>Media enquiry</option></select></label><label>Tell us more<textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label><button className="button button-primary" type="submit">Send enquiry <ArrowRight size={18} /></button>{status && <p className="form-status">{status}</p>}</form></section></PublicLayout>;
}
