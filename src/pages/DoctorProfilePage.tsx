import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const SPECIALTY_COLORS: Record<string, string> = {
  allopathy:'#2563EB', homeopathy:'#7C3AED', ayurveda:'#0A7B6C',
  yoga:'#EA580C', naturopathy:'#16A34A', unani:'#0369A1',
};

const SPECIALTY_LABELS: Record<string, string> = {
  allopathy:'Allopathy', homeopathy:'Homeopathy', ayurveda:'Ayurveda',
  yoga:'Yoga Therapy', naturopathy:'Naturopathy', unani:'Unani',
};

export default function DoctorProfilePage({ doctorId, onBook, onAsk }: {
  doctorId: string;
  onBook: (doctorId: string) => void;
  onAsk: () => void;
}) {
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor-profile-public', doctorId],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/${doctorId}`);
      return data.data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['doctor-reviews-public', doctorId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/doctor/${doctorId}`);
      return data.data as any[] || [];
    },
  });

  if (isLoading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
      Loading doctor profile...
    </div>
  );

  if (!doctor) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', fontFamily:'var(--font-body)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>👨‍⚕️</div>
        <div style={{ fontSize:16, color:'var(--text-muted)' }}>Doctor not found.</div>
      </div>
    </div>
  );

  const color = SPECIALTY_COLORS[doctor.medical_system] || 'var(--primary)';
  const initials = doctor.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'D';
  const rating = doctor.avg_rating ? parseFloat(String(doctor.avg_rating)).toFixed(1) : null;
  const fees = Array.isArray(doctor.fees) ? doctor.fees.filter((f: any) => f?.fee) : [];
  const minFee = fees.length > 0 ? Math.min(...fees.map((f: any) => f.fee)) : null;
  const consultTypes = Array.isArray(doctor.consult_types) ? doctor.consult_types : [];

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'28px 24px', fontFamily:'var(--font-body)' }}>

      {/* Hero card */}
      <div style={{ background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', overflow:'hidden', marginBottom:20, boxShadow:'var(--shadow-md)' }}>
        <div style={{ height:6, background:`linear-gradient(90deg, ${color}, ${color}88)` }}/>
        <div style={{ padding:'28px 28px 24px' }}>
          <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
            {/* Avatar */}
            <div style={{ width:90, height:90, borderRadius:'50%', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:800, color, flexShrink:0, border:`3px solid ${color}30` }}>
              {initials}
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color:'var(--text-primary)', margin:0 }}>{doctor.full_name}</h1>
                {doctor.profile_status === 'verified' && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:'var(--r-full)', background:'#ECFDF5', border:'1px solid #A7F3D0' }}>
                    <span style={{ fontSize:12 }}>✅</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'#065F46' }}>Verified</span>
                  </div>
                )}
              </div>
              <div style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:8 }}>
                {doctor.degree}{doctor.specialization ? ` · ${doctor.specialization}` : ''}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:12 }}>
                <span style={{ padding:'4px 12px', borderRadius:'var(--r-full)', background:`${color}15`, color, fontSize:13, fontWeight:600 }}>
                  {SPECIALTY_LABELS[doctor.medical_system] || doctor.medical_system}
                </span>
                {doctor.experience_years > 0 && (
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>💼 {doctor.experience_years} years experience</span>
                )}
                {doctor.city && (
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>📍 {doctor.city}{doctor.state ? `, ${doctor.state}` : ''}</span>
                )}
                {rating && (
                  <span style={{ fontSize:13, color:'var(--text-secondary)' }}>⭐ {rating} ({doctor.total_reviews || 0} reviews)</span>
                )}
              </div>

              {/* Languages */}
              {doctor.languages && doctor.languages.length > 0 && (
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>Speaks:</span>
                  {(Array.isArray(doctor.languages) ? doctor.languages : [doctor.languages]).map((l: string) => (
                    <span key={l} style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>{l}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Book CTA */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0, minWidth:160 }}>
              {minFee && (
                <div style={{ textAlign:'center', marginBottom:4 }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>
                    ₹{(minFee/100).toFixed(0)}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>onwards per consultation</div>
                </div>
              )}
              <button onClick={() => onBook(doctorId)} style={{ padding:'11px 20px', borderRadius:'var(--r-md)', background:color, color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', width:'100%' }}>
                📅 Book consultation
              </button>
              <button onClick={onAsk} style={{ padding:'10px 20px', borderRadius:'var(--r-md)', background:'#fff', color:color, border:`1.5px solid ${color}`, fontSize:13, fontWeight:600, cursor:'pointer', width:'100%' }}>
                💬 Ask a question
              </button>
              <div style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center' }}>
                🔒 Contact via WellConsult only
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* Consultation types & fees */}
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>💊 Consultation fees</h2>
          {fees.length === 0 ? (
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>Fees not set yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {fees.map((f: any) => (
                <div key={f.type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span>{f.type==='video'?'📹':f.type==='phone'?'📞':'🏥'}</span>
                    <span style={{ fontSize:13, textTransform:'capitalize', color:'var(--text-primary)' }}>{f.type} consultation</span>
                  </div>
                  <span style={{ fontSize:15, fontWeight:700, color:color }}>₹{(f.fee/100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration & credentials */}
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>🎓 Credentials</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {doctor.degree && (
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)', width:100, flexShrink:0 }}>Degree</span>
                <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{doctor.degree}</span>
              </div>
            )}
            {doctor.reg_number && (
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)', width:100, flexShrink:0 }}>Reg. No.</span>
                <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{doctor.reg_number}</span>
              </div>
            )}
            {doctor.reg_body && (
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)', width:100, flexShrink:0 }}>Reg. Body</span>
                <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{doctor.reg_body}</span>
              </div>
            )}
            {doctor.experience_years > 0 && (
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ fontSize:12, color:'var(--text-muted)', width:100, flexShrink:0 }}>Experience</span>
                <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{doctor.experience_years} years</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      {doctor.bio && (
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px', marginBottom:16 }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>👨‍⚕️ About</h2>
          <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, margin:0 }}>{doctor.bio}</p>
        </div>
      )}

      {/* Privacy notice */}
      <div style={{ padding:'12px 16px', borderRadius:'var(--r-md)', background:'#FFFBEB', border:'1px solid #FDE68A', fontSize:12, color:'#92400E', marginBottom:16 }}>
        🔒 <strong>Privacy protected:</strong> Doctor's personal contact details are not shared. All communication happens securely through WellConsult to protect both patients and practitioners.
      </div>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', margin:0 }}>⭐ Patient reviews</h2>
            {rating && (
              <div style={{ padding:'4px 12px', borderRadius:'var(--r-full)', background:'#FFFBEB', border:'1px solid #FDE68A', fontSize:13, fontWeight:700, color:'#92400E' }}>
                {rating} / 5
              </div>
            )}
            <span style={{ fontSize:13, color:'var(--text-muted)' }}>({reviews.length} reviews)</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {reviews.slice(0,5).map((r: any) => (
              <div key={r.id} style={{ padding:'14px 16px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color, flexShrink:0 }}>
                    {r.patient_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'P'}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{r.patient_name}</div>
                    <div style={{ color:'#F59E0B', fontSize:12 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)' }}>
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </div>
                </div>
                {r.review_text && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0, lineHeight:1.6 }}>{r.review_text}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
