import { useState, useEffect, useRef, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './store';
import { api } from './api';
import AuthPage from './pages/AuthPage';
import PatientHome from './pages/PatientHome';
import DoctorSearch from './pages/DoctorSearch';
import BookingPage from './pages/BookingPage';
import AppointmentsPage from './pages/AppointmentsPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorOnboarding from './pages/DoctorOnboarding';
import DoctorQuestionsPage from './pages/DoctorQuestionsPage';
import DoctorVerificationPage from './pages/DoctorVerificationPage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import WritePrescriptionPage from './pages/WritePrescriptionPage';
import SymptomSearch from './pages/SymptomSearch';
import ChatPage from './pages/ChatPage';
import VideoCallPage from './pages/VideoCallPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import AskDoctorPage from './pages/AskDoctorPage';
import MedicalHistoryPage from './pages/MedicalHistoryPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import OnlineDoctors from './pages/OnlineDoctors';
import DoctorProfilePage from './pages/DoctorProfilePage';
import LegalPage from './pages/LegalPage';
import LegalPagesPublic from './pages/LegalPagesPublic';
import Sidebar from './components/Sidebar';
import { useQuery } from '@tanstack/react-query';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

interface NavState { path: string; state?: any; }

function AppContent() {
  const { user } = useAuth();
  const presenceSocketRef = useRef<any>(null);

  // Connect to socket for presence tracking (doctor online status)
  useEffect(() => {
    if (!user) {
      presenceSocketRef.current?.disconnect();
      presenceSocketRef.current = null;
      return;
    }
    const token = TokenStorage.get('access_token');
    if (!token) return;
    const { io } = require('socket.io-client');
    const s = io('https://wellconsult-backend.onrender.com', {
      auth: { token }, transports: ['websocket', 'polling'],
    });
    presenceSocketRef.current = s;
    return () => { s.disconnect(); presenceSocketRef.current = null; };
  }, [user?.id]);

  // Handle Google OAuth callback at App level
  useEffect(() => {
    // Check both query params and hash (Render strips query params on static sites)
    const queryParams = new URLSearchParams(window.location.search);
    const oauthError = queryParams.get('oauth_error');
    // Read oauth code from cookie set by backend
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? match[2] : null;
    };
    const oauthCode = getCookie('oauth_code');
    if (oauthCode) {
      // Clear the cookie
      document.cookie = 'oauth_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.onrender.com; secure; samesite=none';
    }

    if (oauthError) {
      console.error('OAuth error:', oauthError);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (oauthCode) {
      window.history.replaceState({}, '', window.location.pathname);
      fetch('https://wellconsult-backend.onrender.com/api/v1/auth/google/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: oauthCode }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            localStorage.setItem('access_token', data.data.accessToken);
            localStorage.setItem('refresh_token', data.data.refreshToken);
            localStorage.setItem('wc_user', JSON.stringify(data.data.user));
            useAuth.getState().init();
          }
        })
        .catch(err => console.error('OAuth token exchange failed:', err));
    }
  }, []);
  const getInitialPath = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page) return '/' + page;
    return user?.role === 'doctor' ? '/dashboard' : user?.role === 'admin' ? '/admin' : '/home';
  };

  const getInitialDoctorId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reschedule') === '1') {
      return sessionStorage.getItem('reschedule_doctor_id') || null;
    }
    return null;
  };

  const [nav, setNav] = useState<NavState>({ path: getInitialPath() });
  const [bookingDoctorId, setBookingDoctorId] = useState<string | null>(getInitialDoctorId());
  const [chatAppointment, setChatAppointment] = useState<{id:string;doctorName?:string} | null>(null);
  const [videoCall, setVideoCall] = useState<{id:string;doctorName?:string;patientName?:string} | null>(null);
  const [writePrescription, setWritePrescription] = useState<{appointmentId:string;patientName?:string} | null>(null);
  const [legalSlug, setLegalSlug] = useState<string | null>(null); // legal routing v2
  const [viewingDoctorId, setViewingDoctorId] = useState<string | null>(null);
  const [instantConsultRequest, setInstantConsultRequest] = useState<any>(null);
  const [showLegalList, setShowLegalList] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    const reschedule = urlParams.get('reschedule');
    if (reschedule === '1') {
      const doctorId = sessionStorage.getItem('reschedule_doctor_id');
      sessionStorage.removeItem('reschedule_doctor_id');
      if (doctorId) setBookingDoctorId(doctorId);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (page) {
      setNav({ path: '/' + page });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    // Only set default nav on initial login, not on every role change
    if (user && !nav.path) setNav({ path: user.role === 'doctor' ? '/dashboard' : user.role === 'admin' ? '/admin' : '/home' });
  }, [user?.role]);

  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  // Check if doctor needs onboarding using useEffect (not useQuery to avoid caching)
  useEffect(() => {
    if (!user || user.role !== 'doctor') { setNeedsOnboarding(false); return; }
    api.get('/doctors/me/profile')
      .then(res => {
        const degree = res.data?.data?.degree;
        setNeedsOnboarding(!degree || degree === '');
      })
      .catch(() => setNeedsOnboarding(false));
  }, [user?.id]);

  if (!user) return <AuthPage />;

  // Wait for onboarding check
  if (user.role === 'doctor' && needsOnboarding === null) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'system-ui', color:'#0A7B6C', fontSize:16 }}>Loading your profile...</div>;
  }

  if (user.role === 'doctor' && needsOnboarding === true) {
    return <DoctorOnboarding onComplete={() => window.location.reload()} />;
  }

  const onNav = (path: string, state?: any) => {
    setBookingDoctorId(null);
    setNav({ path, state });
  };

  const onBook = (doctorId?: string) => {
    if (doctorId) setBookingDoctorId(doctorId);
    else setNav({ path: '/doctors' });
  };

  const renderPage = () => {
    if (writePrescription) {
      return <WritePrescriptionPage appointmentId={writePrescription.appointmentId} patientName={writePrescription.patientName} onDone={() => setWritePrescription(null)} />;
    }

    if (viewingDoctorId) {
      return <DoctorProfilePage doctorId={viewingDoctorId} onBook={(id) => { setViewingDoctorId(null); setBookingDoctorId(id); }} onAsk={() => { setViewingDoctorId(null); onNav('/ask'); }} />;
    }

    if (videoCall) {
      return <VideoCallPage appointmentId={videoCall.id} doctorName={videoCall.doctorName} patientName={videoCall.patientName} onClose={() => setVideoCall(null)} />;
    }

    if (chatAppointment) {
      return <ChatPage appointmentId={chatAppointment.id} doctorName={chatAppointment.doctorName} onClose={() => setChatAppointment(null)} />;
    }

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
        case '/appointments': return user.role === 'doctor' ? <DoctorAppointmentsPage onChat={(id, name) => setChatAppointment({id, doctorName: name})} onVideo={(id, name) => setVideoCall({id, patientName: name})} onWritePrescription={(id, name) => setWritePrescription({appointmentId: id, patientName: name})} /> : <AppointmentsPage onBook={() => onNav('/doctors')} onChat={(id, name) => setChatAppointment({id, doctorName: name})} onVideo={(id, name) => setVideoCall({id, doctorName: name})} />;
        case '/questions':    return <DoctorQuestionsPage />;
      case '/verification':  return <DoctorVerificationPage />;
      case '/prescriptions': return <PrescriptionsPage />;
      case '/records':       return <MedicalRecordsPage />;
      case '/history':       return <MedicalHistoryPage />;
        case '/profile':      return <ProfilePage />;
      case '/legal':        return legalSlug ? <LegalPage slug={legalSlug} onBack={() => setLegalSlug(null)} /> : <LegalPagesPublic onView={(slug) => setLegalSlug(slug)} />;
        default:              return <DoctorDashboard onNav={onNav} />;
      }
    }

    // Patient
    switch (path) {
      case '/home':         return <PatientHome onNav={onNav} />;
      case '/online':       return <OnlineDoctors onBook={id => { if(id) setBookingDoctorId(id); else onNav('/doctors'); }} />;
      case '/doctors':      return <DoctorSearch initial={state} onBook={id => setBookingDoctorId(id)} onViewProfile={id => setViewingDoctorId(id)} />;
      case '/appointments': return user.role === 'doctor' ? <DoctorAppointmentsPage onChat={(id, name) => setChatAppointment({id, doctorName: name})} onVideo={(id, name) => setVideoCall({id, patientName: name})} onWritePrescription={(id, name) => setWritePrescription({appointmentId: id, patientName: name})} /> : <AppointmentsPage onBook={() => onNav('/doctors')} onChat={(id, name) => setChatAppointment({id, doctorName: name})} onVideo={(id, name) => setVideoCall({id, doctorName: name})} />;
      case '/ask':          return <AskDoctorPage />;
      case '/prescriptions': return <PrescriptionsPage />;
      case '/records':       return <MedicalRecordsPage />;
      case '/history':       return <MedicalHistoryPage />;
      case '/symptom':       return <SymptomSearch onBook={id => setBookingDoctorId(id)} />;
      case '/legal':         return legalSlug ? <LegalPage slug={legalSlug} onBack={() => setLegalSlug(null)} /> : <LegalPagesPublic onView={(slug) => setLegalSlug(slug)} />;
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
