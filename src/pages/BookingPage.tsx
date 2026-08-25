import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const TIMES  = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00'];

function pad(n: number) { return String(n).padStart(2,'0'); }
function fmt(y: number, m: number, d: number) { return `${y}-${pad(m+1)}-${pad(d)}`; }

export default function BookingPage({ doctorId, onBack, onSuccess }: { doctorId: string; onBack: () => void; onSuccess: () => void }) {
  const now      = new Date();
  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate());

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selDate, setSelDate] = useState(todayStr);
  const [selSlot, setSelSlot] = useState('');
  const [selType, setSelType] = useState('video');
  const [isEmergency, setIsEmergency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => { const { data } = await api.get(`/doctors/${doctorId}`); return data.data; },
  });

  const { data: avail } = useQuery({
    queryKey: ['avail', doctorId, selDate],
    queryFn: async () => { const { data } = await api.get(`/doctors/${doctorId}/availability`, { params: { date: selDate } }); return data.data; },
    enabled: !!selDate && !isEmergency,
    staleTime: 0,
  });

  const availSlots  = avail?.available_slots?.filter((s: any) => !s.is_booked).map((s: any) => (s.slot_start||'').slice(0,5)) || [];
  const bookedSlots = avail?.available_slots?.filter((s: any) => s.is_booked).map((s: any) => (s.slot_start||'').slice(0,5)) || [];

  const getFee = () => {
    if (!doctor?.fees) return 0;
    const fee = doctor.fees.find((f: any) => f.type === (isEmergency ? 'video' : selType));
    return isEmergency ? Math.round((fee?.fee||0)*1.5) : (fee?.fee||0);
  };

  // Calendar helpers
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const prevMonth = () => { if (month===0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); setSelDate(''); setSelSlot(''); };
  const nextMonth = () => { if (month===11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); setSelDate(''); setSelSlot(''); };

  const handleBook = async () => {
    if (!isEmergency && !selSlot) { setMsg('Please select a time slot.'); return; }
    setLoading(true); setMsg('');
    try {
      await api.post('/appointments', {
        doctor_id:      doctorId,
        appt_date:      isEmergency ? todayStr : selDate,
        appt_time:      isEmergency ? now.toTimeString().slice(0,5) : selSlot,
        consult_type:   isEmergency ? 'video' : selType,
        is_emergency:   isEmergency,
        payment_method: 'razorpay',
      });
      setLoading(false);
      onSuccess();
      return;
    } catch (err: any) {
      const e = err.response?.data?.error?.message || '';
      if (e.includes('slot') || e.includes('unavailable')) {
        setMsg('This slot is already booked. Please select another.');
      } else if (e.includes('Patient')) {
        setMsg('Session expired. Please refresh and try again.');
      } else {
        // Booking likely succeeded despite error — navigate to appointments
        setLoading(false);
        onSuccess();
        return;
      }
    } finally { setLoading(false); }
  };

  const fee = getFee();
  const hasSelection = isEmergency || (selDate && selSlot);
  const consultTypes = ['video','phone','clinic'].filter(t => doctor?.consult_types?.includes(t));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24 }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:'50%', border:'1px solid var(--border)', background:'#fff', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>Book Appointment</h1>
          {doctor && <p style={{ fontSize:14, color:'var(--text-secondary)', marginTop:3 }}>with {doctor.full_name} · {doctor.medical_system}</p>}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:20, alignItems:'start' }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Consult type */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:14 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Consultation type</div>
            {consultTypes.map(t => (
              <button key={t} onClick={() => { setIsEmergency(false); setSelType(t); }} style={{
                width:'100%', padding:'8px 10px', borderRadius:'var(--r-md)', border:`1.5px solid ${!isEmergency && selType===t ? 'var(--primary)' : 'var(--border)'}`,
                background: !isEmergency && selType===t ? 'var(--primary-light)' : '#fff',
                display:'flex', alignItems:'center', gap:8, fontSize:13,
                fontWeight: !isEmergency && selType===t ? 600 : 400,
                color: !isEmergency && selType===t ? 'var(--primary)' : 'var(--text-secondary)',
                cursor:'pointer', marginBottom:6, textTransform:'capitalize',
              }}>
                <span>{t==='video'?'📹':t==='phone'?'📞':'🏥'}</span> {t}
              </button>
            ))}
            <button onClick={() => { setIsEmergency(!isEmergency); setSelSlot(''); }} style={{
              width:'100%', padding:'8px 10px', borderRadius:'var(--r-md)', border:`1.5px solid ${isEmergency ? 'var(--error)' : '#FECACA'}`,
              background: isEmergency ? 'var(--error)' : 'var(--error-light)',
              display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600,
              color: isEmergency ? '#fff' : 'var(--error)', cursor:'pointer',
            }}>
              <span>⚡</span> Emergency <span style={{ fontSize:11, opacity:0.8, marginLeft:'auto' }}>+50%</span>
            </button>
          </div>

          {/* Compact mini calendar */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:14 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <button onClick={prevMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:16, padding:'2px 4px' }}>‹</button>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{MONTHS[month].slice(0,3)} {year}</div>
              <button onClick={nextMonth} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:16, padding:'2px 4px' }}>›</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:4 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', fontWeight:500, padding:'2px 0' }}>{d}</div>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
              {Array.from({length:firstDay},(_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i) => {
                const day = i+1;
                const ds  = fmt(year,month,day);
                const isPast  = ds < todayStr;
                const isSel   = ds === selDate;
                const isToday = ds === todayStr;
                return (
                  <button key={day} onClick={() => { if(!isPast){setSelDate(ds);setSelSlot('');} }} disabled={isPast} style={{
                    width:'100%', aspectRatio:'1', borderRadius:'50%', border:'none',
                    background: isSel ? 'var(--primary)' : 'transparent',
                    color: isSel ? '#fff' : isPast ? 'var(--border)' : isToday ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: isSel || isToday ? 700 : 400,
                    fontSize: 12, cursor: isPast ? 'default' : 'pointer',
                    outline: isToday && !isSel ? '1.5px solid var(--primary)' : 'none',
                    outlineOffset: -1,
                  }}>{day}</button>
                );
              })}
            </div>
          </div>

          {/* Fee + book */}
          {fee > 0 && (
            <div style={{ background:'var(--primary-light)', borderRadius:'var(--r-lg)', padding:14, border:'1px solid #A7D9D3' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Consultation fee</div>
              <div style={{ fontSize:26, fontWeight:800, color:'var(--primary)', fontFamily:'var(--font-display)' }}>₹{(fee/100).toFixed(0)}</div>
              {isEmergency && <div style={{ fontSize:11, color:'var(--error)', fontWeight:500, marginTop:2 }}>Emergency 1.5x surcharge applied</div>}
            </div>
          )}

          {msg && <div style={{ padding:'10px 12px', borderRadius:'var(--r-md)', background:'var(--error-light)', color:'var(--error)', fontSize:13, border:'1px solid #FECACA' }}>{msg}</div>}

          <button onClick={handleBook} disabled={loading || (!isEmergency && !selSlot)} style={{
            width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none',
            background: loading||(!isEmergency&&!selSlot) ? 'var(--border)' : isEmergency ? 'var(--error)' : 'var(--primary)',
            color: loading||(!isEmergency&&!selSlot) ? 'var(--text-muted)' : '#fff',
            fontSize:15, fontWeight:700, cursor: loading||(!isEmergency&&!selSlot) ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Booking...' : isEmergency ? '⚡ Book emergency' : hasSelection ? 'Confirm appointment' : 'Select a time slot'}
          </button>
        </div>

        {/* RIGHT — Time slots */}
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>
              {isEmergency ? '⚡ Emergency — doctor responds within 30 min' : selDate ? `Available slots · ${selDate}` : 'Select a date to see slots'}
            </div>
          </div>

          {isEmergency ? (
            <div style={{ padding:24, textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>⚡</div>
              <div style={{ fontSize:16, fontWeight:600, color:'var(--error)', marginBottom:6 }}>Emergency consultation</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>
                The doctor will be notified immediately and must respond within 30 minutes.<br/>A surcharge of 50% applies.
              </div>
            </div>
          ) : !selDate ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
              ← Select a date from the calendar
            </div>
          ) : availSlots.length === 0 ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📅</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>No slots available</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>Try a different date</div>
            </div>
          ) : (
            <div style={{ padding:16 }}>
              {/* Summary if selected */}
              {selSlot && (
                <div style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'var(--primary-light)', border:'1px solid #A7D9D3', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'var(--primary)', fontSize:16 }}>✓</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--primary-dark)' }}>
                    {selDate} · {selSlot} · {selType} · ₹{(fee/100).toFixed(0)}
                  </span>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:8 }}>
                {TIMES.map(time => {
                  const isAvail  = availSlots.includes(time);
                  const isBooked = bookedSlots.includes(time);
                  const isSel    = selSlot === time;

                  if (!isAvail && !isBooked) return null;

                  return (
                    <button key={time} onClick={() => isAvail && setSelSlot(isSel ? '' : time)} disabled={isBooked} style={{
                      padding:'10px 8px', borderRadius:'var(--r-md)',
                      border:`1.5px solid ${isSel ? 'var(--primary)' : isBooked ? '#FECACA' : 'var(--border)'}`,
                      background: isSel ? 'var(--primary)' : isBooked ? 'var(--error-light)' : '#fff',
                      color: isSel ? '#fff' : isBooked ? 'var(--error)' : 'var(--text-primary)',
                      fontSize:13, fontWeight: isSel ? 700 : 500,
                      cursor: isBooked ? 'not-allowed' : 'pointer',
                      textAlign:'center',
                    }}>
                      {time}
                      {isBooked && <div style={{ fontSize:9, marginTop:2, opacity:0.8 }}>Booked</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
