import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  verified:  { bg:'#ECFDF5', color:'#065F46', label:'✅ Verified' },
  pending:   { bg:'#FFFBEB', color:'#92400E', label:'⏳ Pending' },
  suspended: { bg:'#FEF2F2', color:'#991B1B', label:'🚫 Suspended' },
  rejected:  { bg:'#FEF2F2', color:'#991B1B', label:'❌ Rejected' },
};

const SPECIALTY_LABELS: Record<string, string> = {
  allopathy:'Allopathy', homeopathy:'Homeopathy', ayurveda:'Ayurveda',
  yoga:'Yoga Therapy', naturopathy:'Naturopathy', unani:'Unani',
};

export default function DoctorManagementAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [reinstateNote, setReinstateNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const { data } = await api.get('/admin/doctors');
      return data.data as any[] || [];
    },
  });

  const { data: suspensionLog } = useQuery({
    queryKey: ['suspension-log', selectedDoctor?.id],
    enabled: showLogModal && !!selectedDoctor?.id,
    queryFn: async () => {
      const { data } = await api.get(`/admin/doctors/${selectedDoctor.id}/log`);
      return data.data as any[] || [];
    },
  });

  const filtered = (doctors || []).filter((d: any) => {
    const matchSearch = !search || d.full_name?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.profile_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSuspend = async () => {
    if (!suspendReason.trim()) { alert('Please enter a suspension reason.'); return; }
    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${selectedDoctor.id}/suspend`, { reason: suspendReason });
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
      setShowSuspendModal(false); setSuspendReason(''); setSelectedDoctor(null);
      alert('Doctor suspended successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to suspend doctor.');
    } finally { setActionLoading(false); }
  };

  const handleReinstate = async (doctor: any) => {
    if (!window.confirm(`Reinstate Dr. ${doctor.full_name}? They will be able to accept patients again.`)) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/doctors/${doctor.id}/reinstate`, { note: 'Reinstated by admin' });
      qc.invalidateQueries({ queryKey: ['admin-doctors'] });
      alert('Doctor reinstated successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to reinstate doctor.');
    } finally { setActionLoading(false); }
  };

  const stats = {
    total: (doctors || []).length,
    verified: (doctors || []).filter((d: any) => d.profile_status === 'verified').length,
    suspended: (doctors || []).filter((d: any) => d.profile_status === 'suspended').length,
    pending: (doctors || []).filter((d: any) => d.profile_status === 'pending').length,
  };

  return (
    <div style={{ fontFamily:'var(--font-body)' }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, marginBottom:20 }}>Doctor Management</h2>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Doctors', value:stats.total, icon:'👨‍⚕️', color:'#2563EB' },
          { label:'Verified', value:stats.verified, icon:'✅', color:'#16A34A' },
          { label:'Pending', value:stats.pending, icon:'⏳', color:'#D97706' },
          { label:'Suspended', value:stats.suspended, icon:'🚫', color:'#DC2626' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'14px 16px' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%', padding:'9px 12px 9px 36px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedDoctor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:480, width:'100%', boxShadow:'var(--shadow-xl)' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'#DC2626', marginBottom:8 }}>🚫 Suspend Doctor</h3>
            <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:20 }}>
              You are about to suspend <strong>{selectedDoctor.full_name}</strong>. They will lose access to the platform and cannot accept new appointments.
            </p>
            <div style={{ background:'#FEF2F2', borderRadius:'var(--r-md)', padding:'12px 14px', marginBottom:16, fontSize:13, color:'#991B1B' }}>
              ⚠️ All upcoming appointments for this doctor must be handled separately.
            </div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:6 }}>Reason for suspension *</label>
            <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={4}
              placeholder="Describe the reason for suspension (misconduct, fraud documents, patient complaints, etc.)..."
              style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', resize:'vertical' as any, boxSizing:'border-box' as any, marginBottom:16 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowSuspendModal(false); setSuspendReason(''); }} style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:13, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleSuspend} disabled={actionLoading || !suspendReason.trim()} style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background: actionLoading || !suspendReason.trim() ? 'var(--border)' : '#DC2626', color: actionLoading || !suspendReason.trim() ? 'var(--text-muted)' : '#fff', fontSize:13, fontWeight:700, cursor: actionLoading || !suspendReason.trim() ? 'not-allowed' : 'pointer' }}>
                {actionLoading ? 'Suspending...' : '🚫 Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Log Modal */}
      {showLogModal && selectedDoctor && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:560, width:'100%', boxShadow:'var(--shadow-xl)', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700 }}>📋 Action Log — {selectedDoctor.full_name}</h3>
              <button onClick={() => { setShowLogModal(false); setSelectedDoctor(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>✕</button>
            </div>
            {!suspensionLog || suspensionLog.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
                No action history for this doctor.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {suspensionLog.map((log: any) => (
                  <div key={log.id} style={{ padding:'12px 14px', borderRadius:'var(--r-md)', border:`1px solid ${log.action==='suspended'?'#FECACA':'#A7F3D0'}`, background: log.action==='suspended'?'#FEF2F2':'#ECFDF5' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:13, fontWeight:700, color: log.action==='suspended'?'#991B1B':'#065F46' }}>
                        {log.action==='suspended' ? '🚫 Suspended' : '✅ Reinstated'}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>{log.reason}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>By: {log.admin_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctors List */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading doctors...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>👨‍⚕️</div>
          <div style={{ fontSize:16, color:'var(--text-muted)' }}>No doctors found</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((doc: any) => {
            const statusStyle = STATUS_COLORS[doc.profile_status] || STATUS_COLORS.pending;
            return (
              <div key={doc.id} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                  {/* Avatar */}
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'var(--primary)', flexShrink:0 }}>
                    {doc.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2, flexWrap:'wrap' }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{doc.full_name}</span>
                      <span style={{ padding:'2px 8px', borderRadius:'var(--r-full)', background:statusStyle.bg, color:statusStyle.color, fontSize:11, fontWeight:600 }}>{statusStyle.label}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>
                      {doc.email} {doc.phone ? `· ${doc.phone}` : ''}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontSize:12, color:'var(--text-muted)' }}>
                      {doc.medical_system && <span>🏥 {SPECIALTY_LABELS[doc.medical_system] || doc.medical_system}</span>}
                      {doc.degree && <span>🎓 {doc.degree}</span>}
                      {doc.city && <span>📍 {doc.city}{doc.state ? `, ${doc.state}` : ''}</span>}
                      {doc.experience_years > 0 && <span>💼 {doc.experience_years} yrs</span>}
                      {doc.avg_rating && <span>⭐ {parseFloat(doc.avg_rating).toFixed(1)}</span>}
                      {doc.total_consultations > 0 && <span>📊 {doc.total_consultations} consultations</span>}
                    </div>
                    {doc.profile_status === 'suspended' && doc.rejection_reason && (
                      <div style={{ marginTop:6, padding:'6px 10px', borderRadius:'var(--r-sm)', background:'#FEF2F2', fontSize:12, color:'#991B1B' }}>
                        🚫 Reason: {doc.rejection_reason}
                      </div>
                    )}
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                      Joined: {new Date(doc.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    <button onClick={() => { setSelectedDoctor(doc); setShowLogModal(true); }}
                      style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', color:'var(--text-secondary)', fontSize:11, cursor:'pointer', whiteSpace:'nowrap' }}>
                      📋 History
                    </button>
                    {doc.profile_status === 'verified' && (
                      <button onClick={() => { setSelectedDoctor(doc); setShowSuspendModal(true); }}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:11, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
                        🚫 Suspend
                      </button>
                    )}
                    {doc.profile_status === 'suspended' && (
                      <button onClick={() => handleReinstate(doc)} disabled={actionLoading}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #A7F3D0', background:'#ECFDF5', color:'#065F46', fontSize:11, fontWeight:600, cursor: actionLoading ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}>
                        ✅ Reinstate
                      </button>
                    )}
                    {doc.profile_status === 'rejected' && (
                      <button onClick={() => handleReinstate(doc)} disabled={actionLoading}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:600, cursor: actionLoading ? 'not-allowed' : 'pointer', whiteSpace:'nowrap' }}>
                        🔄 Re-verify
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
