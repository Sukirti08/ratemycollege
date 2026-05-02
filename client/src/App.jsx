import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { useAuthStore } from './store/authStore';
import { useToastStore } from './store/toastStore';

// Lazy-load all pages
const Home            = React.lazy(() => import('./pages/Home'));
const CollegeDetail   = React.lazy(() => import('./pages/CollegeDetail'));
const ProfessorDetail = React.lazy(() => import('./pages/ProfessorDetail'));
const Leaderboard     = React.lazy(() => import('./pages/Leaderboard'));
const Oracle          = React.lazy(() => import('./pages/Oracle'));
const Trends          = React.lazy(() => import('./pages/Trends'));
const Compare         = React.lazy(() => import('./pages/Compare'));
const WriteReview     = React.lazy(() => import('./pages/WriteReview'));
const AdmissionSeason = React.lazy(() => import('./pages/AdmissionSeason'));
const Profile         = React.lazy(() => import('./pages/Profile'));

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}

function AppRoutes() {
  const { checkAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { error: showErrorToast } = useToastStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    if (errorParam === 'invalid_college_email') {
      showErrorToast('Sign in failed: Please use your official college email address (.ac.in or .edu.in).');
      // Clear the query parameter from the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, showErrorToast]);

  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/college/:id"    element={<CollegeDetail />} />
        <Route path="/professor/:id"  element={<ProfessorDetail />} />
        <Route path="/leaderboard"    element={<Leaderboard />} />
        <Route path="/oracle"         element={<Oracle />} />
        <Route path="/trends"         element={<Trends />} />
        <Route path="/compare"        element={<Compare />} />
        <Route path="/write-review"   element={<WriteReview />} />
        <Route path="/jee"            element={<AdmissionSeason />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-surface">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  );
}
