import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const CASE_TYPES = [
  { value:'misconduct',        label:'👤 Professional Misconduct' },
  { value:'fraud_documents',   label:'📄 Fraudulent Documents/Degree' },
  { value:'patient_complaint', label:'🏥 Patient Complaint' },
  { value:'prescription_abuse',label:'💊 Prescription Abuse' },
  { value:'harassment',        label:'⚠️ Patient Harassment' },
  { value:'billing_fraud',     label:'💰 Billing Fraud' },
  { value:'fake_credentials',  label:'🎭 Fake Credentials' },
  { value:'other',             label:'📋 Other' },
];

const SEVERITY = [
  { value:'low',      label:'🟡 Low',      color:'#D97706' },
  { value:'medium',   label:'🟠 Medium',   color:'#EA580C' },
  { value:'high',     label:'🔴 High',     color:'#DC2626' },
  { value:'critical', label:'⛔ Critical', color:'#7F1D1D' },
];

const STATUS = [
  { value:'open',        label:'🔓 Open',        color:'#2563EB' },
  { value:'investigating',label:'🔍 Investigating',color:'#D97706' },
  { value:'resolved',    label:'✅ Resolved',    color:'#16A34A' },
  { value:'dismissed',   label:'❌ Dismissed',   color:'#6B7280' },
];

