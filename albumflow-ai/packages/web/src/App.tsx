import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layouts
import DashboardLayout from '@/layouts/DashboardLayout';

// Auth
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Dashboard pages
import DashboardPage from '@/pages/DashboardPage';
import CollectionsPage from '@/pages/CollectionsPage';
import CollectionDetailPage from '@/pages/CollectionDetailPage';
import CreateCollectionPage from '@/pages/CreateCollectionPage';
import UploadPage from '@/pages/UploadPage';
import BrandingPage from '@/pages/BrandingPage';
import GoogleDrivePage from '@/pages/GoogleDrivePage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AccountPage from '@/pages/AccountPage';

// Public
import GalleryPage from '@/pages/GalleryPage';
import ConfirmationPage from '@/pages/ConfirmationPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/gallery/:token" element={<GalleryPage />} />
        <Route path="/gallery/:token/confirmed" element={<ConfirmationPage />} />

        {/* Auth routes */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

        {/* Protected dashboard routes */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/new" element={<CreateCollectionPage />} />
          <Route path="collections/:id" element={<CollectionDetailPage />} />
          <Route path="collections/:id/upload" element={<UploadPage />} />
          <Route path="branding" element={<BrandingPage />} />
          <Route path="settings/drive" element={<GoogleDrivePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
