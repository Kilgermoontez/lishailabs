import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Search, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders, notifyAdmin } from '../../shared/site';

export function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState(null);
  useEffect(() => {
    fetch(`${API}/settings`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : {})
      .then(setSettings)
      .catch(() => {});
    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then((response) => response.ok ? response.json() : {})
      .then((data) => {
        if (data.admin) {
          setAdmin(data.admin);
          if (data.admin.avatar) {
            setAdminAvatarPreview(data.admin.avatar);
          }
        }
      })
      .catch(() => {});
  }, []);
  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaved('Saving settings...');
    try {
      const response = await fetch(`${API}/settings`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(settings) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to save settings.');
      setSaved('Settings saved.');
      window.dispatchEvent(new CustomEvent('lishai-settings-updated'));
      notifyAdmin('Settings saved successfully.');
    } catch (error) {
      setSaved(error.message);
      notifyAdmin(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  const savePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      setSaved('New passwords do not match.');
      return;
    }
    setSaving(true);
    setSaved('Updating password...');
    try {
      const response = await fetch(`${API}/auth/password`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(password) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update password.');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaved(data.message);
      notifyAdmin(data.message);
    } catch (error) {
      setSaved(error.message);
      notifyAdmin(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };
  const uploadLogo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSaved('Uploading logo...');
    const body = new FormData();
    body.append('image', file);
    try {
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload logo.');
      const nextSettings = { ...settings, company_logo: data.url };
      setSettings(nextSettings);
      const saveResponse = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(nextSettings),
      });
      setSaved(saveResponse.ok ? 'Logo uploaded and saved.' : 'Logo uploaded, but settings could not be saved.');
      if (saveResponse.ok) window.dispatchEvent(new CustomEvent('lishai-settings-updated'));
      notifyAdmin(saveResponse.ok ? 'Logo uploaded and saved.' : 'Logo upload could not be saved.', saveResponse.ok ? 'success' : 'error');
    } catch (error) {
      setSaved(error.message);
    } finally {
      event.target.value = '';
    }
  };
  const uploadHeroImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSaved('Uploading home image...');
    const body = new FormData();
    body.append('image', file);
    try {
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload home image.');
      const nextSettings = { ...settings, hero_image: data.url };
      setSettings(nextSettings);
      const saveResponse = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(nextSettings),
      });
      setSaved(saveResponse.ok ? 'Home image uploaded and saved.' : 'Home image uploaded, but settings could not be saved.');
      if (saveResponse.ok) window.dispatchEvent(new CustomEvent('lishai-settings-updated'));
      notifyAdmin(saveResponse.ok ? 'Home image uploaded and saved.' : 'Home image could not be saved.', saveResponse.ok ? 'success' : 'error');
    } catch (error) {
      setSaved(error.message);
    } finally {
      event.target.value = '';
    }
  };
  const uploadSettingImage = async (event, key, label) => {
    const file = event.target.files[0];
    if (!file) return;
    setSaved(`Uploading ${label.toLowerCase()}...`);
    const body = new FormData();
    body.append('image', file);
    try {
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Unable to upload ${label.toLowerCase()}.`);
      const nextSettings = { ...settings, [key]: data.url };
      setSettings(nextSettings);
      const saveResponse = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(nextSettings),
      });
      setSaved(saveResponse.ok ? `${label} uploaded and saved.` : `${label} uploaded, but settings could not be saved.`);
      if (saveResponse.ok) window.dispatchEvent(new CustomEvent('lishai-settings-updated'));
      notifyAdmin(saveResponse.ok ? `${label} uploaded and saved.` : `${label} could not be saved.`, saveResponse.ok ? 'success' : 'error');
    } catch (error) {
      setSaved(error.message);
    } finally {
      event.target.value = '';
    }
  };

  const uploadDemoVideo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSaved('Uploading demo video...');
    const body = new FormData();
    body.append('video', file);
    try {
      const response = await fetch(`${API}/upload-video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload demo video.');
      const nextSettings = { ...settings, demo_video: data.url };
      setSettings(nextSettings);
      const saveResponse = await fetch(`${API}/settings`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(nextSettings),
      });
      setSaved(saveResponse.ok ? 'Demo video uploaded and saved.' : 'Demo video uploaded, but settings could not be saved.');
      if (saveResponse.ok) window.dispatchEvent(new CustomEvent('lishai-settings-updated'));
      notifyAdmin(saveResponse.ok ? 'Demo video uploaded and saved.' : 'Demo video could not be saved.', saveResponse.ok ? 'success' : 'error');
    } catch (error) {
      setSaved(error.message);
      notifyAdmin(error.message, 'error');
    } finally {
      event.target.value = '';
    }
  };

  const uploadAdminAvatar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSaved('Uploading profile picture...');
    const body = new FormData();
    body.append('avatar', file);
    try {
      const response = await fetch(`${API}/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('lishai_token') || ''}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to upload profile picture.');
      setAdmin(data.admin);
      setAdminAvatarPreview(data.avatar);
      const currentAdmin = JSON.parse(localStorage.getItem('lishai_admin') || '{}');
      const updatedAdmin = { ...currentAdmin, avatar: data.avatar };
      localStorage.setItem('lishai_admin', JSON.stringify(updatedAdmin));
      setSaved(data.message);
      notifyAdmin(data.message);
      // Notify AdminLayout to refresh avatar
      window.dispatchEvent(new CustomEvent('lishai-avatar-updated', { detail: data.avatar }));
    } catch (error) {
      setSaved(error.message);
      notifyAdmin(error.message, 'error');
    } finally {
      event.target.value = '';
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesSearch = (...terms) => {
    if (!normalizedQuery) return true;
    return terms.some((term) => String(term || '').toLowerCase().includes(normalizedQuery));
  };

  const showLogo = matchesSearch('company profile', 'logo', 'change logo', 'brand');
  const showCompanyName = matchesSearch('company profile', 'company name', settings.company_name);
  const showEmail = matchesSearch('company profile', 'email', settings.email);
  const showPhone = matchesSearch('company profile', 'phone', settings.phone);
  const showOfficeAddress = matchesSearch('company profile', 'office address', 'location', settings.office_address);
  const showTagline = matchesSearch('company profile', 'tagline', settings.tagline);
  const showHeroTitle = matchesSearch('company profile', 'home headline', 'hero title', settings.hero_title);
  const showHeroDescription = matchesSearch('company profile', 'home description', 'hero description', settings.hero_description);
  const showHeroImage = matchesSearch('company profile', 'hero', 'robot image', 'home image', 'change hero image');

  const showFacebook = matchesSearch('social media links', 'facebook', settings.facebook_url);
  const showTiktok = matchesSearch('social media links', 'tiktok', settings.tiktok_url);
  const showLinkedin = matchesSearch('social media links', 'linkedin', settings.linkedin_url, settings.linkedin);
  const showInstagram = matchesSearch('social media links', 'instagram', settings.instagram_url);
  const showSocialSection = showFacebook || showTiktok || showLinkedin || showInstagram;

  const showMissionTitle = matchesSearch('home mission section', 'mission title', 'about', settings.home_about_title);
  const showMissionDescription = matchesSearch('home mission section', 'mission description', 'about', settings.home_about_description);
  const showMissionImage = matchesSearch('home mission section', 'mission image', 'change mission image', 'about');
  const visiblePillars = [1, 2, 3].filter((number) =>
    matchesSearch(
      'home mission section',
      'pillar',
      `pillar ${number}`,
      'representative image',
      settings[`home_pillar_${number}_title`],
      settings[`home_pillar_${number}_description`]
    )
  );
  const showMissionSection = showMissionTitle || showMissionDescription || showMissionImage || visiblePillars.length > 0;

  const showDemoTitle = matchesSearch('demo video & showcase', 'demo page title', settings.demo_title);
  const showDemoDescription = matchesSearch('demo video & showcase', 'demo description', settings.demo_description);
  const showDemoVideo = matchesSearch('demo video & showcase', 'demo video', 'upload demo video');
  const showDemoAi = matchesSearch('demo video & showcase', 'ai & data annotation', 'data annotation', settings.demo_ai_title, settings.demo_ai_description);
  const showDemoEngineering = matchesSearch('demo video & showcase', 'ai engineering', settings.demo_engineering_title, settings.demo_engineering_description);
  const showDemoSoftware = matchesSearch('demo video & showcase', 'software development', settings.demo_software_title, settings.demo_software_description);
  const showDemoSection = showDemoTitle || showDemoDescription || showDemoVideo || showDemoAi || showDemoEngineering || showDemoSoftware;

  const showCompanyForm =
    showLogo ||
    showCompanyName ||
    showEmail ||
    showPhone ||
    showOfficeAddress ||
    showTagline ||
    showHeroTitle ||
    showHeroDescription ||
    showHeroImage ||
    showSocialSection ||
    showMissionSection ||
    showDemoSection;

  const showAdminProfile = matchesSearch('admin profile', 'profile picture', 'avatar', 'name', 'email', admin?.name, admin?.email);
  const showChangePassword = matchesSearch('change password', 'current password', 'new password', 'confirm new password', 'update password', 'security');
  const hasAnySettingsMatch = showCompanyForm || showAdminProfile || showChangePassword;

  return (
    <>
      <div className="admin-page-heading"><div><span>Administration</span><h1>Settings</h1></div></div>
      <div className="admin-realtime-search" style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '18px', maxWidth: '460px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', color: '#64748b', pointerEvents: 'none' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search settings (e.g. logo, social, mission, pillar, demo, password)..."
          aria-label="Search settings"
          style={{ width: '100%', padding: '11px 40px 11px 42px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.95rem', boxSizing: 'border-box' }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="Clear settings search"
            style={{ position: 'absolute', right: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {!hasAnySettingsMatch ? (
        <div className="table-empty">No settings match "{searchQuery}".</div>
      ) : (
        <div className="settings-layout wide-settings">
          {showCompanyForm && (
            <form className="settings-form" onSubmit={saveSettings}>
              <h2>Company profile</h2>
              {showLogo && (
                <div className="brand-settings-preview">
                  {settings.company_logo
                    ? <img src={absoluteAssetUrl(settings.company_logo)} alt="Company logo" />
                    : <div><Sparkles /></div>}
                  <label className="upload-label brand-upload">
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={uploadLogo} />
                    <span><Upload /> Change logo</span>
                  </label>
                </div>
              )}
              <div className="form-grid">
                {showCompanyName && <label>Company name<input value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></label>}
                {showEmail && <label>Email<input type="email" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></label>}
                {showPhone && <label>Phone<input value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></label>}
                {showOfficeAddress && <label>Office address<input value={settings.office_address || ''} onChange={(e) => setSettings({ ...settings, office_address: e.target.value })} /></label>}
                {showTagline && <label>Tagline<input value={settings.tagline || ''} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} /></label>}
                {showHeroTitle && <label>Home headline<input value={settings.hero_title || ''} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} /></label>}
                {showHeroDescription && <label className="form-grid-full">Home description<textarea rows={4} value={settings.hero_description || ''} onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })} /></label>}
                {showHeroImage && <label className="upload-label form-grid-full">Hero / robot image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={uploadHeroImage} /><span><Upload /> Change hero image</span></label>}
                {showHeroImage && settings.hero_image && <div className="hero-settings-preview form-grid-full"><img src={absoluteAssetUrl(settings.hero_image)} alt="Home hero preview" /></div>}
                {showSocialSection && <h3 className="form-grid-full">Social media links</h3>}
                {showFacebook && <label>Facebook<input type="url" placeholder="https://facebook.com/..." value={settings.facebook_url || ''} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} /></label>}
                {showTiktok && <label>TikTok<input type="url" placeholder="https://tiktok.com/@..." value={settings.tiktok_url || ''} onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })} /></label>}
                {showLinkedin && <label>LinkedIn<input type="url" placeholder="https://linkedin.com/company/..." value={settings.linkedin_url || settings.linkedin || ''} onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })} /></label>}
                {showInstagram && <label>Instagram<input type="url" placeholder="https://instagram.com/..." value={settings.instagram_url || ''} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></label>}
                {showMissionSection && <h3 className="form-grid-full">Home mission section</h3>}
                {showMissionTitle && <label className="form-grid-full">Mission title<input value={settings.home_about_title || ''} onChange={(e) => setSettings({ ...settings, home_about_title: e.target.value })} /></label>}
                {showMissionDescription && <label className="form-grid-full">Mission description<textarea rows={4} value={settings.home_about_description || ''} onChange={(e) => setSettings({ ...settings, home_about_description: e.target.value })} /></label>}
                {showMissionImage && <label className="upload-label form-grid-full">Mission image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'home_about_image', 'Mission image')} /><span><Upload /> Change mission image</span></label>}
                {showMissionImage && settings.home_about_image && <div className="hero-settings-preview form-grid-full"><img src={absoluteAssetUrl(settings.home_about_image)} alt="Mission preview" /></div>}
                {visiblePillars.map((number) => (
                  <div className="pillar-admin-grid form-grid-full" key={number}>
                    <h3>Pillar {number}</h3>
                    <label>Title<input value={settings[`home_pillar_${number}_title`] || ''} onChange={(e) => setSettings({ ...settings, [`home_pillar_${number}_title`]: e.target.value })} /></label>
                    <label>Description<textarea rows={3} value={settings[`home_pillar_${number}_description`] || ''} onChange={(e) => setSettings({ ...settings, [`home_pillar_${number}_description`]: e.target.value })} /></label>
                    <label className="upload-label">Representative image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, `home_pillar_${number}_image`, `Pillar ${number} image`)} /><span><Upload /> Upload image</span></label>
                    {settings[`home_pillar_${number}_image`] && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings[`home_pillar_${number}_image`])} alt={`Pillar ${number} preview`} /></div>}
                  </div>
                ))}
                {showDemoSection && <h3 className="form-grid-full">Demo video & showcase</h3>}
                {showDemoTitle && <label className="form-grid-full">Demo page title<input value={settings.demo_title || ''} onChange={(e) => setSettings({ ...settings, demo_title: e.target.value })} /></label>}
                {showDemoDescription && <label className="form-grid-full">Demo description<textarea rows={3} value={settings.demo_description || ''} onChange={(e) => setSettings({ ...settings, demo_description: e.target.value })} /></label>}
                {showDemoVideo && <label className="upload-label form-grid-full">Demo video (up to 15 minutes)<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={uploadDemoVideo} /><span><Upload /> Upload demo video</span></label>}
                {showDemoVideo && settings.demo_video && <div className="hero-settings-preview form-grid-full"><video src={absoluteAssetUrl(settings.demo_video)} controls /></div>}
                {showDemoAi && (
                  <div className="demo-admin-card form-grid-full">
                    <h3>AI & Data Annotation</h3>
                    <label>Title<input value={settings.demo_ai_title || ''} onChange={(e) => setSettings({ ...settings, demo_ai_title: e.target.value })} /></label>
                    <label>Description<textarea rows={3} value={settings.demo_ai_description || ''} onChange={(e) => setSettings({ ...settings, demo_ai_description: e.target.value })} /></label>
                    <label className="upload-label">Showcase image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'demo_ai_image', 'AI & Data Annotation image')} /><span><Upload /> Upload image</span></label>
                    {settings.demo_ai_image && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings.demo_ai_image)} alt="AI annotation preview" /></div>}
                  </div>
                )}
                {showDemoEngineering && (
                  <div className="demo-admin-card form-grid-full">
                    <h3>AI Engineering</h3>
                    <label>Title<input value={settings.demo_engineering_title || ''} onChange={(e) => setSettings({ ...settings, demo_engineering_title: e.target.value })} /></label>
                    <label>Description<textarea rows={3} value={settings.demo_engineering_description || ''} onChange={(e) => setSettings({ ...settings, demo_engineering_description: e.target.value })} /></label>
                    <label className="upload-label">Showcase image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'demo_engineering_image', 'AI Engineering image')} /><span><Upload /> Upload image</span></label>
                    {settings.demo_engineering_image && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings.demo_engineering_image)} alt="AI engineering preview" /></div>}
                  </div>
                )}
                {showDemoSoftware && (
                  <div className="demo-admin-card form-grid-full">
                    <h3>Software Development</h3>
                    <label>Title<input value={settings.demo_software_title || ''} onChange={(e) => setSettings({ ...settings, demo_software_title: e.target.value })} /></label>
                    <label>Description<textarea rows={3} value={settings.demo_software_description || ''} onChange={(e) => setSettings({ ...settings, demo_software_description: e.target.value })} /></label>
                    <label className="upload-label">Showcase image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'demo_software_image', 'Software Development image')} /><span><Upload /> Upload image</span></label>
                    {settings.demo_software_image && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings.demo_software_image)} alt="Software development preview" /></div>}
                  </div>
                )}
              </div>
              <button className={`admin-primary ${saving ? 'loading' : ''}`} type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
            </form>
          )}
          {showAdminProfile && (
            <form className="settings-form" onSubmit={savePassword}>
              <h2>Admin profile</h2>
              <div className="admin-profile-picture-preview">
                {adminAvatarPreview
                  ? <img src={absoluteAssetUrl(adminAvatarPreview)} alt="Admin profile picture" />
                  : <div><CircleUserRound /></div>}
                <label className="upload-label admin-avatar-upload">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadAdminAvatar} />
                  <span><Upload /> Change profile picture</span>
                </label>
              </div>
              {admin && <div className="admin-profile-info">
                <p><strong>Name:</strong> {admin.name}</p>
                <p><strong>Email:</strong> {admin.email}</p>
              </div>}
            </form>
          )}
          {showChangePassword && (
            <form className="settings-form" onSubmit={savePassword}>
              <h2>Change password</h2>
              <label>Current password<input type="password" required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label>
              <label>New password<input type="password" required minLength={8} value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label>
              <label>Confirm new password<input type="password" required value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} /></label>
              {saved && <p className="form-status">{saved}</p>}
              <button className={`admin-primary ${saving ? 'loading' : ''}`} type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</button>
            </form>
          )}
        </div>
      )}
    </>
  );
}