export default function DoctorCaseManager({ doctor, onClose }: { doctor: any; onClose: () => void }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'list'|'new'|'detail'>('list');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    case_type: 'patient_complaint',
    title: '',
    description: '',
    incident_date: '',
    severity: 'medium',
  });

  const { data: cases, isLoading } = useQuery({
    queryKey: ['doctor-cases', doctor.id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/doctors/${doctor.id}/cases`);
      return data.data as any[] || [];
    },
  });

  const { data: evidence } = useQuery({
    queryKey: ['case-evidence', selectedCase?.id],
    enabled: !!selectedCase?.id,
    queryFn: async () => {
      const { data } = await api.get(`/admin/doctors/${doctor.id}/cases/${selectedCase.id}/evidence`);
      return data.data as any[] || [];
    },
  });

  const handleCreateCase = async () => {
    if (!form.title.trim() || !form.description.trim()) { alert('Title and description are required.'); return; }
    setSaving(true);
    try {
      await api.post(`/admin/doctors/${doctor.id}/cases`, form);
      qc.invalidateQueries({ queryKey: ['doctor-cases', doctor.id] });
      setView('list');
      setForm({ case_type:'patient_complaint', title:'', description:'', incident_date:'', severity:'medium' });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create case.');
    } finally { setSaving(false); }
  };

  const handleUploadEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCase) return;
    e.target.value = '';
    setUploading(true);
    try {
      const { data: urlData } = await api.post(`/admin/doctors/${doctor.id}/cases/${selectedCase.id}/evidence/upload-url`, {
        file_name: file.name, content_type: file.type,
      });
      await fetch(urlData.data.upload_url, { method:'PUT', body:file, headers:{ 'Content-Type':file.type } });
      await api.post(`/admin/doctors/${doctor.id}/cases/${selectedCase.id}/evidence`, {
        file_key: urlData.data.key, file_name: file.name, file_size: file.size,
      });
      qc.invalidateQueries({ queryKey: ['case-evidence', selectedCase.id] });
      qc.invalidateQueries({ queryKey: ['doctor-cases', doctor.id] });
    } catch (err: any) {
      alert('Upload failed: ' + (err.response?.data?.error?.message || err.message));
    } finally { setUploading(false); }
  };

  const handleViewEvidence = async (ev: any) => {
    try {
      const { data } = await api.get(`/admin/doctors/${doctor.id}/cases/${selectedCase.id}/evidence/${ev.id}/view`);
      window.open(data.data.url, '_blank');
    } catch { alert('Could not open file.'); }
  };

  const handleUpdateStatus = async (status: string, action_taken?: string) => {
    try {
      await api.patch(`/admin/doctors/${doctor.id}/cases/${selectedCase.id}`, { status, action_taken });
      qc.invalidateQueries({ queryKey: ['doctor-cases', doctor.id] });
      setSelectedCase((prev: any) => ({ ...prev, status, action_taken }));
    } catch { alert('Failed to update case.'); }
  };

  const getSeverityStyle = (s: string) => SEVERITY.find(x => x.value === s) || SEVERITY[1];
  const getStatusStyle  = (s: string) => STATUS.find(x => x.value === s) || STATUS[0];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:'var(--r-xl)', width:'100%', maxWidth:720, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-xl)' }}>
        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          {view !== 'list' && (
            <button onClick={() => { setView('list'); setSelectedCase(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)', padding:4 }}>←</button>
          )}
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, margin:0 }}>
              {view==='list' ? `📋 Case Files — ${doctor.full_name}` : view==='new' ? '➕ New Case' : `Case: ${selectedCase?.title}`}
            </h2>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
              {doctor.email} · {doctor.medical_system}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>✕</button>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={handleUploadEvidence}
          accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,.txt,.docx"/>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* LIST VIEW */}
          {view === 'list' && (
            <>
              <button onClick={() => setView('new')} style={{ width:'100%', padding:'12px', borderRadius:'var(--r-lg)', border:'2px dashed var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:16 }}>
                ➕ File New Case
              </button>
              {isLoading && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading cases...</div>}
              {!isLoading && (!cases || cases.length === 0) && (
                <div style={{ textAlign:'center', padding:60 }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>📁</div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>No cases filed</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>No misconduct or complaint cases have been recorded for this doctor.</div>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {(cases || []).map((c: any) => {
                  const sev = getSeverityStyle(c.severity);
                  const sta = getStatusStyle(c.status);
                  return (
                    <div key={c.id} onClick={() => { setSelectedCase(c); setView('detail'); }}
                      style={{ padding:'14px 16px', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', background:'#fff', cursor:'pointer', transition:'border-color 0.15s' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                            <span style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{c.title}</span>
                            <span style={{ padding:'2px 8px', borderRadius:'var(--r-full)', background:`${sev.color}15`, color:sev.color, fontSize:11, fontWeight:600 }}>{sev.label}</span>
                            <span style={{ padding:'2px 8px', borderRadius:'var(--r-full)', background:`${sta.color}15`, color:sta.color, fontSize:11, fontWeight:600 }}>{sta.label}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
                            {CASE_TYPES.find(t => t.value === c.case_type)?.label} · {c.incident_date ? new Date(c.incident_date).toLocaleDateString('en-IN') : 'Date not specified'}
                          </div>
                          <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.5 }}>
                            {c.description.slice(0, 120)}{c.description.length > 120 ? '...' : ''}
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</div>
                          {c.evidence_count > 0 && <div style={{ fontSize:11, color:'#2563EB', marginTop:4 }}>📎 {c.evidence_count} files</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* NEW CASE VIEW */}
          {view === 'new' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'#FEF2F2', borderRadius:'var(--r-md)', padding:'12px 14px', fontSize:13, color:'#991B1B' }}>
                ⚠️ Cases are permanent records. Ensure all information is accurate before filing.
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Case Type *</label>
                <select value={form.case_type} onChange={e => setForm(f => ({...f, case_type:e.target.value}))}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
                  {CASE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Case Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))}
                  placeholder="Brief title describing the incident..."
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Incident Date</label>
                  <input type="date" value={form.incident_date} onChange={e => setForm(f => ({...f, incident_date:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Severity *</label>
                  <select value={form.severity} onChange={e => setForm(f => ({...f, severity:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
                    {SEVERITY.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Detailed Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} rows={8}
                  placeholder="Provide a complete and detailed account of the misconduct, misbehavior, or violation. Include:&#10;- What happened&#10;- When and where&#10;- Patient/complainant details (if applicable)&#10;- Witnesses&#10;- Prior warnings&#10;- Any other relevant information"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', resize:'vertical' as any, lineHeight:1.6, boxSizing:'border-box' as any }}/>
              </div>

              <div style={{ background:'#EFF6FF', borderRadius:'var(--r-md)', padding:'12px 14px', fontSize:13, color:'#1D4ED8' }}>
                💡 After creating the case, you can attach evidence files (screenshots, documents, patient complaints, etc.)
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setView('list')} style={{ padding:'11px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:13, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
                <button onClick={handleCreateCase} disabled={saving || !form.title.trim() || !form.description.trim()}
                  style={{ flex:1, padding:'11px', borderRadius:'var(--r-md)', border:'none', background: saving ? 'var(--border)' : 'var(--primary)', color: saving ? 'var(--text-muted)' : '#fff', fontSize:13, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Filing case...' : '📋 File Case'}
                </button>
              </div>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && selectedCase && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Case Info */}
              <div style={{ padding:'16px', background:'var(--bg)', borderRadius:'var(--r-lg)', border:'1px solid var(--border)' }}>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
                  <span style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:`${getSeverityStyle(selectedCase.severity).color}15`, color:getSeverityStyle(selectedCase.severity).color, fontSize:12, fontWeight:600 }}>
                    {getSeverityStyle(selectedCase.severity).label}
                  </span>
                  <span style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:`${getStatusStyle(selectedCase.status).color}15`, color:getStatusStyle(selectedCase.status).color, fontSize:12, fontWeight:600 }}>
                    {getStatusStyle(selectedCase.status).label}
                  </span>
                  <span style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:'#F3F4F6', color:'var(--text-secondary)', fontSize:12 }}>
                    {CASE_TYPES.find(t => t.value === selectedCase.case_type)?.label}
                  </span>
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>
                  Filed by {selectedCase.admin_name} on {new Date(selectedCase.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                  {selectedCase.incident_date && ` · Incident: ${new Date(selectedCase.incident_date).toLocaleDateString('en-IN')}`}
                </div>
                <div style={{ fontSize:14, color:'var(--text-primary)', lineHeight:1.7, whiteSpace:'pre-wrap' as any }}>{selectedCase.description}</div>
              </div>

              {/* Update Status */}
              <div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Update Case Status</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {STATUS.map(s => (
                    <button key={s.value} onClick={() => handleUpdateStatus(s.value)}
                      style={{ padding:'7px 14px', borderRadius:'var(--r-md)', border:`1.5px solid ${s.color}`, background: selectedCase.status===s.value ? `${s.color}20` : '#fff', color:s.color, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evidence */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>📎 Evidence Files</div>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ padding:'7px 14px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor: uploading ? 'not-allowed' : 'pointer' }}>
                    {uploading ? '⏳ Uploading...' : '📤 Upload Evidence'}
                  </button>
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>
                  Accepted: PDF, Images (JPG/PNG), Videos (MP4/MOV), Documents (DOCX, TXT)
                </div>
                {(!evidence || evidence.length === 0) ? (
                  <div style={{ padding:'20px', textAlign:'center', border:'2px dashed var(--border)', borderRadius:'var(--r-md)', color:'var(--text-muted)', fontSize:13 }}>
                    No evidence uploaded yet. Click "Upload Evidence" to add files.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {evidence.map((ev: any) => (
                      <div key={ev.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                        <span style={{ fontSize:20 }}>
                          {ev.file_name.match(/\.(pdf)$/i) ? '📄' : ev.file_name.match(/\.(jpg|jpeg|png)$/i) ? '🖼️' : ev.file_name.match(/\.(mp4|mov)$/i) ? '🎥' : '📎'}
                        </span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{ev.file_name}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                            {ev.file_size ? `${(ev.file_size / 1024).toFixed(1)} KB · ` : ''}
                            Uploaded by {ev.uploaded_by_name} · {new Date(ev.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <button onClick={() => handleViewEvidence(ev)}
                          style={{ padding:'5px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                          👁️ View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
