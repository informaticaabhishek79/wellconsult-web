import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../store';
import { api } from '../api';
import { io } from 'socket.io-client';
import { TokenStorage } from '../api';

const SPECIALTY_COLORS: Record<string, string> = {
  allopathy:'#2563EB', homeopathy:'#7C3AED', ayurveda:'#0A7B6C',
  yoga:'#EA580C', naturopathy:'#16A34A', unani:'#0369A1',
};

export default function OnlineDoctors({ onBook }: { onBook: (doctorId: string) => void }) {
  const { user } = useAuth();
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [instantRequest, setInstantRequest] = useState<{ doctorId: string; doctorName: string } | null>(null);
  const [requestStatus, setRequestStatus] = useState<'idle'|'pending'|'accepted'|'declined'>('idle');
  const [declineData, setDeclineData] = useState<{ suggestedTime?: string; surgeMultiplier?: number } | null>(null);
  const [socket, setSocket] = useState<any>(null);

  const { data: onlineDoctors, isLoading } = useQuery({
    queryKey: ['online-doctors'],
    queryFn: async () => {
      const { data } = await api.get('/doctors/online');
      return data.data as any[] || [];
    },
    refetchInterval: 30000, // refresh every 30s
  });

  useEffect(() => {
    const token = TokenStorage.get('access_token');
    const s = io('https://doctors.deemona.com', {
      auth: { token }, transports: ['websocket', 'polling'],
    });
    setSocket(s);

    s.on('doctor_status', ({ doctorId, status }: { doctorId: string; status: string }) => {
      setOnlineStatus(prev => ({ ...prev, [doctorId]: status === 'online' }));
    });

    s.on('instant_consult_response', ({ status }: { status: string }) => {
      setRequestStatus(status as any);
    });

    s.on('instant_consult_accepted', () => {
      setRequestStatus('accepted');
    });

    s.on('instant_consult_declined', (data: { suggestedTime?: string; surgeMultiplier?: number }) => {
      setRequestStatus('declined');
      setDeclineData(data);
    });

    return () => s.disconnect();
  }, []);

  const sendInstantRequest = (doctor: any) => {
    if (!socket) return;
    setInstantRequest({ doctorId: doctor.id, doctorName: doctor.full_name });
    setRequestStatus('pending');
    socket.emit('instant_consult_request', {
      doctorId: doctor.id,
      patientName: user?.full_name || 'Patient',
    });
  };

  const handleInsist = () => {
    // Patient insists on same time with surge pricing
    if (instantRequest) {
      onBook(instantRequest.doctorId);
    }
    setInstantRequest(null);
    setRequestStatus('idle');
  };

  if (isLoading) return (
    <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
      Loading online doctors...
    </div>
  );

  return (
    <div style={{ fontFamily:'var(--font-body)' }}>
      {/* Instant request modal */}
      {instantRequest && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:420, width:'100%', boxShadow:'var(--shadow-xl)', textAlign:'center' }}>
            {requestStatus === 'pending' && (
              <>
                <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:8 }}>Requesting consultation...</h3>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:20 }}>
                  Waiting for Dr. {instantRequest.doctorName} to respond
                </p>
                <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:20 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--primary)', animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
                </div>
                <button onClick={() => { setInstantRequest(null); setRequestStatus('idle'); }}
                  style={{ padding:'10px 24px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>
                  Cancel
                </button>
              </>
            )}
            {requestStatus === 'accepted' && (
              <>
                <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'#16A34A', marginBottom:8 }}>Doctor accepted!</h3>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:20 }}>
                  Dr. {instantRequest.doctorName} is ready to consult with you now.
                </p>
                <button onClick={() => { setInstantRequest(null); setRequestStatus('idle'); onBook(instantRequest.doctorId); }}
                  style={{ width:'100%', padding:'12px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
                  📅 Book now →
                </button>
              </>
            )}
            {requestStatus === 'declined' && (
              <>
                <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:8 }}>Doctor is busy</h3>
                {declineData?.suggestedTime && (
                  <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:12 }}>
                    Dr. {instantRequest.doctorName} suggests: <strong>{declineData.suggestedTime}</strong>
                  </p>
                )}
                {declineData?.surgeMultiplier && (
                  <div style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'#FFFBEB', border:'1px solid #FDE68A', fontSize:13, color:'#92400E', marginBottom:16 }}>
                    ⚡ Instant consultation available at <strong>{declineData.surgeMultiplier}x</strong> the normal fee
                  </div>
                )}
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setInstantRequest(null); setRequestStatus('idle'); }}
                    style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:13, cursor:'pointer' }}>
                    Cancel
                  </button>
                  {declineData?.suggestedTime && (
                    <button onClick={() => { setInstantRequest(null); setRequestStatus('idle'); onBook(instantRequest.doctorId); }}
                      style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      Book {declineData.suggestedTime}
                    </button>
                  )}
                  {declineData?.surgeMultiplier && (
                    <button onClick={handleInsist}
                      style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background:'#F59E0B', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      ⚡ Book now ({declineData.surgeMultiplier}x)
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Online doctors header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:10, height:10, borderRadius:'50%', background:'#22C55E', boxShadow:'0 0 6px #22C55E' }}/>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text-primary)', margin:0 }}>
          Doctors Online Now
        </h2>
        <span style={{ fontSize:13, color:'var(--text-muted)' }}>({(onlineDoctors || []).length} available)</span>
      </div>

      {onlineDoctors?.length === 0 ? (
        <div style={{ padding:'24px', background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>👨‍⚕️</div>
          <div style={{ fontSize:14, color:'var(--text-muted)' }}>No doctors online right now. <a href="#" onClick={() => onBook('')} style={{ color:'var(--primary)' }}>Schedule an appointment</a></div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
          {(onlineDoctors || []).map((doc: any) => {
            const color = SPECIALTY_COLORS[doc.medical_system] || 'var(--primary)';
            const minFee = doc.min_fee ? `₹${(doc.min_fee/100).toFixed(0)}` : null;
            return (
              <div key={doc.id} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color }}>
                      {doc.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                    </div>
                    <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, borderRadius:'50%', background:'#22C55E', border:'2px solid #fff', boxShadow:'0 0 4px #22C55E' }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{doc.full_name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {doc.medical_system} {doc.city ? `· ${doc.city}` : ''}
                    </div>
                    {doc.avg_rating && (
                      <div style={{ fontSize:11, color:'#F59E0B' }}>⭐ {parseFloat(doc.avg_rating).toFixed(1)}</div>
                    )}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => sendInstantRequest(doc)} style={{ flex:1, padding:'8px', borderRadius:'var(--r-md)', border:'none', background:'#22C55E', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                    ⚡ Consult Now
                  </button>
                  <button onClick={() => onBook(doc.id)} style={{ flex:1, padding:'8px', borderRadius:'var(--r-md)', border:`1.5px solid ${color}`, background:'#fff', color, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    📅 Schedule
                  </button>
                </div>
                {minFee && <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:6 }}>From {minFee}/consultation</div>}
              </div>
            );
          })}
        </div>
      )}
      <style>{"@keyframes pulse { 0%,60%,100% { opacity:0.3; } 30% { opacity:1; } }"}</style>
    </div>
  );
}
