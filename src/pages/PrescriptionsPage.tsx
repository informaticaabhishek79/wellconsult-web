import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<any>(null);

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: async () => {
      const { data } = await api.get('/prescriptions');
      return data.data as any[] || [];
    },
  });

  const printPrescription = (rx: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - Deemona Doctors</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1a1a1a; }
          .header { border-bottom: 2px solid #0A7B6C; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .logo { font-size: 22px; font-weight: 800; color: #0A7B6C; }
          .rx-symbol { font-size: 48px; color: #0A7B6C; font-style: italic; }
          .doctor { font-size: 14px; color: #666; }
          .date { font-size: 13px; color: #888; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #E6F4F1; padding: 10px; text-align: left; font-size: 13px; }
          td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
          .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; font-size: 12px; color: #888; }
          .signature { margin-top: 40px; text-align: right; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Deemona Doctors</div>
            <div class="doctor">${rx.doctor_name}</div>
            <div class="date">Date: ${new Date(rx.issued_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</div>
          </div>
          <div class="rx-symbol">Rx</div>
        </div>
        
        <p><strong>Patient:</strong> ${rx.patient_name || user?.full_name || 'Patient'}</p>
        <p><strong>Medical system:</strong> ${rx.medical_system?.charAt(0).toUpperCase() + rx.medical_system?.slice(1)}</p>
        
        <table>
          <thead>
            <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
          </thead>
          <tbody>
            ${(rx.items || []).map((item: any, i: number) => `
              <tr>
                <td>${i+1}</td>
                <td><strong>${item.medicine_name}</strong></td>
                <td>${item.dosage || '-'}</td>
                <td>${item.frequency || '-'}</td>
                <td>${item.duration_days ? item.duration_days + ' days' : '-'}</td>
                <td>${item.instructions || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="signature">
          <p>_______________________</p>
          <p>${rx.doctor_name}</p>
        </div>
        
        <div class="footer">
          This prescription was issued digitally via Deemona Doctors — deemona-doctors-web.onrender.com<br/>
          For emergencies call 112 or visit your nearest hospital.
        </div>
        
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Prescriptions
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {user?.role === 'doctor' ? 'Prescriptions you have issued' : 'Your digital prescriptions'}
        </p>
      </div>

      {selected ? (
        /* Prescription detail */
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setSelected(null)} style={{ padding: '7px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <button onClick={() => printPrescription(selected)} style={{ padding: '7px 16px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🖨️ Print / Download PDF
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            {/* Prescription header */}
            <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0E9E8A 100%)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#fff' }}>Deemona Doctors</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{selected.doctor_name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                  {new Date(selected.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 56, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', lineHeight: 1 }}>Rx</div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Patient</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{selected.patient_name || user?.full_name}</div>
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Medical system</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{selected.medical_system}</div>
                </div>
              </div>

              {/* Medicines table */}
              <div style={{ borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', background: 'var(--primary-light)', padding: '10px 16px', gap: 8 }}>
                  {['Medicine', 'Dosage', 'Frequency', 'Duration', 'Instructions'].map(h => (
                    <div key={h} style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</div>
                  ))}
                </div>
                {(selected.items || []).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', padding: '12px 16px', gap: 8, borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.medicine_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.dosage || '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.frequency || '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.duration_days ? `${item.duration_days} days` : '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.instructions || '—'}</div>
                  </div>
                ))}
              </div>

              {/* Signature */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 140, borderTop: '1px solid var(--border)', marginBottom: 6 }}/>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.doctor_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Digital signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List view */
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
          ) : !prescriptions?.length ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💊</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No prescriptions yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {user?.role === 'doctor' ? 'Prescriptions you issue will appear here.' : 'Your doctor\'s prescriptions will appear here after a consultation.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prescriptions.map((rx: any) => (
                <div key={rx.id} onClick={() => setSelected(rx)} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '16px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💊</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {user?.role === 'doctor' ? rx.patient_name : `${rx.doctor_name}`}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {rx.medical_system}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {(rx.items || []).length} medicine{(rx.items || []).length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(rx.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>›</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
