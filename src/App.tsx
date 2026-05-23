import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

import { AdminLayout } from '@/components/admin-layout';
import { ProtectedRoute } from '@/components/protected-route';

import { LoginPage } from '@/routes/login';
import { DashboardPage } from '@/routes/dashboard';
import { UsersPage } from '@/routes/users';
import { SongsPage } from '@/routes/songs';
import { NotificationsPage } from '@/routes/notifications';
import { SubscriptionsPage } from '@/routes/subscriptions';
import { GenresPage } from '@/routes/genres';
import { AnalyticsPage } from '@/routes/analytics';
import { CountriesPage } from '@/routes/countries';
import { PinSetupPage } from '@/routes/pin-setup';
import { PinLoginPage } from '@/routes/pin-login';

/**
 * App — asosiy router
 * -------------------
 * /login          — admin kirish sahifasi
 * /               — /dashboard ga redirect
 * /dashboard, /users, ... — ProtectedRoute orqali himoyalangan
 *
 * Hamma protected sahifalar AdminLayout ichida (sidebar + content).
 */
export default function App() {
  const { init } = useAuth();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      {/* Ochiq routelar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pin-setup" element={<PinSetupPage />} />
      <Route path="/pin-login" element={<PinLoginPage />} />

      {/* Himoyalangan route'lar */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/genres" element={<GenresPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/countries" element={<CountriesPage />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
