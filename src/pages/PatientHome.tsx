import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store';
import { api } from '../api';

const SPECIALTIES = [
  { id:'allopathy',   label:'Allopathy',    icon:'⚕️', color:'#2563EB' },
  { id:'homeopathy',  label:'Homeopathy',   icon:'💊', color:'#7C3AED' },
  { id:'ayurveda',    label:'Ayurveda',     icon:'🌿', color:'#0A7B6C' },
  { id:'yoga',        label:'Yoga Therapy', icon:'🧘', color:'#EA580C' },
  { id:'naturopathy', label:'Naturopathy',  icon:'🌱', color:'#16A34A' },
  { id:'unani',       label:'Unani',        icon:'⚗️', color:'#0369A1' },
];

export default function PatientHome({ onNav }: { onNav: (path: string) => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: async () => {
      const { data } = await api.get('/patients/me/appointments');
      const appts = data.data || [];
      return {
        upcoming: appts.filter((a: any) => ['booked','confirmed'].includes(a.status)).length,
        total: appts.length,
      };
    },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          {greeting} {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>How can we help you today?</p>
      </div>

      {/* SLA Promise Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0A7B6C, #0E9E8A)', borderRadius: 'var(--r-xl)', padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 8px 24px rgba(10,123,108,0.25)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>⏱️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 3 }}>Connect with a doctor in 15 minutes</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Ask a question or book a consultation — verified doctors respond fast. Full refund if no response in 15 minutes.</div>
        </div>
        <button onClick={() => onNav('/ask')} style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', background: '#fff', color: '#0A7B6C', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
          Ask now →
        </button>
      </div>

      {/* Quick stats */}
      {stats && (stats.upcoming > 0 || stats.total > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div onClick={() => onNav('/appointments')} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{stats.upcoming}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Upcoming appointments</div>
          </div>
          <div onClick={() => onNav('/prescriptions')} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#7C3AED', fontFamily: 'var(--font-display)' }}>{stats.total}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Total consultations</div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-muted)' }}>🔍</span>
        <input
          placeholder="Search doctors by name, specialty..."
          value={search}
          onChange={e => { setSearch(e.target.value); if (e.target.value) onNav('/doctors'); }}
          onFocus={() => onNav('/doctors')}
          style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}
        />
      </div>

      {/* Specialty grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Browse by medical system</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {SPECIALTIES.map(s => (
            <div key={s.id} onClick={() => onNav('/doctors')} style={{
              padding: '18px 14px', borderRadius: 'var(--r-lg)', cursor: 'pointer', textAlign: 'center',
              background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Quick actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon:'🔍', label:'Find by symptom', sub:'Describe your problem', path:'/symptom', color:'#0A7B6C' },
            { icon:'💬', label:'Ask a Doctor', sub:'Get quick text advice', path:'/ask', color:'#7C3AED' },
            { icon:'📅', label:'Book appointment', sub:'Schedule a consultation', path:'/doctors', color:'#2563EB' },
            { icon:'💊', label:'My prescriptions', sub:'View & download', path:'/prescriptions', color:'#EA580C' },
          ].map(a => (
            <div key={a.path} onClick={() => onNav(a.path)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:'var(--r-lg)', background:'#fff', border:'1px solid var(--border)', cursor:'pointer', boxShadow:'var(--shadow-sm)' }}>
              <div style={{ width:40, height:40, borderRadius:'var(--r-md)', background:`${a.color}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{a.icon}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{a.label}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:1 }}>{a.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
