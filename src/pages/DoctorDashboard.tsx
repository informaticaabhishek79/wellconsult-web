import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

export default function DoctorDashboard({ onNav }: { onNav: (path: string) => void }) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: dashboard } = useQuery({
    queryKey: ['doctor-dashboard'],
    queryFn: async () => { const { data } = await api.get('/doctors/me/dashboard'); return data.data; },
  });

  const { data: reviews } = useQuery({
    queryKey: ['doctor-my-reviews'],
    queryFn: async () => {
      try {
        const profile = await api.get('/doctors/me/profile');
        const doctorId = profile.data?.data?.id;
        if (!doctorId) return [];
        const { data } = await api.get(`/reviews/doctor/${doctorId}`);
        return data.data as any[] || [];
      } catch { return []; }
    },
  });

  const STATS = [
    { icon:'📅', label:"Today's appointments", value: dashboard?.today_count ?? 0,        color:'#2563EB' },
    { icon:'🗓️', label:'Upcoming',             value: dashboard?.upcoming_count ?? 0,      color:'var(--primary)' },
    { icon:'👥', label:'Total consultations',  value: dashboard?.total_consultations ?? 0, color:'#7C3AED' },
    { icon:'⭐', label:'Avg rating',           value: dashboard?.avg_rating ? parseFloat(String(dashboard.avg_rating)).toFixed(1) : '—', color:'#F59E0B' },
  ];

  const ACTIONS = [
    { icon:'📅', label:'Appointments', sub:'View & manage',     path:'/appointments' },
    { icon:'👥', label:'Patients',     sub:'Patient records',   path:'/patients' },
    { icon:'👤', label:'Profile',      sub:'Update details',    path:'/profile' },
    { icon:'⏰', label:'Availability', sub:'Set your schedule', path:'/profile' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>{greeting} 👋</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--text-primary)' }}>
          {user?.full_name}
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* My ratings */}
      {reviews && reviews.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            ⭐ Patient Reviews ({reviews.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.slice(0, 3).map((r: any) => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                  {r.patient_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'P'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.patient_name}</span>
                    <span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                  </div>
                  {r.review_text && <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{r.review_text}</p>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Quick actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        {ACTIONS.map(a => (
          <button key={a.label} onClick={() => onNav(a.path)} style={{
            padding: '16px 12px', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
            background: '#fff', cursor: 'pointer', textAlign: 'center',
            boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.sub}</div>
          </button>
        ))}
      </div>

      {/* Upcoming */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Upcoming appointments</h2>
      {!dashboard?.upcoming_appointments?.length ? (
        <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No upcoming appointments
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dashboard.upcoming_appointments.slice(0,5).map((a: any) => (
            <div key={a.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                {a.patient_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'P'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{a.patient_name || 'Patient'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {a.appt_date?.slice(0,10)} · {a.appt_time?.slice(0,5)} · {a.consult_type}
                </div>
              </div>
              <div style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: '#ECFDF5', color: '#065F46', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                {a.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
