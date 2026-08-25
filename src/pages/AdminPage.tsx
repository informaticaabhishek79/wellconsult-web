import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState<'pending'|'stats'>('pending');
  const qc = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => { const { data } = await api.get('/admin/doctors/pending'); return data.data || []; },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/stats'); return data.data; },
  });

  const verify = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'verify'|'reject' }) =>
      api.patch(`/admin/doctors/${id}/${action}`, { notes: 'Reviewed by admin' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pending'] }),
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Admin Panel</h1>

      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        {([['pending',`Pending (${pending?.length||0})`],['stats','Platform stats']] as const).map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 20px', border: 'none', background: 'none',
            borderBottom: tab===key ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2, fontSize: 14, fontWeight: tab===key ? 700 : 500,
            color: tab===key ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            ['👥','Total users', stats.total_users],
            ['🩺','Verified doctors', stats.verified_doctors],
            ['📅','Total appointments', stats.total_appointments],
            ['✅','Completed', stats.completed_appointments],
            ['⏳','Pending doctors', stats.pending_doctors],
            ['💰','Revenue (₹)', (stats.total_revenue/100).toFixed(0)],
          ].map(([icon,label,val]) => (
            <div key={String(label)} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{val?.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pending' && (
        isLoading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div> :
        !pending?.length ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>All caught up!</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>No doctors awaiting verification</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((doc: any) => (
              <div key={doc.doctor_id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                    {doc.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{doc.full_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                      {doc.degree} · {doc.medical_system} · {doc.city}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14, padding: '10px', background: 'var(--bg)', borderRadius: 'var(--r-md)' }}>
                  {[['Reg. number', doc.reg_number],['Reg. body', doc.reg_body],['Experience', `${doc.experience_years} years`]].map(([k,v]) => (
                    <div key={String(k)}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}: </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => verify.mutate({ id: doc.doctor_id, action: 'reject' })} style={{ flex: 1, padding: '9px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--error)', background: 'var(--error-light)', color: 'var(--error)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ✕ Reject
                  </button>
                  <button onClick={() => verify.mutate({ id: doc.doctor_id, action: 'verify' })} style={{ flex: 2, padding: '9px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ✓ Verify practitioner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
