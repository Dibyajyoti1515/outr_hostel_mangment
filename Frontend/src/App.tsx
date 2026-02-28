import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './lib/store';

// Auth Pages
import LandingPage from './pages/LandingPage';
import StudentLoginPage from './pages/student/StudentLoginPage';
import ManagementLoginPage from './pages/management/ManagementLoginPage';

// Student Pages
import StudentLayout from './components/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import FoodCalendar from './pages/student/FoodCalendar';
import MyQRCode from './pages/student/MyQRCode';

// Management Pages
import ManagementLayout from './components/management/ManagementLayout';
import ManagementDashboard from './pages/management/ManagementDashboard';
import ScannerPage from './pages/management/ScannerPage';
import StudentsPage from './pages/management/StudentsPage';
import ScanHistoryPage from './pages/management/ScanHistoryPage';

function StudentGuard({ children }: { children: React.ReactNode }) {
  const { userType } = useStore();
  if (userType !== 'student') return <Navigate to="/login/student" replace />;
  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { userType } = useStore();
  if (userType !== 'management') return <Navigate to="/login/management" replace />;
  return <>{children}</>;
}

export default function App() {
  const { hydrate, userType } = useStore();

  useEffect(() => { hydrate(); }, []);

  return (
    <Routes>
      {/* Landing */}
      <Route path="/" element={
        userType === 'student' ? <Navigate to="/student" replace /> :
        userType === 'management' ? <Navigate to="/management" replace /> :
        <LandingPage />
      } />

      {/* Auth */}
      <Route path="/login/student" element={<StudentLoginPage />} />
      <Route path="/login/management" element={<ManagementLoginPage />} />

      {/* Student */}
      <Route path="/student" element={<StudentGuard><StudentLayout /></StudentGuard>}>
        <Route index element={<StudentDashboard />} />
        <Route path="calendar" element={<FoodCalendar />} />
        <Route path="qr" element={<MyQRCode />} />
      </Route>

      {/* Management */}
      <Route path="/management" element={<AdminGuard><ManagementLayout /></AdminGuard>}>
        <Route index element={<ManagementDashboard />} />
        <Route path="scanner" element={<ScannerPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="history" element={<ScanHistoryPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}