import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const SPECIALTIES = [
  { id:'',            label:'All' },
  { id:'allopathy',   label:'Allopathy' },
  { id:'homeopathy',  label:'Homeopathy' },
  { id:'ayurveda',    label:'Ayurveda' },
  { id:'yoga',        label:'Yoga Therapy' },
  { id:'naturopathy', label:'Naturopathy' },
  { id:'unani',       label:'Unani' },
];

const SPECIALTY_COLORS: Record<string, string> = {
  allopathy:'#2563EB', homeopathy:'#7C3AED', ayurveda:'#0A7B6C',
  yoga:'#EA580C', naturopathy:'#16A34A', unani:'#0369A1',
};

export default function DoctorSearch({ initial, onBook }: { initial?: { specialty?: string; q?: string }; onBook: (doctorId: string) => void }) {
  const [specialty, setSpecialty] = useState(initial?.specialty || '');
  const [search,    setSearch]    = useState(initial?.q || '');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', specialty, search, page],
    queryFn: async () => {
      const { data } = await api.get('/doctors', { params: { medical_system: specialty || undefined, search: search || undefined, page, limit: 12 } });
      return data;
    },
  });

  const doctors = data?.data || [];
  const meta    = data?.meta || {};

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Find a Doctor</h1>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
        <input
          placeholder="Search by name, specialty, or condition..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: '100%', padding: '11px 16px 11px 42px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      {/* Specialty filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {SPECIALTIES.map(s => (
          <button key={s.id} onClick={() => { setSpecialty(s.id); setPage(1); }} style={{
            padding: '6px 14px', borderRadius: 'var(--r-full)', border: 'none',
            background: specialty === s.id ? 'var(--primary)' : '#fff',
            color: specialty === s.id ? '#fff' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: specialty === s.id ? 600 : 400,
            cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      {/* Results */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 14 }}>Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No doctors found</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Try a different specialty or search term</div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{meta.total || doctors.length} doctors found</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {doctors.map((doc: any) => {
              const color = SPECIALTY_COLORS[doc.medical_system] || 'var(--primary)';
              const initials = doc.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'D';
              const rating = doc.avg_rating ? parseFloat(String(doc.avg_rating)).toFixed(1) : null;
              const fee = doc.min_fee ? `₹${(doc.min_fee/100).toFixed(0)}` : null;

              return (
                <div key={doc.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s' }}>
                  {/* Color bar */}
                  <div style={{ height: 4, background: color }} />
                  <div style={{ padding: '16px' }}>
                    {/* Doctor info */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color, flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{doc.degree}{doc.specialization ? ` · ${doc.specialization}` : ''}</div>
                        <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--r-full)', background: `${color}15`, color, fontSize: 11, fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>
                          {doc.medical_system}
                        </div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      {rating && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⭐ {rating} ({doc.total_reviews})</span>}
                      {doc.experience_years && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💼 {doc.experience_years} yrs</span>}
                      {doc.city && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {doc.city}</span>}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        {fee && <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{fee}</span>}
                        {fee && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>onwards</span>}
                      </div>
                      <button onClick={() => onBook(doc.id)} style={{
                        padding: '7px 16px', borderRadius: 'var(--r-md)', border: 'none',
                        background: color, color: '#fff', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}>
                        Book
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta.total > 12 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
              <span style={{ padding: '8px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>Page {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={page * 12 >= meta.total} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', cursor: page * 12 >= meta.total ? 'not-allowed' : 'pointer', opacity: page * 12 >= meta.total ? 0.5 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
