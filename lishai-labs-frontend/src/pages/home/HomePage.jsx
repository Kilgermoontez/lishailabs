import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BrainCircuit, Code2, Cpu, Globe2, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import { absoluteAssetUrl, fallbackPosts, fallbackProjects, useApi, useSiteSettings } from '../../shared/site';
import { PublicLayout } from './Layout';

export function HomePage() {
  const projectData = useApi('/projects?status=published&limit=3', { rows: fallbackProjects });
  const postData = useApi('/posts?status=published&limit=3', { rows: fallbackPosts });
  const opportunityData = useApi('/opportunities?status=published&limit=3', { rows: [] });
  const settings = useSiteSettings();
  const projects = projectData.data?.rows || fallbackProjects;
  const posts = postData.data?.rows || fallbackPosts;
  const opportunities = opportunityData.data?.rows || [];
  return (
    <PublicLayout>
      <section className="hero-section">
        <div className="nexus-skyline" />
        <div className="nexus-grid" />
        <div className="hero-content">
          <div className="nexus-pill"><Sparkles size={14} /> Next-Gen AI Solutions</div>
          <h1>{settings.hero_title || 'Innovate. Automate. Grow with AI.'}</h1>
          <p>{settings.hero_description || 'Lishai Labs empowers people and businesses with cutting-edge artificial intelligence tools to work smarter, move faster and build a better tomorrow.'}</p>
          <div className="hero-actions">
            <Link className="button nexus-primary" to="/solutions">Explore our solutions <ArrowRight size={18} /></Link>
            <Link className="button nexus-secondary" to="/demo">Play <span className="play-dot">▶</span> Watch demo</Link>
          </div>
        </div>
        <div className="nexus-visual" aria-label="Futuristic artificial intelligence robot">
          {settings.hero_image
            ? <img className="hero-custom-image" src={absoluteAssetUrl(settings.hero_image)} alt="Lishai Labs AI technology" />
            : null}
          <div className="nexus-holo holo-chart"><BarChart3 /><span /></div>
          <div className="nexus-holo holo-chip"><Cpu /><span>AI</span></div>
          <div className="nexus-holo holo-cloud"><Globe2 /></div>
          {!settings.hero_image && <div className="nexus-orbit" />}
          {!settings.hero_image && <div className="nexus-globe"><Globe2 /></div>}
          {!settings.hero_image && <svg className="nexus-robot" viewBox="0 0 420 470" role="img" aria-label="AI robot illustration">
            <defs>
              <linearGradient id="shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#edfaff" /><stop offset=".55" stopColor="#72bbef" /><stop offset="1" stopColor="#dcecff" /></linearGradient>
              <linearGradient id="blueShell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#74ddff" /><stop offset="1" stopColor="#145fca" /></linearGradient>
            </defs>
            <ellipse cx="286" cy="446" rx="118" ry="18" fill="#082a78" opacity=".35" />
            <path d="M205 178 C240 158 301 167 328 211 L366 420 L180 420 Z" fill="url(#shell)" stroke="#83d4ff" strokeWidth="3" />
            <path d="M207 192 C174 225 164 284 146 363" fill="none" stroke="url(#shell)" strokeWidth="34" strokeLinecap="round" />
            <circle cx="142" cy="372" r="22" fill="#dff7ff" stroke="#45c7ff" strokeWidth="7" />
            <path d="M305 210 C326 251 334 293 339 342" fill="none" stroke="#dff7ff" strokeWidth="30" strokeLinecap="round" />
            <circle cx="342" cy="353" r="20" fill="#dff7ff" stroke="#36aaff" strokeWidth="6" />
            <path d="M218 194 C254 185 301 202 317 249 L298 395 L183 395 Z" fill="#eefaff" opacity=".92" />
            <path d="M224 235 L288 251 L276 321 L207 308 Z" fill="#bfeaff" stroke="#73cfff" />
            <circle cx="246" cy="273" r="27" fill="#0f58ae" stroke="#54cdfa" strokeWidth="5" />
            <path d="M236 273 C246 257 262 260 270 274 C260 288 246 290 236 273Z" fill="#35d4ff" />
            <path d="M216 95 C257 62 315 76 337 119 L328 193 C301 219 236 216 208 181 Z" fill="url(#shell)" stroke="#96dbff" strokeWidth="4" />
            <path d="M215 116 C203 133 203 158 214 177 L178 173 C165 154 178 114 215 116Z" fill="#1c75d1" />
            <path d="M328 118 C347 126 358 145 356 165 L334 181 Z" fill="#073c96" />
            <path d="M229 108 C258 84 308 96 320 126 L299 145 C273 130 248 135 224 151Z" fill="#102d69" />
            <path d="M236 112 C264 98 294 105 307 128 L290 150 C267 137 245 140 224 154Z" fill="#42bdf5" />
            <ellipse cx="267" cy="153" rx="26" ry="16" fill="#061f5c" stroke="#66d8ff" strokeWidth="4" />
            <ellipse cx="267" cy="153" rx="10" ry="7" fill="#4de0ff" />
            <path d="M208 177 C236 195 303 196 328 176" fill="none" stroke="#77a7d8" strokeWidth="5" />
            <path d="M260 193 L274 193" stroke="#43c9ff" strokeWidth="5" strokeLinecap="round" />
          </svg>}
        </div>
      </section>

      <section className="nexus-benefits">
        <article><span className="benefit-icon">⚡</span><div><b>Powerful AI Tools</b><small>Boost productivity</small></div></article>
        <article><span className="benefit-icon">✓</span><div><b>Secure & Reliable</b><small>Your data, our priority</small></div></article>
        <article><span className="benefit-icon">▲</span><div><b>Cloud-Based</b><small>Access anywhere</small></div></article>
        <article><span className="benefit-icon">◉</span><div><b>24/7 Support</b><small>Always here to help</small></div></article>
      </section>

      <section className="section impact-overview">
        <div className="impact-copy">
          <span className="section-kicker">Our mission</span>
          <h2>{settings.home_about_title}</h2>
          <p>{settings.home_about_description}</p>
          <div className="impact-metrics">
            <div><strong>10,000+</strong><span>Youth trained</span></div>
            <div><strong>47</strong><span>Kenyan counties reached</span></div>
            <div><strong>94</strong><span>Digital labs supported</span></div>
            <div><strong>300+</strong><span>Developers & AI specialists</span></div>
          </div>
        </div>
        {settings.home_about_image
          ? <img className="impact-main-image" src={absoluteAssetUrl(settings.home_about_image)} alt="Lish AI Labs digital innovation" />
          : <div className="impact-main-visual"><BrainCircuit /><span>Digital ecosystems for Africa</span></div>}
      </section>

      <section className="section strategic-pillars">
        <div className="section-heading">
          <div><span className="section-kicker">Our strategic pillars</span><h2>Skills, jobs and responsible innovation.</h2></div>
          <p>Structured training and practical technology create durable economic opportunities while keeping people and communities at the center.</p>
        </div>
        <div className="pillar-grid">
          {[1, 2, 3].map((number) => (
            <article className="pillar-card" key={number}>
              {settings[`home_pillar_${number}_image`]
                ? <img src={absoluteAssetUrl(settings[`home_pillar_${number}_image`])} alt={settings[`home_pillar_${number}_title`]} />
                : <div className="pillar-placeholder">{number === 1 ? <BrainCircuit /> : number === 2 ? <Rocket /> : <ShieldCheck />}</div>}
              <div>
                <span>0{number}</span>
                <h3>{settings[`home_pillar_${number}_title`]}</h3>
                <p>{settings[`home_pillar_${number}_description`]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><span className="section-kicker">What we do</span><h2>AI infrastructure for the next era.</h2></div>
          <p>From strategy to deployment, we bring multidisciplinary expertise to every stage of your AI journey.</p>
        </div>
        <div className="service-grid">
          {[
            [BrainCircuit, 'AI Strategy', 'Opportunity mapping, product strategy and responsible AI roadmaps aligned to measurable outcomes.'],
            [Code2, 'Custom AI Products', 'Purpose-built generative AI, automation and intelligent software designed around your workflows.'],
            [Cpu, 'Machine Learning', 'Predictive models, computer vision and data systems that perform reliably in the real world.'],
            [ShieldCheck, 'AI Transformation', 'Governance, integration and team enablement that turns AI experiments into operating capability.'],
          ].map(([Icon, title, copy]) => (
            <article className="service-card" key={title}><span className="service-icon"><Icon /></span><h3>{title}</h3><p>{copy}</p><Link to="/solutions">Learn more <ArrowRight size={15} /></Link></article>
          ))}
        </div>
      </section>

      <section className="section featured-section">
        <div className="section-heading">
          <div><span className="section-kicker">Selected work</span><h2>Projects that create impact.</h2></div>
          <Link className="text-link" to="/projects">View all projects <ArrowRight size={16} /></Link>
        </div>
        <div className="project-grid">
          {projects.slice(0, 3).map((project, index) => (
            <article className={`project-card project-${index + 1}`} key={project.id}>
              <div className="project-art">
                {project.image
                  ? <img className="project-image" src={absoluteAssetUrl(project.image)} alt={project.title} />
                  : <><div className="project-orbit" /><div className="project-symbol">{index === 0 ? <BrainCircuit /> : index === 1 ? <Globe2 /> : <BarChart3 />}</div></>}
              </div>
              <div className="project-copy"><span>{project.category}</span><h3>{project.title}</h3><p>{project.summary}</p><div className="tag-row">{(Array.isArray(project.tags)
                ? project.tags
                : (() => { try { return JSON.parse(project.tags || '[]'); } catch (_) { return String(project.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean); } })()).slice(0, 3).map((tag) => <b key={tag}>{tag}</b>)}</div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section insight-section">
        <div className="section-heading">
          <div><span className="section-kicker">Latest news</span><h2>What is happening at {settings.company_name || 'Lishai Labs'}.</h2></div>
          <Link className="text-link" to="/news">Read all news <ArrowRight size={16} /></Link>
        </div>
        <div className="post-grid">
          {posts.slice(0, 3).map((post) => (
            <article className="post-card" key={post.id}>
              <div className="post-meta"><span>{post.category}</span><span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recently'}</span></div>
              <h3>{post.title}</h3><p>{post.excerpt}</p><Link to="/insights">Read story <ArrowRight size={15} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="project-application-banner">
        <div>
          <span className="section-kicker">Start a project</span>
          <h2>Have an AI idea worth building?</h2>
          <p>Tell us what you want to create. Our team will review your goals and recommend the right path forward.</p>
        </div>
        <Link className="button button-light" to="/apply">Apply for a project <ArrowRight size={18} /></Link>
      </section>

      {opportunities.length > 0 && (
        <section className="section insight-section">
          <div className="section-heading">
            <div><span className="section-kicker">Careers & partnerships</span><h2>Available opportunities.</h2></div>
            <Link className="text-link" to="/opportunities">View all opportunities <ArrowRight size={16} /></Link>
          </div>
          <div className="post-grid">
            {opportunities.slice(0, 3).map((opportunity) => {
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
              return (
                <article className="post-card" key={opportunity.id}>
                  {opportunity.image
                    ? <img className="opportunity-home-image" src={absoluteAssetUrl(opportunity.image)} alt={opportunity.title} />
                    : null}
                  <div className="post-meta"><span>{opportunity.type}</span><span>{opportunity.location || 'Flexible'} · {opportunity.work_mode || 'On-site'}</span></div>
                  {hasLimit && (
                    <div className="post-meta">
                      <span>
                        {remaining > 0
                          ? `${remaining} ${remaining === 1 ? 'application' : 'applications'} remaining`
                          : '0 applications remaining (Closed)'}
                      </span>
                    </div>
                  )}
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.description}</p>
                  <Link to="/opportunities">View opportunity <ArrowRight size={15} /></Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="cta-section"><div><span className="section-kicker">Build what’s next</span><h2>Let’s turn your most ambitious idea into reality.</h2></div><Link className="button button-light" to="/contact">Start a conversation <ArrowRight size={18} /></Link></section>
    </PublicLayout>
  );
}