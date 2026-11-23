import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, CircleUserRound, FileText, Globe2, LogOut, Menu, MessageSquareText, PenTool, Plus, Rocket, Settings, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { API, absoluteAssetUrl, authHeaders, notifyAdmin } from '../../shared/site';

export function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    fetch(`${API}/settings`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : {})
      .then(setSettings)
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

  return (
    <>
      <div className="admin-page-heading"><div><span>Administration</span><h1>Settings</h1></div></div>
      <div className="settings-layout wide-settings">
        <form className="settings-form" onSubmit={saveSettings}>
          <h2>Company profile</h2>
          <div className="brand-settings-preview">
            {settings.company_logo
              ? <img src={absoluteAssetUrl(settings.company_logo)} alt="Company logo" />
              : <div><Sparkles /></div>}
            <label className="upload-label brand-upload">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={uploadLogo} />
              <span><Upload /> Change logo</span>
            </label>
          </div>
          <div className="form-grid">
            <label>Company name<input value={settings.company_name || ''} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} /></label>
            <label>Email<input type="email" value={settings.email || ''} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></label>
            <label>Phone<input value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></label>
            <label>Office address<input value={settings.office_address || ''} onChange={(e) => setSettings({ ...settings, office_address: e.target.value })} /></label>
            <label>Tagline<input value={settings.tagline || ''} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} /></label>
            <label>Home headline<input value={settings.hero_title || ''} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} /></label>
            <label className="form-grid-full">Home description<textarea rows={4} value={settings.hero_description || ''} onChange={(e) => setSettings({ ...settings, hero_description: e.target.value })} /></label>
            <label className="upload-label form-grid-full">Hero / robot image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={uploadHeroImage} /><span><Upload /> Change hero image</span></label>
            {settings.hero_image && <div className="hero-settings-preview form-grid-full"><img src={absoluteAssetUrl(settings.hero_image)} alt="Home hero preview" /></div>}
            <h3 className="form-grid-full">Social media links</h3>
            <label>Facebook<input type="url" placeholder="https://facebook.com/..." value={settings.facebook_url || ''} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} /></label>
            <label>TikTok<input type="url" placeholder="https://tiktok.com/@..." value={settings.tiktok_url || ''} onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })} /></label>
            <label>LinkedIn<input type="url" placeholder="https://linkedin.com/company/..." value={settings.linkedin_url || settings.linkedin || ''} onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })} /></label>
            <label>Instagram<input type="url" placeholder="https://instagram.com/..." value={settings.instagram_url || ''} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></label>
            <h3 className="form-grid-full">Home mission section</h3>
            <label className="form-grid-full">Mission title<input value={settings.home_about_title || ''} onChange={(e) => setSettings({ ...settings, home_about_title: e.target.value })} /></label>
            <label className="form-grid-full">Mission description<textarea rows={4} value={settings.home_about_description || ''} onChange={(e) => setSettings({ ...settings, home_about_description: e.target.value })} /></label>
            <label className="upload-label form-grid-full">Mission image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'home_about_image', 'Mission image')} /><span><Upload /> Change mission image</span></label>
            {settings.home_about_image && <div className="hero-settings-preview form-grid-full"><img src={absoluteAssetUrl(settings.home_about_image)} alt="Mission preview" /></div>}
            {[1, 2, 3].map((number) => (
              <div className="pillar-admin-grid form-grid-full" key={number}>
                <h3>Pillar {number}</h3>
                <label>Title<input value={settings[`home_pillar_${number}_title`] || ''} onChange={(e) => setSettings({ ...settings, [`home_pillar_${number}_title`]: e.target.value })} /></label>
                <label>Description<textarea rows={3} value={settings[`home_pillar_${number}_description`] || ''} onChange={(e) => setSettings({ ...settings, [`home_pillar_${number}_description`]: e.target.value })} /></label>
                <label className="upload-label">Representative image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, `home_pillar_${number}_image`, `Pillar ${number} image`)} /><span><Upload /> Upload image</span></label>
                {settings[`home_pillar_${number}_image`] && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings[`home_pillar_${number}_image`])} alt={`Pillar ${number} preview`} /></div>}
              </div>
            ))}
            <h3 className="form-grid-full">Demo video & showcase</h3>
            <label className="form-grid-full">Demo page title<input value={settings.demo_title || ''} onChange={(e) => setSettings({ ...settings, demo_title: e.target.value })} /></label>
            <label className="form-grid-full">Demo description<textarea rows={3} value={settings.demo_description || ''} onChange={(e) => setSettings({ ...settings, demo_description: e.target.value })} /></label>
            <label className="upload-label form-grid-full">Demo video (up to 15 minutes)<input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={uploadDemoVideo} /><span><Upload /> Upload demo video</span></label>
            {settings.demo_video && <div className="hero-settings-preview form-grid-full"><video src={absoluteAssetUrl(settings.demo_video)} controls /></div>}
            <div className="demo-admin-card form-grid-full">
              <h3>AI & Data Annotation</h3>
              <label>Title<input value={settings.demo_ai_title || ''} onChange={(e) => setSettings({ ...settings, demo_ai_title: e.target.value })} /></label>
              <label>Description<textarea rows={3} value={settings.demo_ai_description || ''} onChange={(e) => setSettings({ ...settings, demo_ai_description: e.target.value })} /></label>
              <label className="upload-label">Showcase image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'demo_ai_image', 'AI & Data Annotation image')} /><span><Upload /> Upload image</span></label>
              {settings.demo_ai_image && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings.demo_ai_image)} alt="AI annotation preview" /></div>}
            </div>
            <div className="demo-admin-card form-grid-full">
              <h3>AI Engineering</h3>
              <label>Title<input value={settings.demo_engineering_title || ''} onChange={(e) => setSettings({ ...settings, demo_engineering_title: e.target.value })} /></label>
              <label>Description<textarea rows={3} value={settings.demo_engineering_description || ''} onChange={(e) => setSettings({ ...settings, demo_engineering_description: e.target.value })} /></label>
              <label className="upload-label">Showcase image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'demo_engineering_image', 'AI Engineering image')} /><span><Upload /> Upload image</span></label>
              {settings.demo_engineering_image && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings.demo_engineering_image)} alt="AI engineering preview" /></div>}
            </div>
            <div className="demo-admin-card form-grid-full">
              <h3>Software Development</h3>
              <label>Title<input value={settings.demo_software_title || ''} onChange={(e) => setSettings({ ...settings, demo_software_title: e.target.value })} /></label>
              <label>Description<textarea rows={3} value={settings.demo_software_description || ''} onChange={(e) => setSettings({ ...settings, demo_software_description: e.target.value })} /></label>
              <label className="upload-label">Showcase image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={(e) => uploadSettingImage(e, 'demo_software_image', 'Software Development image')} /><span><Upload /> Upload image</span></label>
              {settings.demo_software_image && <div className="admin-image-preview"><img src={absoluteAssetUrl(settings.demo_software_image)} alt="Software development preview" /></div>}
            </div>
          </div>
          <button className={`admin-primary ${saving ? 'loading' : ''}`} type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
        </form>
        <form className="settings-form" onSubmit={savePassword}>
          <h2>Change password</h2>
          <label>Current password<input type="password" required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label>
          <label>New password<input type="password" required minLength={8} value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label>
          <label>Confirm new password<input type="password" required value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} /></label>
          {saved && <p className="form-status">{saved}</p>}
          <button className={`admin-primary ${saving ? 'loading' : ''}`} type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update password'}</button>
        </form>
      </div>
    </>
  );
}
