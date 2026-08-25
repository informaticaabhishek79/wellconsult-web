import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

const SPECIALTIES = [
  { id:'allopathy',   label:'Allopathy',    icon:'⚕️', color:'#2563EB', bg:'#EFF6FF' },
  { id:'homeopathy',  label:'Homeopathy',   icon:'💊', color:'#7C3AED', bg:'#F5F3FF' },
  { id:'ayurveda',    label:'Ayurveda',     icon:'🌿', color:'#0A7B6C', bg:'#F0FDF4' },
  { id:'yoga',        label:'Yoga Therapy', icon:'🧘', color:'#EA580C', bg:'#FFF7ED' },
  { id:'naturopathy', label:'Naturopathy',  icon:'🌱', color:'#16A34A', bg:'#F0FDF4' },
  { id:'unani',       label:'Unani',        icon:'⚗️', color:'#0369A1', bg:'#F0F9FF' },
];

export default function PatientHome({ onNav }: { onNav: (path: string, state?: any) => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: appointments } = useQuery({
    queryKey: ['upcoming-count'],
    queryFn: async () => {
      const { data } = await api.get('/patients/me/appointments');
      return (data.data || []).filter((a: any) => ['booked','confirmed'].includes(a.status));
    },
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>{greeting} 👋</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
          How can we help you today, {user?.full_name?.split(' ')[0]}?
        </h1>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</div>
        <input
          placeholder="Search doctors, specialties, conditions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && search) onNav('/doctors', { q: search }); }}
          style={{
            width: '100%', padding: '13px 16px 13px 42px',
            borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)',
            fontSize: 15, color: 'var(--text-primary)', outline: 'none',
            boxShadow: 'var(--shadow-sm)', background: '#fff', boxSizing: 'border-box',
          }}
        />
        {search && (
          <button onClick={() => onNav('/doctors', { q: search })} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            padding: '6px 14px', borderRadius: 'var(--r-md)', background: 'var(--primary)',
            border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Search</button>
        )}
      </div>

      {/* Upcoming banner */}
      {appointments && appointments.length > 0 && (
        <div onClick={() => onNav('/appointments')} style={{
          padding: '16px 20px', borderRadius: 'var(--r-lg)',
          background: 'linear-gradient(135deg, var(--primary) 0%, #0E9E8A 100%)',
          color: '#fff', cursor: 'pointer', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(10,123,108,0.3)',
        }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>Upcoming appointment</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>
              {appointments[0].doctor_name} · {appointments[0].appt_date?.slice(0,10)} · {appointments[0].appt_time?.slice(0,5)}
            </div>
          </div>
          <div style={{ fontSize: 22 }}>→</div>
        </div>
      )}

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { icon: '📅', label: 'Upcoming',      value: appointments?.length || 0, path: '/appointments', color: 'var(--primary)' },
          { icon: '📋', label: 'Prescriptions', value: '—', path: '/prescriptions', color: '#7C3AED' },
          { icon: '📁', label: 'Records',       value: '—', path: '/records', color: '#0369A1' },
        ].map(s => (
          <div key={s.label} onClick={() => onNav(s.path)} style={{
            padding: '16px', borderRadius: 'var(--r-lg)', background: '#fff',
            border: '1px solid var(--border)', cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Specialties */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Browse by specialty</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {SPECIALTIES.map(s => (
            <div key={s.id} onClick={() => onNav('/doctors', { specialty: s.id })} style={{
              padding: '16px', borderRadius: 'var(--r-lg)',
              background: s.bg, border: `1px solid ${s.color}20`,
              cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
