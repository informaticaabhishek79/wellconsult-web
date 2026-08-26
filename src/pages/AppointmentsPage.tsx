import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_STYLE: Record<string, {bg:string;color:string}> = {
  booked:    {bg:'#EFF6FF',color:'#1D4ED8'},
  confirmed: {bg:'#ECFDF5',color:'#065F46'},
  ongoing:   {bg:'#FFFBEB',color:'#92400E'},
  completed: {bg:'#F0FDF4',color:'#166534'},
  cancelled: {bg:'#FEF2F2',color:'#991B1B'},
  no_show:   {bg:'#F9FAFB',color:'#374151'},
};

export default function AppointmentsPage({ onBook }: { onBook: () => void }) {
  const [tab, setTab] = useState<'upcoming'|'past'>('upcoming');
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/patients/me/appointments');
      return data.data as any[] || [];
    },
  });

  const all      = data || [];
  const upcoming = all.filter((a: any) => ['booked','confirmed','ongoing'].includes(a.status));
  const past     = all.filter((a: any) => ['completed','cancelled','no_show'].includes(a.status));
  const list     = tab === 'upcoming' ? upcoming : past;

  const handleCancel = async (appt: any) => {
    if (!window.confirm(`Cancel your ${appt.consult_type} consultation with ${appt.doctor_name} on ${appt.appt_date?.slice(0,10)}?\n\nRefund processed in 3–5 business days.`)) return;
    try {
      await api.patch(`/appointments/${appt.id}/cancel`, { reason: 'Cancelled by patient' });
      await refetch();
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not cancel. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)' }}>My Appointments</h1>
        <button onClick={onBook} style={{ padding:'9px 18px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Book appointment
        </button>
      </div>

      {/* Emergency CTA */}
      <div onClick={onBook} style={{ padding:'14px 18px', borderRadius:'var(--r-lg)', background:'linear-gradient(135deg, #7F1D1D, #DC2626)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:12, marginBottom:20, boxShadow:'0 4px 16px rgba(220,38,38,0.2)' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>⚡</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700 }}>Need immediate consultation?</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:1 }}>Connect with an available doctor right now</div>
        </div>
        <span style={{ fontSize:18 }}>→</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20 }}>
        {(['upcoming','past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:'10px 20px', border:'none', background:'none',
            borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom:-2, fontSize:14,
            fontWeight: tab===t ? 700 : 500,
            color: tab===t ? 'var(--primary)' : 'var(--text-secondary)',
            cursor:'pointer',
          }}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
          <div style={{ fontSize:17, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>
            {tab === 'upcoming' ? 'Book a consultation to get started.' : 'Your completed consultations will appear here.'}
          </div>
          {tab === 'upcoming' && (
            <button onClick={onBook} style={{ padding:'10px 24px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Find a doctor
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {list.map((item: any) => {
            const ss = STATUS_STYLE[item.status] || STATUS_STYLE.booked;
            const canCancel     = ['booked','confirmed'].includes(item.status);
            const canReschedule = item.status === 'booked';
            const isUpcoming    = tab === 'upcoming';

            return (
              <div key={item.id} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', overflow:'hidden', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ display:'flex', alignItems:'stretch' }}>
                  {/* Color accent */}
                  <div style={{ width:4, background: canCancel ? 'var(--primary)' : item.status==='cancelled' ? 'var(--error)' : 'var(--success)', flexShrink:0 }}/>
                  <div style={{ flex:1, padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:40, height:40, borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'var(--primary)', flexShrink:0 }}>
                          {item.doctor_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'D'}
                        </div>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{item.doctor_name}</div>
                          <div style={{ fontSize:12, color:'var(--text-secondary)', textTransform:'capitalize', marginTop:1 }}>
                            {item.medical_system}{item.specialization ? ` · ${item.specialization}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:ss.bg, color:ss.color, fontSize:11, fontWeight:700, textTransform:'capitalize', whiteSpace:'nowrap' }}>
                        {item.status}
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:16, marginBottom:isUpcoming && (canCancel||canReschedule) ? 12 : 0, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:4 }}>
                        📅 {item.appt_date?.slice(0,10)}
                      </span>
                      <span style={{ fontSize:13, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:4 }}>
                        🕐 {item.appt_time?.slice(0,5)}
                      </span>
                      <span style={{ fontSize:13, color:'var(--text-secondary)', textTransform:'capitalize', display:'flex', alignItems:'center', gap:4 }}>
                        {item.consult_type==='video'?'📹':item.consult_type==='phone'?'📞':'🏥'} {item.consult_type}
                      </span>
                    </div>

                    {isUpcoming && (canCancel || canReschedule || item.status==='confirmed') && (
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        {item.status === 'confirmed' && (
                          <button style={{ padding:'6px 14px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            📹 Join session
                          </button>
                        )}
                        {canReschedule && (
                          <button onClick={() => { if(window.confirm('Cancel current appointment and rebook?')) handleCancel(item).then(() => onBook()); }} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            📅 Reschedule
                          </button>
                        )}
                        {canCancel && (
                          <button onClick={() => handleCancel(item)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--error)', background:'var(--error-light)', color:'var(--error)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                            ✕ Cancel
                          </button>
                        )}
                      </div>
                    )}

                    {!isUpcoming && item.status === 'completed' && (
                      <button onClick={onBook} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        🔄 Book again
                      </button>
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
}
