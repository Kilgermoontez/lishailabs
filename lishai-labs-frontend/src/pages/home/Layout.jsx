import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Menu, MessageCircle, Sparkles, X } from 'lucide-react';
import { absoluteAssetUrl, externalPageUrl, useSiteSettings } from '../../shared/site';

export function Header() {
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();
  return (
    <header className="site-header nexus-header">
      <Link className="brand" to="/" onClick={() => setOpen(false)}>
        {settings.company_logo
          ? <img className="nexus-logo-image" src={absoluteAssetUrl(settings.company_logo)} alt="" />
          : <span className="nexus-logo-mark"><span /></span>}
        <span>{settings.company_name || 'Lishai Labs'}</span>
      </Link>
      <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? 'nav-links open' : 'nav-links'}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link>
        <Link to="/about" onClick={() => setOpen(false)}>About</Link>
        <Link to="/solutions" onClick={() => setOpen(false)}>Solutions</Link>
        <Link to="/projects" onClick={() => setOpen(false)}>Projects</Link>
        <Link to="/insights" onClick={() => setOpen(false)}>Resources</Link>
        <Link to="/news" onClick={() => setOpen(false)}>News</Link>
        <Link to="/opportunities" onClick={() => setOpen(false)}>Opportunities</Link>
        <Link to="/chat" onClick={() => setOpen(false)}>AI Chat</Link>
        <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
        <Link to="/admin/login" className="nav-signin" onClick={() => setOpen(false)}>Sign in</Link>
        <Link to="/contact" className="nav-contact" onClick={() => setOpen(false)}>Get started <ArrowRight size={16} /></Link>
      </nav>
    </header>
  );
}

export function Footer() {
  const settings = useSiteSettings();
  const socialLinks = [
    ['Facebook', settings.facebook_url, 'f'],
    ['TikTok', settings.tiktok_url, '♪'],
    ['LinkedIn', settings.linkedin_url || settings.linkedin, 'in'],
    ['Instagram', settings.instagram_url, '◎'],
  ];
  const email = settings.email || 'hello@lishailabs.com';
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link className="brand footer-brand" to="/">
            {settings.company_logo
              ? <img className="nexus-logo-image" src={absoluteAssetUrl(settings.company_logo)} alt="" />
              : <span className="brand-mark"><Sparkles size={18} /></span>}
            <span>{settings.company_name || 'Lishai Labs'}</span>
          </Link>
          <p>We design, build and scale intelligent systems that move businesses forward.</p>
          <div className="footer-email">
            <span>Email</span>
            <a href={`mailto:${email}`}>{email}</a>
          </div>
          <div className="footer-socials" aria-label="Social media">
            {socialLinks.map(([label, url, mark]) => {
              const pageUrl = externalPageUrl(url);
              return pageUrl
                ? <a key={label} className={`footer-social-${label.toLowerCase()}`} href={pageUrl} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>{mark}</a>
                : <span key={label} className={`footer-social-placeholder footer-social-${label.toLowerCase()}`} aria-label={`${label} link not configured`} title={`${label} link not configured`}>{mark}</span>;
            })}
          </div>
        </div>
        <div className="footer-links">
          <div><h4>Explore</h4><Link to="/solutions">Solutions</Link><Link to="/projects">Projects</Link><Link to="/opportunities">Opportunities</Link><Link to="/chat">Help & Support - AI Chat</Link></div>
          <div><h4>Company</h4><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/admin/login">Admin</Link></div>
          <div><h4>Legal</h4><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cookies">Cookies</Link></div>
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 Lishai Labs. All rights reserved.</span><span>Human ideas. Intelligent systems.</span></div>
    </footer>
  );
}

export function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <Link className="floating-chat-link" to="/chat" aria-label="Open Help & Support AI chat" title="Help & Support - AI Chat">
        <MessageCircle />
        <span>Help & Support</span>
      </Link>
    </>
  );
}