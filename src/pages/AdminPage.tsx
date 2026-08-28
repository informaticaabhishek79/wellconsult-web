import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LegalPagesAdmin from './LegalPagesAdmin';
import LegalPage from './LegalPage';
import { api } from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState<'pending'|'kyc'|'legal'|'stats'>('pending');
  const [adminLegalSlug, setAdminLegalSlug] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [docUrl, setDocUrl] = useState('');
  const [deciding, setDeciding] = useState<string | null>(null);

  const viewDocument = async (doctorId: string, docType: string) => {
    try {
      const { data } = await api.get(`/verification/document/${doctorId}/${docType}`);
      setDocUrl(data.data.url);
      setSelectedDoc({ doctorId, docType });
    } catch { alert('Could not load document.'); }
  };

  const handleDecision = async (doctorId: string, decision: 'approved'|'rejected', reason?: string) => {
    setDeciding(doctorId);
    try {
      await api.patch(`/verification/${doctorId}/decision`, { decision, reason });
      qc.invalidateQueries({ queryKey: ['kyc-pending'] });
      alert(`Doctor ${decision} successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed.');
    } finally { setDeciding(null); }
  };
  const qc = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: async () => { const { data } = await api.get('/admin/doctors/pending'); return data.data || []; },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const { data } = await api.get('/admin/stats'); return data.data; },
  });

  const { data: kycPending } = useQuery({
    queryKey: ['kyc-pending'],
    queryFn: async () => { const { data } = await api.get('/verification/pending'); return data.data || []; },
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
        {([['pending',`Verify (${pending?.length||0})`],['kyc',`KYC Docs (${kycPending?.length||0})`],['legal','Legal Pages'],['stats','Platform stats']] as const).map(([key,label]) => (
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
                  <button onClick={() => {
                    alert('⚠️ Please review documents in the KYC Docs tab before verifying. Go to KYC Docs tab → view all 3 required documents → click Approve.');
                  }} style={{ flex: 2, padding: '9px', borderRadius: 'var(--r-md)', border: 'none', background: '#9CA3AF', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'not-allowed' }}>
                    ⚠️ Review KYC Docs First
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {tab === 'legal' && (adminLegalSlug ? <LegalPage slug={adminLegalSlug} onBack={() => setAdminLegalSlug(null)} /> : <LegalPagesAdmin onView={(slug) => setAdminLegalSlug(slug)} />)}

      {tab === 'kyc' && (
        <div>
          {selectedDoc && docUrl && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }} onClick={() => { setSelectedDoc(null); setDocUrl(''); }}>
              <div style={{ background:'#fff', borderRadius:'var(--r-xl)', overflow:'hidden', maxWidth:700, maxHeight:'85vh', width:'100%' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600 }}>Document: {selectedDoc.docType.replace(/_/g,' ')}</span>
                  <button onClick={() => { setSelectedDoc(null); setDocUrl(''); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20 }}>✕</button>
                </div>
                {docUrl.includes('.pdf') ? (
                  <iframe src={docUrl} style={{ width:'100%', height:'70vh', border:'none' }}/>
                ) : (
                  <img src={docUrl} style={{ width:'100%', maxHeight:'70vh', objectFit:'contain' }} alt="Document"/>
                )}
              </div>
            </div>
          )}

          {!kycPending?.length ? (
            <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:17, fontWeight:600 }}>No pending KYC documents</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {kycPending.map((doc: any) => (
                <div key={doc.id} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:20, boxShadow:'var(--shadow-sm)' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{doc.full_name}</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>
                        {doc.email} · {doc.medical_system} · {doc.degree} · {doc.city}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                        Reg: {doc.reg_number} · Specialization: {doc.specialization || 'N/A'}
                      </div>
                    </div>
                    <div style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:600, flexShrink:0 }}>
                      {doc.profile_status}
                    </div>
                  </div>

                  {/* Documents */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
                    {(doc.documents || []).map((d: any) => (
                      <button key={d.document_type} onClick={() => viewDocument(doc.id, d.document_type)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        👁️ {d.document_type.replace(/_/g,' ')}
                      </button>
                    ))}
                    {(!doc.documents || doc.documents.length === 0) && (
                      <span style={{ fontSize:13, color:'var(--text-muted)' }}>No documents uploaded yet</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={() => handleDecision(doc.id, 'approved')} disabled={deciding === doc.id} style={{ padding:'8px 20px', borderRadius:'var(--r-md)', background:'#16A34A', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      ✓ Approve
                    </button>
                    <button onClick={() => { const r = prompt('Rejection reason:'); if (r) handleDecision(doc.id, 'rejected', r); }} disabled={deciding === doc.id} style={{ padding:'8px 20px', borderRadius:'var(--r-md)', background:'#EF4444', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
