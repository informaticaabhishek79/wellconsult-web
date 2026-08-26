import { useAuth } from '../store';

const NAV_PATIENT = [
  { icon:'🏠', label:'Home',          path:'/home' },
  { icon:'📅', label:'Appointments',  path:'/appointments' },
  { icon:'💬', label:'Ask a Doctor',  path:'/ask' },
  { icon:'📋', label:'Prescriptions', path:'/prescriptions' },
  { icon:'📁', label:'Records',       path:'/records' },
  { icon:'👤', label:'Profile',       path:'/profile' },
];

const NAV_DOCTOR = [
  { icon:'📊', label:'Dashboard',    path:'/dashboard' },
  { icon:'📅', label:'Appointments', path:'/appointments' },
  { icon:'💬', label:'Patient Q&A',  path:'/questions' },
  { icon:'👥', label:'Patients',     path:'/patients' },
  { icon:'👤', label:'Profile',      path:'/profile' },
];

const NAV_ADMIN = [
  { icon:'🛡️', label:'Admin Panel', path:'/admin' },
];

export default function Sidebar({ current, onNav }: { current: string; onNav: (path: string) => void }) {
  const { user, logout } = useAuth();
  const nav = user?.role === 'doctor' ? NAV_DOCTOR : user?.role === 'admin' ? NAV_ADMIN : NAV_PATIENT;
  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(0,2).join('') || '?';

  return (
    <div style={{
      width: 220, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: '#fff', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0,
          }}>
            <div style={{ position: 'absolute', width: 14, height: 3, background: '#fff', borderRadius: 2 }}/>
            <div style={{ position: 'absolute', width: 3, height: 14, background: '#fff', borderRadius: 2 }}/>
            <div style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', bottom: 5, right: 5 }}/>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>WellConsult</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>HEALTHCARE</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {nav.map(item => {
          const active = current === item.path;
          return (
            <button key={item.path} onClick={() => onNav(item.path)} style={{
              width: '100%', padding: '9px 10px', borderRadius: 'var(--r-md)',
              border: 'none', background: active ? 'var(--primary-light)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 14, fontWeight: active ? 600 : 400,
              color: active ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer', marginBottom: 2, textAlign: 'left',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {active && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)' }}/>}
            </button>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-md)', background: 'var(--bg)', marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={() => { if (window.confirm('Sign out of WellConsult?')) logout(); }} style={{
          width: '100%', padding: '8px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)',
          background: 'transparent', fontSize: 13, color: 'var(--text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span>🚪</span> Sign out
        </button>
      </div>
    </div>
  );
}
