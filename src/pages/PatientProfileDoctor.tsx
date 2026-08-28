import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export default function PatientProfileDoctor({ patientId, patientName, onClose, onViewRecord }: {
  patientId: string;
  patientName?: string;
  onClose: () => void;
  onViewRecord?: (record: any) => void;
}) {
  const [tab, setTab] = useState<'overview'|'records'|'prescriptions'|'appointments'>('overview');

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['patient-history-doctor', patientId],
    queryFn: async () => {
      const { data } = await api.get(`/patients/${patientId}/history`);
      return data.data;
    },
  });

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['patient-records-doctor', patientId],
    queryFn: async () => {
      const { data } = await api.get(`/patients/me/records/patient/${patientId}`);
      return data.data as any[] || [];
    },
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['patient-prescriptions-doctor', patientId],
    queryFn: async () => {
      const { data } = await api.get(`/prescriptions?patient_id=${patientId}`);
      return data.data as any[] || [];
    },
  });

  const viewRecord = async (record: any) => {
    try {
      const { data } = await api.get(`/patients/me/records/${record.id}/view`);
      window.open(data.data.url, '_blank');
    } catch { alert('Could not load document.'); }
  };

  const bmi = history?.height_cm && history?.weight_kg
    ? (history.weight_kg / Math.pow(history.height_cm / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5 ? { label:'Underweight', color:'#3B82F6' }
      : parseFloat(bmi) < 25 ? { label:'Normal', color:'#16A34A' }
      : parseFloat(bmi) < 30 ? { label:'Overweight', color:'#F59E0B' }
      : { label:'Obese', color:'#EF4444' }
    : null;

  const diagnosticRecords = (records || []).filter((r: any) => r.category === 'diagnostic');
  const labRecords = (records || []).filter((r: any) => r.category === 'pathological');

  const TABS = [
    { id:'overview', label:'📋 Overview', count: null },
    { id:'records', label:'🔬 Reports', count: (records||[]).length },
    { id:'prescriptions', label:'💊 Prescriptions', count: (prescriptions||[]).length },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:'var(--r-xl)', width:'100%', maxWidth:700, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-xl)' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'var(--primary)', flexShrink:0 }}>
            {patientName?.split(' ').map(w => w[0]).slice(0,2).join('') || 'P'}
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text-primary)', margin:0 }}>{patientName || 'Patient'}</h2>
            <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>Complete patient profile — confidential</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{
              flex:1, padding:'12px 8px', border:'none', background:'none', cursor:'pointer',
              borderBottom:`2px solid ${tab===t.id ? 'var(--primary)' : 'transparent'}`,
              marginBottom:-1, fontSize:13, fontWeight: tab===t.id ? 700 : 400,
              color: tab===t.id ? 'var(--primary)' : 'var(--text-secondary)',
            }}>
              {t.label}{t.count !== null ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div>
              {loadingHistory && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</div>}
              {!loadingHistory && !history && (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
                  <div style={{ fontSize:14, color:'var(--text-muted)' }}>Patient hasn't filled medical history yet</div>
                </div>
              )}
              {!loadingHistory && history && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {/* Vitals */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                    {[
                      { label:'Blood Group', value: history.blood_group || '—', icon:'🩸' },
                      { label:'Height', value: history.height_cm ? `${history.height_cm} cm` : '—', icon:'📏' },
                      { label:'Weight', value: history.weight_kg ? `${history.weight_kg} kg` : '—', icon:'⚖️' },
                      { label:'BMI', value: bmi ? `${bmi}` : '—', icon:'📊', sub: bmiCategory?.label, color: bmiCategory?.color },
                    ].map(v => (
                      <div key={v.label} style={{ padding:'12px', background:'var(--bg)', borderRadius:'var(--r-md)', textAlign:'center', border:'1px solid var(--border)' }}>
                        <div style={{ fontSize:20, marginBottom:4 }}>{v.icon}</div>
                        <div style={{ fontSize:16, fontWeight:700, color: (v as any).color || 'var(--text-primary)' }}>{v.value}</div>
                        {(v as any).sub && <div style={{ fontSize:10, color:(v as any).color, fontWeight:600 }}>{(v as any).sub}</div>}
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{v.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Conditions */}
                  {history.chronic_conditions?.length > 0 && (
                    <div style={{ background:'#FEF2F2', borderRadius:'var(--r-md)', padding:'12px 14px', border:'1px solid #FECACA' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#991B1B', marginBottom:8 }}>🏥 Chronic Conditions</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {(Array.isArray(history.chronic_conditions) ? history.chronic_conditions : JSON.parse(history.chronic_conditions || '[]')).map((c: string) => (
                          <span key={c} style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:'#fff', color:'#991B1B', fontSize:12, border:'1px solid #FECACA', fontWeight:500 }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergies */}
                  {history.allergies?.length > 0 && (
                    <div style={{ background:'#FFFBEB', borderRadius:'var(--r-md)', padding:'12px 14px', border:'1px solid #FDE68A' }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#92400E', marginBottom:8 }}>⚠️ Allergies</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {(Array.isArray(history.allergies) ? history.allergies : JSON.parse(history.allergies || '[]')).map((a: string) => (
                          <span key={a} style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:'#fff', color:'#92400E', fontSize:12, border:'1px solid #FDE68A', fontWeight:500 }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical details */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { label:'Current Medications', value: history.current_medications, icon:'💊' },
                      { label:'Past Surgeries', value: history.past_surgeries, icon:'🔪' },
                      { label:'Family History', value: history.family_history, icon:'👨‍👩‍👧' },
                      { label:'Lifestyle', value: `Smoking: ${history.smoking || '—'} · Alcohol: ${history.alcohol || '—'}`, icon:'🌿' },
                    ].map(item => item.value && (
                      <div key={item.label} style={{ padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{item.icon} {item.label}</div>
                        <div style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.5 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Emergency contact */}
                  {(history.emergency_contact_name || history.emergency_contact_phone) && (
                    <div style={{ padding:'12px 14px', background:'#EFF6FF', borderRadius:'var(--r-md)', border:'1px solid #BFDBFE' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#1D4ED8', marginBottom:4 }}>🆘 Emergency Contact</div>
                      <div style={{ fontSize:13, color:'#1D4ED8' }}>{history.emergency_contact_name} — {history.emergency_contact_phone}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RECORDS TAB */}
          {tab === 'records' && (
            <div>
              {loadingRecords && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</div>}
              {!loadingRecords && records?.length === 0 && (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📂</div>
                  <div style={{ fontSize:14, color:'var(--text-muted)' }}>No reports uploaded yet</div>
                </div>
              )}
              {!loadingRecords && records && records.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {diagnosticRecords.length > 0 && (
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#2563EB', marginBottom:8 }}>🔬 Diagnostic / Imaging Reports ({diagnosticRecords.length})</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {diagnosticRecords.map((r: any) => (
                          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                            <span style={{ fontSize:16 }}>🔬</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{r.test_name}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.file_name}{r.report_date ? ' · ' + new Date(r.report_date).toLocaleDateString('en-IN') : ''}</div>
                            </div>
                            <button onClick={() => viewRecord(r)} style={{ padding:'5px 12px', borderRadius:'var(--r-md)', border:'1px solid #2563EB', background:'#EFF6FF', color:'#2563EB', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                              👁️ View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {labRecords.length > 0 && (
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#7C3AED', marginBottom:8 }}>🧪 Lab / Pathology Reports ({labRecords.length})</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                        {labRecords.map((r: any) => (
                          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                            <span style={{ fontSize:16 }}>🧪</span>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{r.test_name}</div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.file_name}{r.report_date ? ' · ' + new Date(r.report_date).toLocaleDateString('en-IN') : ''}</div>
                            </div>
                            <button onClick={() => viewRecord(r)} style={{ padding:'5px 12px', borderRadius:'var(--r-md)', border:'1px solid #7C3AED', background:'#F5F3FF', color:'#7C3AED', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                              👁️ View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTIONS TAB */}
          {tab === 'prescriptions' && (
            <div>
              {!prescriptions?.length ? (
                <div style={{ textAlign:'center', padding:40 }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>💊</div>
                  <div style={{ fontSize:14, color:'var(--text-muted)' }}>No prescriptions yet</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {prescriptions.map((rx: any) => (
                    <div key={rx.id} style={{ padding:'14px 16px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>💊 {rx.medical_system} prescription</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{new Date(rx.issued_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      {rx.items?.map((item: any, i: number) => (
                        <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:2 }}>
                          • {item.medicine_name} — {item.dosage}, {item.frequency}, {item.duration_days} days
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
