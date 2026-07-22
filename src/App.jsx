import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Auth Page
import LoginPage from './pages/auth/LoginPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AccountsPage from './pages/admin/AccountsPage';
import ExcelImportPage from './pages/admin/ExcelImportPage';
import SemesterManagementPage from './pages/admin/SemesterManagementPage';
import ReviewManagementPage from './pages/admin/ReviewManagementPage';
import ReviewTrackingPage from './pages/admin/ReviewTrackingPage';
import DefenseManagementPage from './pages/admin/DefenseManagementPage';

// Lecturer Pages
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import AvailabilityPage from './pages/lecturer/AvailabilityPage';
import ReviewScoringPage from './pages/lecturer/ReviewScoringPage';
import DefenseRoomPage from './pages/lecturer/DefenseRoomPage';


// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ReviewRegistrationPage from './pages/student/ReviewRegistrationPage';
import ReviewResultsPage from './pages/student/ReviewResultsPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#64748B' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #F26522', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: 600, color: '#0F172A' }}>Đang xác thực phiên làm việc CPMS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their proper dashboard
    if (user.role === 'SystemAdministrator' || user.role === 'TrainingDepartment' || user.role === 'Moderator') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'Lecturer') {
      return <Navigate to="/lecturer/dashboard" replace />;
    }
    if (user.role === 'Student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, background: '#F8FAFC', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'SystemAdministrator' || user.role === 'TrainingDepartment' || user.role === 'Moderator') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user.role === 'Lecturer') {
    return <Navigate to="/lecturer/dashboard" replace />;
  }
  if (user.role === 'Student') {
    return <Navigate to="/student/dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

const AppContent = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/accounts"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/semesters"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <SemesterManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/import"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <ExcelImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <ReviewManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/review-tracking"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <ReviewTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/defenses"
          element={
            <ProtectedRoute allowedRoles={['SystemAdministrator', 'TrainingDepartment', 'Moderator']}>
              <DefenseManagementPage />
            </ProtectedRoute>
          }
        />


        {/* LECTURER ROUTES */}
        <Route
          path="/lecturer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Lecturer']}>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/availability"
          element={
            <ProtectedRoute allowedRoles={['Lecturer']}>
              <AvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/reviews"
          element={
            <ProtectedRoute allowedRoles={['Lecturer']}>
              <ReviewScoringPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/defenses"
          element={
            <ProtectedRoute allowedRoles={['Lecturer']}>
              <DefenseRoomPage />
            </ProtectedRoute>
          }
        />


        {/* STUDENT ROUTES */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/review-schedule"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <ReviewRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/results"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <ReviewResultsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
