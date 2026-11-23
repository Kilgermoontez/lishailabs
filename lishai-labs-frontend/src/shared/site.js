import { useEffect, useState } from 'react';

export const API = import.meta.env.VITE_API_URL || `${window.location.hostname === 'localhost' ? 'http://localhost:5055/api' : 'http://127.0.0.1:5055/api'}`;

export const fallbackProjects = [
  { id: 1, title: 'Nexus Intelligence', category: 'Agentic AI', summary: 'An adaptive operations agent that turns complex workflows into autonomous, observable actions.', tags: ['LLMs', 'Agents'], featured: 1, image: '' },
  { id: 2, title: 'Luma Vision', category: 'Computer Vision', summary: 'Production-grade visual intelligence for quality control and real-time infrastructure monitoring.', tags: ['Vision', 'Edge AI'], featured: 1, image: '' },
  { id: 3, title: 'Atlas Knowledge', category: 'Enterprise AI', summary: 'A secure knowledge layer that grounds every answer in your organization trusted data.', tags: ['RAG', 'Search'], featured: 1, image: '' },
];

export const fallbackPosts = [
  { id: 1, title: 'From AI Demos to Reliable Intelligence', category: 'Engineering', excerpt: 'How we move AI systems from impressive prototypes to dependable production products.', author: 'Lishai Labs', published_at: '2026-11-18' },
  { id: 2, title: 'The Rise of Useful Agent Systems', category: 'Research', excerpt: 'A practical framework for building agents that augment teams without adding operational risk.', author: 'Lishai Labs', published_at: '2026-11-12' },
  { id: 3, title: 'Designing AI With Humans in Mind', category: 'Design', excerpt: 'Trust, transparency and thoughtful interaction are the foundations of every intelligent product.', author: 'Lishai Labs', published_at: '2026-11-05' },
];

export function useApi(path, fallback = null) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = () => fetch(`${API}${path}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((value) => { if (active) setData(value); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    load();
    return () => { active = false; };
  }, [path]);
  return { data, loading };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState({
    company_name: 'Lishai Labs',
    company_logo: '',
    tagline: 'Building intelligent systems for a human future',
    facebook_url: '',
    tiktok_url: '',
    linkedin_url: '',
    instagram_url: '',
    email: 'hello@lishailabs.com',
    phone: '',
    office_address: 'Innovation District · Global',
    hero_title: 'Innovate. Automate. Grow with AI.',
    hero_description: 'Lishai Labs empowers people and businesses with cutting-edge artificial intelligence tools to work smarter, move faster and build a better tomorrow.',
    hero_image: '',
    home_about_title: 'Empowering Africa Through Digital Innovation',
    home_about_description: 'Lish AI Labs bridges the digital divide and creates sustainable employment through digital and AI-powered solutions across Kenya and beyond.',
    home_about_image: '',
    home_pillar_1_title: 'Filling the Digital Skills Gap',
    home_pillar_1_description: 'Equipping youth with relevant digital, technical and AI skills through structured training, mentorship and certification.',
    home_pillar_1_image: '',
    home_pillar_2_title: 'Creating Sustainable Digital Jobs',
    home_pillar_2_description: 'Establishing pathways to freelancing, AI work and enterprise development through digital hubs nationwide.',
    home_pillar_2_image: '',
    home_pillar_3_title: 'Driving Innovation & Responsible AI',
    home_pillar_3_description: 'Developing localized AI solutions that address real-world challenges and promote ethical digital transformation.',
    home_pillar_3_image: '',
    demo_title: 'See Lish AI Labs in action',
    demo_description: 'Explore how we turn African talent and applied intelligence into practical digital solutions.',
    demo_video: '',
    demo_ai_title: 'AI & Data Annotation',
    demo_ai_description: 'Training, annotation and quality systems that help organizations build accurate, responsible AI models.',
    demo_ai_image: '',
    demo_engineering_title: 'AI Engineering',
    demo_engineering_description: 'Applied machine learning, predictive systems, automation and intelligent products designed for real-world impact.',
    demo_engineering_image: '',
    demo_software_title: 'Software Development',
    demo_software_description: 'Secure, scalable enterprise platforms, workforce systems and digital services built for African markets.',
    demo_software_image: '',
  });
  useEffect(() => {
    let active = true;
    const load = () => fetch(`${API}/settings`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : {})
      .then((data) => { if (active) setSettings((current) => ({ ...current, ...data })); })
      .catch(() => {});
    load();
    window.addEventListener('lishai-settings-updated', load);
    window.addEventListener('storage', load);
    return () => {
      active = false;
      window.removeEventListener('lishai-settings-updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);
  return settings;
}

export const absoluteAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || /^data:/i.test(url)) return url;
  const apiBase = import.meta.env.VITE_API_URL || `${window.location.hostname === 'localhost' ? 'http://localhost:5055/api' : 'http://127.0.0.1:5055/api'}`;
  return `${apiBase.replace(/\/api\/?$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const externalPageUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`;
};

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}`,
});

export const notifyAdmin = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('lishai-admin-toast', {
    detail: { message: String(message), type },
  }));
};
