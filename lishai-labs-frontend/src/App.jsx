import { Component } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { HomePage } from './pages/home/HomePage';
import { ChatPage } from './pages/home/ChatPage';
import { SolutionsPage, ProjectsPage, AboutPage, InsightsPage, NewsPage, OpportunitiesPage, OpportunityDetailPage, ApplyProjectPage, PolicyPage, ContactPage, DemoPage } from './pages/home/PublicPages';
import { AdminLogin } from './pages/auth/AdminLogin';
import { AdminLayout, AdminProtected } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { CrudManager } from './pages/admin/CrudManager';
import { OpportunitiesManager } from './pages/admin/OpportunitiesManager';
import { MessagesPage } from './pages/admin/MessagesPage';
import { ProjectApplicationsPage, OpportunityApplicationsPage } from './pages/admin/ProjectApplicationsPage';
import { PoliciesPage } from './pages/admin/PoliciesPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { ActivityLogs } from './pages/admin/ActivityLogs';
class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('Lish AI Labs route error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="route-error-page">
          <h1>We hit a temporary problem.</h1>
          <p>Please refresh the page or use the Help & Support option.</p>
          <a className="button button-primary" href="/">Return home</a>
        </div>
      );
    }
    return this.props.children;
  }
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/solutions" element={<SolutionsPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/opportunities" element={<OpportunitiesPage />} />
      <Route path="/opportunities/:slug" element={<OpportunityDetailPage />} />
      <Route path="/apply" element={<ApplyProjectPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/privacy" element={<PolicyPage type="privacy" />} />
      <Route path="/terms" element={<PolicyPage type="terms" />} />
      <Route path="/cookies" element={<PolicyPage type="cookies" />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminProtected><AdminLayout><AdminOverview /></AdminLayout></AdminProtected>} />
      <Route path="/admin/posts" element={<AdminProtected><AdminLayout><CrudManager type="posts" /></AdminLayout></AdminProtected>} />
      <Route path="/admin/projects" element={<AdminProtected><AdminLayout><CrudManager type="projects" /></AdminLayout></AdminProtected>} />
      <Route path="/admin/opportunities" element={<AdminProtected><AdminLayout><OpportunitiesManager /></AdminLayout></AdminProtected>} />
      <Route path="/admin/messages" element={<AdminProtected><AdminLayout><MessagesPage /></AdminLayout></AdminProtected>} />
      <Route path="/admin/applications" element={<AdminProtected><AdminLayout><ProjectApplicationsPage /></AdminLayout></AdminProtected>} />
      <Route path="/admin/opportunity-applications" element={<AdminProtected><AdminLayout><OpportunityApplicationsPage /></AdminLayout></AdminProtected>} />
      <Route path="/admin/policies" element={<AdminProtected><AdminLayout><PoliciesPage /></AdminLayout></AdminProtected>} />
      <Route path="/admin/activity-logs" element={<AdminProtected><AdminLayout><ActivityLogs /></AdminLayout></AdminProtected>} />
      <Route path="/admin/settings" element={<AdminProtected><AdminLayout><SettingsPage /></AdminLayout></AdminProtected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <RouteErrorBoundary><BrowserRouter><AppRoutes /></BrowserRouter></RouteErrorBoundary>;
}