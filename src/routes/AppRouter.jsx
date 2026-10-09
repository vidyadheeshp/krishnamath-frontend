import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { allowedRoles, homePathFor } from '../constants/navigation';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../pages/LoginPage';
import { loadCurrentUser, logout } from '../store/authSlice';

const BlockedDatesPage = lazy(() => import('../pages/BlockedDatesPage'));
const BookingsPage = lazy(() => import('../pages/BookingsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ExpendituresPage = lazy(() => import('../pages/ExpendituresPage'));
const FinanceExpendituresPage = lazy(() => import('../pages/FinanceExpendituresPage'));
const FinanceOverviewPage = lazy(() => import('../pages/FinanceOverviewPage'));
const FinancePaymentsPage = lazy(() => import('../pages/FinancePaymentsPage'));
const MetadataPage = lazy(() => import('../pages/MetadataPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SevaListPage = lazy(() => import('../pages/SevaListPage'));
const ReceiptsPage = lazy(() => import('../pages/ReceiptsPage'));
const ReportsPage = lazy(() => import('../pages/ReportsPage'));
const SevasPage = lazy(() => import('../pages/SevasPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));

function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Renders the page only for the roles that may see it; everyone else lands on their own home page.
function RoleRoute({ path, children }) {
  const role = useSelector((state) => state.auth.user?.role);

  if (!allowedRoles(path).includes(role)) {
    return <Navigate to={homePathFor(role)} replace />;
  }

  return children;
}

function SessionBootstrap() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(loadCurrentUser());
    }
  }, [dispatch, token]);

  // The API client raises this when a request comes back 401 (expired token or deactivated account).
  useEffect(() => {
    const handleExpired = () => dispatch(logout());
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [dispatch]);

  return null;
}

const PageFallback = () => (
  <div className="flex justify-center py-24" role="status" aria-label="Loading">
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
  </div>
);

const guarded = (path, element) => (
  <RoleRoute path={path}>
    <Suspense fallback={<PageFallback />}>{element}</Suspense>
  </RoleRoute>
);

export default function AppRouter() {
  return (
    <BrowserRouter>
      <SessionBootstrap />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={guarded('/', <DashboardPage />)} />
          <Route path="/bookings" element={guarded('/bookings', <BookingsPage />)} />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route path="/seva-list" element={guarded('/seva-list', <SevaListPage />)} />
          <Route path="/blocked-dates" element={guarded('/blocked-dates', <BlockedDatesPage />)} />
          <Route path="/receipts" element={guarded('/receipts', <ReceiptsPage />)} />
          <Route path="/expenditures" element={guarded('/expenditures', <ExpendituresPage />)} />
          <Route path="/sevas" element={guarded('/sevas', <SevasPage />)} />
          <Route path="/metadata" element={guarded('/metadata', <MetadataPage />)} />
          <Route path="/users" element={guarded('/users', <UsersPage />)} />
          <Route path="/finance" element={guarded('/finance', <FinanceOverviewPage />)} />
          <Route path="/finance/payments" element={guarded('/finance/payments', <FinancePaymentsPage />)} />
          <Route path="/finance/expenditures" element={guarded('/finance/expenditures', <FinanceExpendituresPage />)} />
          <Route path="/reports" element={guarded('/reports', <ReportsPage />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
