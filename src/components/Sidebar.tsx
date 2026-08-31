import { useState } from 'react';
import { useAuth } from '../store';

const NAV_PATIENT = [
  { icon:'🏠', label:'Home',           path:'/home' },
  { icon:'🟢', label:'Doctors Online',  path:'/online' },
  { icon:'🤖', label:'Ask Veda AI',      path:'/veda' },
  { icon:'📅', label:'Appointments',   path:'/appointments' },
  { icon:'🔍', label:'Symptom search', path:'/symptom' },
  { icon:'💬', label:'Ask a Doctor',   path:'/ask' },
  { icon:'💊', label:'Prescriptions',  path:'/prescriptions' },
  { icon:'📁', label:'My Records',     path:'/records' },
  { icon:'🏥', label:'Medical History',path:'/history' },
  { icon:'👤', label:'Profile',        path:'/profile' },
];

const NAV_DOCTOR = [
  { icon:'📊', label:'Dashboard',      path:'/dashboard' },
  { icon:'📅', label:'Appointments',   path:'/appointments' },
  { icon:'💬', label:'Patient Q&A',    path:'/questions' },
  { icon:'💊', label:'Prescriptions',  path:'/prescriptions' },
  { icon:'✅', label:'Verification',   path:'/verification' },
  { icon:'👥', label:'Patients',       path:'/patients' },
  { icon:'👤', label:'Profile',        path:'/profile' },
];

const NAV_ADMIN = [
  { icon:'🛡️', label:'Admin Panel',   path:'/admin' },
];

export default function Sidebar({ current, onNav }: { current: string; onNav: (path: string) => void }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = user?.role === 'doctor' ? NAV_DOCTOR : user?.role === 'admin' ? NAV_ADMIN : NAV_PATIENT;
  const initials = user?.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || '?';

  const handleNav = (path: string) => { onNav(path); setMobileOpen(false); };

  return (
    <>
      {/* Hamburger - hidden on desktop via CSS */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-menu-btn"
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 1001,
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--primary)', border: 'none',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'none',
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {mobileOpen ? 'X' : '='}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 999, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <div
        className={mobileOpen ? 'sidebar-container open' : 'sidebar-container'}
        style={{
          width: 220, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
          background: '#fff', borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
            }}>+</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>Deemona Doctors</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>HEALTHCARE</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {nav.map(item => {
            const active = current === item.path;
            return (
              <button key={item.path} onClick={() => handleNav(item.path)} style={{
                width: '100%', padding: '9px 10px', borderRadius: 'var(--r-md)',
                border: 'none', background: active ? 'var(--primary-light)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 10,
                cursor: 'pointer', marginBottom: 2, textAlign: 'left' as any,
              }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center' as any }}>{item.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                }}>{item.label}</span>
                {active && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}/>}
              </button>
            );
          })}

          {user?.role === 'patient' && (
            <button onClick={() => handleNav('/doctors')} style={{
              width: '100%', marginTop: 8, padding: '10px', borderRadius: 'var(--r-md)',
              border: 'none', background: 'var(--primary)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              🔍 Find Doctors
            </button>
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as any }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' as any }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={() => { if (window.confirm('Sign out of Deemona Doctors?')) logout(); }} style={{
            width: '100%', padding: '8px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
            background: 'transparent', fontSize: 13, color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>🚪</span> Sign out
          </button>
        </div>
      </div>
    </>
  );
}
