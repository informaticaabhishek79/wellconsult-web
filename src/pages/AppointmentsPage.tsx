import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_STYLE: Record<string, {bg:string;color:string}> = {
  booked:    {bg:'#EFF6FF',color:'#1D4ED8'},
  confirmed: {bg:'#ECFDF5',color:'#065F46'},
  ongoing:   {bg:'#FFFBEB',color:'#92400E'},
  completed: {bg:'#F0FDF4',color:'#166534'},
  cancelled: {bg:'#FEF2F2',color:'#991B1B'},
  no_show:   {bg:'#F9FAFB',color:'#374151'},
};

export default function AppointmentsPage({ onBook, onChat, onVideo }: {
  onBook: () => void;
  onChat?: (id: string, doctorName?: string) => void;
  onVideo?: (id: string, doctorName?: string) => void;
}) {
  const [tab, setTab] = useState<'upcoming'|'past'>('upcoming');
  const [reviewing, setReviewing] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data, isLoading } = useQuery({
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

    const handleRefundAndCancel = async (id: string) => { if (!window.confirm('Cancel this appointment? If you paid, a full refund will be initiated automatically.')) return; try { await api.post('/payments/refund', { appointment_id: id, reason: 'Patient cancelled' }).catch(() => {}); await api.post('/appointments/' + id + '/cancel', { reason: 'Cancelled by patient' }); alert('Appointment cancelled. Refund (if applicable) will be processed within 5-7 business days.'); } catch (err) { alert('Failed to cancel.'); } };
  const handleCancel = async (appt: any) => {
    if (!window.confirm(`Cancel your ${appt.consult_type} consultation with ${appt.doctor_name} on ${appt.appt_date?.slice(0,10)}?\n\nRefund processed in 3-5 business days.`)) return;
    try {
      await api.patch(`/appointments/${appt.id}/cancel`, { reason: 'Cancelled by patient' });
    } catch (err: any) {
      const e = err.response?.data?.error?.message || '';
      if (e) { alert(e); return; }
    }
    window.location.reload();
  };

  const handleReschedule = async (appt: any) => {
    if (!window.confirm(`This will cancel your appointment with ${appt.doctor_name} on ${appt.appt_date?.slice(0,10)} and let you book a new slot.\n\nContinue?`)) return;
    try {
      await api.patch(`/appointments/${appt.id}/cancel`, { reason: 'Rescheduled by patient' });
    } catch (err: any) {
      const e = err.response?.data?.error?.message || '';
      if (e) { alert(e); return; }
    }
    sessionStorage.setItem('reschedule_doctor_id', appt.doctor_id);
    window.location.href = window.location.origin + '?page=doctors&reschedule=1';
  };

  const handleReview = async () => {
    if (!rating) { alert('Please select a rating.'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { appointment_id: reviewing.id, rating, review_text: reviewText.trim() || undefined });
      setReviewing(null); setRating(0); setReviewText('');
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit review.');
    } finally { setSubmittingReview(false); }
  };

  const RATING_LABELS = ['','Poor','Fair','Good','Very good','Excellent'];

  return (
    <>
      {/* Review modal */}
      {reviewing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:440, width:'100%', boxShadow:'var(--shadow-xl)' }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Rate your consultation</h2>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>with {reviewing.doctor_name}</p>
            <div style={{ display:'flex', gap:8, marginBottom:8, justifyContent:'center' }}>
              {[1,2,3,4,5].map(star => (
                <div key={star} onClick={() => setRating(star)} style={{ fontSize:40, cursor:'pointer', color: star <= rating ? '#F59E0B' : '#E5E7EB', transition:'color 0.1s' }}>★</div>
              ))}
            </div>
            {rating > 0 && <div style={{ textAlign:'center', fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>{RATING_LABELS[rating]}</div>}
            <textarea placeholder="Share your experience (optional)..." value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3}
              style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', resize:'vertical' as any, fontFamily:'var(--font-body)', boxSizing:'border-box' as any, marginBottom:16 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setReviewing(null); setRating(0); setReviewText(''); }} style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleReview} disabled={!rating || submittingReview} style={{
                flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none',
                background: !rating || submittingReview ? 'var(--border)' : 'var(--primary)',
                color: !rating || submittingReview ? 'var(--text-muted)' : '#fff',
                fontSize:14, fontWeight:600, cursor: !rating || submittingReview ? 'not-allowed' : 'pointer',
              }}>{submittingReview ? 'Submitting...' : 'Submit review ★'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)' }}>My Appointments</h1>
          <button onClick={onBook} style={{ padding:'9px 18px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            + Book appointment
          </button>
        </div>

        <div onClick={onBook} style={{ padding:'14px 18px', borderRadius:'var(--r-lg)', background:'linear-gradient(135deg, #7F1D1D, #DC2626)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:12, marginBottom:20, boxShadow:'0 4px 16px rgba(220,38,38,0.2)' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>⚡</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Need immediate consultation?</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginTop:1 }}>Connect with an available doctor right now</div>
          </div>
          <span style={{ fontSize:18 }}>→</span>
        </div>

        <div style={{ display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20 }}>
          {(['upcoming','past'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'10px 20px', border:'none', background:'none',
              borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom:-2, fontSize:14, fontWeight: tab===t ? 700 : 500,
              color: tab===t ? 'var(--primary)' : 'var(--text-secondary)', cursor:'pointer',
            }}>
              {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

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
                    <div style={{ width:4, background: canCancel ? 'var(--primary)' : item.status==='cancelled' ? 'var(--error)' : '#16A34A', flexShrink:0 }}/>
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

                      <div style={{ display:'flex', gap:16, marginBottom: isUpcoming ? 12 : 10, flexWrap:'wrap' }}>
                        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>📅 {item.appt_date?.slice(0,10)}</span>
                        <span style={{ fontSize:13, color:'var(--text-secondary)' }}>🕐 {item.appt_time?.slice(0,5)}</span>
                        <span style={{ fontSize:13, color:'var(--text-secondary)', textTransform:'capitalize' }}>
                          {item.consult_type==='video'?'📹':item.consult_type==='phone'?'📞':'🏥'} {item.consult_type}
                        </span>
                      </div>

                      {isUpcoming && (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {(item.status==='confirmed'||item.status==='booked') && onChat && (
                            <button onClick={() => onChat(item.id, item.doctor_name)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', background:'#2563EB', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                              💬 Chat
                            </button>
                          )}
                          {item.status==='confirmed' && onVideo && (
                            <button onClick={() => onVideo(item.id, item.doctor_name)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', background:'#7C3AED', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                              📹 Join video
                            </button>
                          )}
                          {canReschedule && (
                            <button onClick={() => handleReschedule(item)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                              📅 Reschedule
                            </button>
                          )}
                          {canCancel && (
                            <button onClick={() => handleCancel(item)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid #DC2626', background:'#FEF2F2', color:'#DC2626', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      )}

                      {!isUpcoming && (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {item.status==='completed' && (
                            <>
                              <button onClick={onBook} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                                🔄 Book again
                              </button>
                              <button onClick={() => { setReviewing(item); setRating(0); setReviewText(''); }} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1.5px solid #F59E0B', background:'#FFFBEB', color:'#92400E', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                                ★ Rate consultation
                              </button>
                            </>
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
    </>
  );
}
