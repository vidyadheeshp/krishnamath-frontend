import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import AppLayout from '../layouts/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import ExpendituresPage from '../pages/ExpendituresPage';
import LoginPage from '../pages/LoginPage';
import MetadataPage from '../pages/MetadataPage';
import BookingsPage from '../pages/BookingsPage';
import ReportsPage from '../pages/ReportsPage';
import SevasPage from '../pages/SevasPage';
import { loadCurrentUser } from '../store/authSlice';

function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth.token);

  if (!token) {
    return <Navigate to="/login" replace />;
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

  return null;
}

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
          <Route path="/" element={<DashboardPage />} />
          <Route path="/metadata" element={<MetadataPage />} />
          <Route path="/sevas" element={<SevasPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/expenditures" element={<ExpendituresPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
