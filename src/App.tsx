import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './store';
import AuthPage from './pages/AuthPage';
import PatientHome from './pages/PatientHome';
import DoctorSearch from './pages/DoctorSearch';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/Sidebar';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

interface NavState { path: string; state?: any; }

function AppContent() {
  const { user } = useAuth();
  const getInitialPath = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page) return '/' + page;
    return user?.role === 'doctor' ? '/dashboard' : user?.role === 'admin' ? '/admin' : '/home';
  };

  const [nav, setNav] = useState<NavState>({ path: getInitialPath() });
  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page) {
      setNav({ path: '/' + page });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (user) setNav({ path: user.role === 'doctor' ? '/dashboard' : user.role === 'admin' ? '/admin' : '/home' });
  }, [user?.role]);

  if (!user) return <AuthPage />;

  const onNav = (path: string, state?: any) => {
    setBookingDoctorId(null);
    setNav({ path, state });
  };

  const onBook = (doctorId?: string) => {
    if (doctorId) setBookingDoctorId(doctorId);
    else setNav({ path: '/doctors' });
  };

  const renderPage = () => {
    if (bookingDoctorId) {
      return <BookingPage
        doctorId={bookingDoctorId}
        onBack={() => setBookingDoctorId(null)}
        onSuccess={() => { setBookingDoctorId(null); setNav({ path: '/appointments' }); }}
      />;
    }

    const { path, state } = nav;

    if (user.role === 'admin') return <AdminPage />;

    if (user.role === 'doctor') {
      switch (path) {
        case '/dashboard':    return <DoctorDashboard onNav={onNav} />;
        case '/appointments': return <AppointmentsPage onBook={() => onNav('/doctors')} />;
        case '/profile':      return <ProfilePage />;
        default:              return <DoctorDashboard onNav={onNav} />;
      }
    }

    // Patient
    switch (path) {
      case '/home':         return <PatientHome onNav={onNav} />;
      case '/doctors':      return <DoctorSearch initial={state} onBook={id => setBookingDoctorId(id)} />;
      case '/appointments': return <AppointmentsPage onBook={() => onNav('/doctors')} />;
      case '/profile':      return <ProfilePage />;
      default:              return <PatientHome onNav={onNav} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar current={bookingDoctorId ? '/doctors' : nav.path} onNav={onNav} />
      <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AppContent />
    </QueryClientProvider>
  );
}
