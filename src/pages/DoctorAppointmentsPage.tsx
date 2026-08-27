import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_STYLE: Record<string, {bg:string;color:string}> = {
  booked:    {bg:'#EFF6FF',color:'#1D4ED8'},
  confirmed: {bg:'#ECFDF5',color:'#065F46'},
  ongoing:   {bg:'#FFFBEB',color:'#92400E'},
  completed: {bg:'#F0FDF4',color:'#166534'},
  cancelled: {bg:'#FEF2F2',color:'#991B1B'},
};

export default function DoctorAppointmentsPage({ onChat, onVideo, onWritePrescription }: { onChat?: (id: string, patientName?: string) => void; onVideo?: (id: string, patientName?: string) => void; onWritePrescription?: (appointmentId: string, patientName?: string) => void }) {
  const [tab, setTab] = useState<'upcoming'|'past'>('upcoming');
  const [followUp, setFollowUp] = useState<any>(null);
  const [followUpDays, setFollowUpDays] = useState('7');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const handleFollowUp = async () => {
    if (!followUpDays) { alert('Please enter follow-up days.'); return; }
    setSavingFollowUp(true);
    try {
      await api.post(`/doctors/me/appointments/${followUp.id}/followup`, {
        follow_up_days: parseInt(followUpDays),
        notes: followUpNotes.trim() || undefined,
      });
      alert(`Follow-up set for ${followUpDays} days. Patient will be reminded.`);
      setFollowUp(null); setFollowUpDays('7'); setFollowUpNotes('');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to set follow-up.');
    } finally { setSavingFollowUp(false); }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/doctors/me/appointments');
      return data.data as any[] || [];
    },
  });

  const all      = data || [];
  const upcoming = all.filter((a: any) => ['booked','confirmed','ongoing'].includes(a.status));
  const past     = all.filter((a: any) => ['completed','cancelled','no_show'].includes(a.status));
  const list     = tab === 'upcoming' ? upcoming : past;

  const handleConfirm = async (appt: any) => {
    try {
      await api.patch(`/appointments/${appt.id}/confirm`);
      await refetch();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not confirm.');
    }
  };

  const handleComplete = async (appt: any) => {
    if (!window.confirm(`Mark consultation with ${appt.patient_name} as completed?`)) return;
    try {
      await api.patch(`/appointments/${appt.id}/complete`);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not complete.');
    }
  };

  return (
    <>
    {followUp && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
        <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:420, width:'100%', boxShadow:'var(--shadow-xl)' }}>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Set follow-up period</h2>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>for {followUp.patient_name}</p>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>Follow-up in how many days?</label>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
              {['3','7','14','30'].map(d => (
                <div key={d} onClick={() => setFollowUpDays(d)} style={{ padding:'6px 16px', borderRadius:'var(--r-full)', cursor:'pointer', border:`1.5px solid ${followUpDays===d ? 'var(--primary)' : 'var(--border)'}`, background: followUpDays===d ? 'var(--primary)' : '#fff', color: followUpDays===d ? '#fff' : 'var(--text-secondary)', fontSize:13, fontWeight: followUpDays===d ? 600 : 400 }}>
                  {d} days
                </div>
              ))}
              <input type="number" value={followUpDays} onChange={e => setFollowUpDays(e.target.value)} placeholder="Custom" style={{ width:80, padding:'6px 10px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:13, outline:'none' }}/>
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>Instructions for patient (optional)</label>
            <textarea value={followUpNotes} onChange={e => setFollowUpNotes(e.target.value)} rows={3} placeholder="e.g. Take medication and come back for review..." style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:13, outline:'none', resize:'vertical' as any, fontFamily:'var(--font-body)', boxSizing:'border-box' as any }}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setFollowUp(null); setFollowUpDays('7'); setFollowUpNotes(''); }} style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
            <button onClick={handleFollowUp} disabled={savingFollowUp} style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background: savingFollowUp ? 'var(--border)' : 'var(--primary)', color: savingFollowUp ? 'var(--text-muted)' : '#fff', fontSize:14, fontWeight:600, cursor: savingFollowUp ? 'not-allowed' : 'pointer' }}>
              {savingFollowUp ? 'Saving...' : '📅 Set follow-up'}
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
        My Appointments
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {(['upcoming','past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none',
            borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2, fontSize: 14, fontWeight: tab===t ? 700 : 500,
            color: tab===t ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer',
          }}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {tab === 'upcoming' ? 'Patient appointments will appear here.' : 'Completed consultations will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((item: any) => {
            const ss = STATUS_STYLE[item.status] || STATUS_STYLE.booked;
            const isUpcoming = tab === 'upcoming';
            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 4, background: item.status === 'booked' ? 'var(--primary)' : item.status === 'confirmed' ? '#16A34A' : 'var(--border)', flexShrink: 0 }}/>
                  <div style={{ flex: 1, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>
                          {item.patient_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'P'}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{item.patient_name || 'Patient'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                            {item.consult_type} consultation
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                        {item.status}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: isUpcoming ? 12 : 0, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📅 {item.appt_date?.slice(0,10)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🕐 {item.appt_time?.slice(0,5)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {item.consult_type === 'video' ? '📹' : item.consult_type === 'phone' ? '📞' : '🏥'} {item.consult_type}
                      </span>
                    </div>

                    {isUpcoming && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.status === 'booked' && (
                          <button onClick={() => handleConfirm(item)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#16A34A', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            ✓ Confirm
                          </button>
                        )}
                        {onChat && (
                          <button onClick={() => onChat(item.id, item.patient_name)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#2563EB', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            💬 Chat
                          </button>
                        )}
                        {onVideo && (
                          <button onClick={() => onVideo(item.id, item.patient_name)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#7C3AED', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            📹 Video
                          </button>
                        )}
                        {onWritePrescription && ['confirmed','completed'].includes(item.status) && (
                          <button onClick={() => onWritePrescription(item.id, item.patient_name)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#0A7B6C', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            💊 Prescription
                          </button>
                        )}
                        {item.status === 'completed' && (
                          <button onClick={() => { setFollowUp(item); setFollowUpDays('7'); setFollowUpNotes(''); }} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#EA580C', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            📅 Follow-up
                          </button>
                        )}
                        {item.status === 'confirmed' && (
                          <button onClick={() => handleComplete(item)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            ✓ Mark complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
    </>
  );
}
