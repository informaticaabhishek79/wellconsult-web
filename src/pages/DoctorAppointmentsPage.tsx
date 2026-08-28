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
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingRecords, setViewingRecords] = useState<any>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordsTab, setRecordsTab] = useState<'diagnostic'|'pathological'>('diagnostic');

  const viewPatientHistory = async (item: any) => {
    setViewingHistory(item);
    setPatientHistory(null);
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/patients/${item.patient_id}/history`);
      setPatientHistory(data.data);
    } catch { setPatientHistory(null); }
    finally { setLoadingHistory(false); }
  };

  const viewPatientRecords = async (item: any) => {
    setViewingRecords(item);
    setPatientRecords([]);
    setLoadingRecords(true);
    try {
      const { data } = await api.get(`/patients/me/records/patient/${item.patient_id}`);
      setPatientRecords(data.data || []);
    } catch { setPatientRecords([]); }
    finally { setLoadingRecords(false); }
  };

  const viewRecord = async (record: any) => {
    try {
      const { data } = await api.get(`/patients/me/records/${record.id}/view`);
      window.open(data.data.url, '_blank');
    } catch { alert('Could not load document.'); }
  };
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
    {viewingHistory && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, overflowY:'auto' }}>
        <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:560, width:'100%', boxShadow:'var(--shadow-xl)', margin:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text-primary)' }}>
              🏥 {viewingHistory.patient_name}'s Medical History
            </h2>
            <button onClick={() => { setViewingHistory(null); setPatientHistory(null); }} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>✕</button>
          </div>

          {loadingHistory && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</div>}

          {!loadingHistory && !patientHistory && (
            <div style={{ textAlign:'center', padding:40 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
              <div style={{ fontSize:15, color:'var(--text-muted)' }}>No medical history recorded yet</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Patient hasn't filled in their health profile</div>
            </div>
          )}

          {!loadingHistory && patientHistory && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[
                  { label:'Blood group', value: patientHistory.blood_group || '—' },
                  { label:'Height', value: patientHistory.height_cm ? `${patientHistory.height_cm}cm` : '—' },
                  { label:'Weight', value: patientHistory.weight_kg ? `${patientHistory.weight_kg}kg` : '—' },
                  { label:'BMI', value: patientHistory.height_cm && patientHistory.weight_kg ? (patientHistory.weight_kg / Math.pow(patientHistory.height_cm/100, 2)).toFixed(1) : '—' },
                ].map(v => (
                  <div key={v.label} style={{ padding:'10px', background:'var(--bg)', borderRadius:'var(--r-md)', textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3 }}>{v.label}</div>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{v.value}</div>
                  </div>
                ))}
              </div>

              {patientHistory.chronic_conditions?.length > 0 && (
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:8 }}>🏥 Chronic conditions</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {(Array.isArray(patientHistory.chronic_conditions) ? patientHistory.chronic_conditions : JSON.parse(patientHistory.chronic_conditions || '[]')).map((c: string) => (
                      <div key={c} style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:'#FEF2F2', color:'#991B1B', fontSize:12, border:'1px solid #FECACA' }}>{c}</div>
                    ))}
                  </div>
                </div>
              )}

              {patientHistory.allergies?.length > 0 && (
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:8 }}>⚠️ Allergies</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {(Array.isArray(patientHistory.allergies) ? patientHistory.allergies : JSON.parse(patientHistory.allergies || '[]')).map((a: string) => (
                      <div key={a} style={{ padding:'3px 10px', borderRadius:'var(--r-full)', background:'#FFFBEB', color:'#92400E', fontSize:12, border:'1px solid #FDE68A' }}>{a}</div>
                    ))}
                  </div>
                </div>
              )}

              {patientHistory.current_medications && (
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>💊 Current medications</div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', background:'var(--bg)', padding:'10px 12px', borderRadius:'var(--r-md)' }}>{patientHistory.current_medications}</div>
                </div>
              )}

              {patientHistory.past_surgeries && (
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>🔪 Past surgeries</div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', background:'var(--bg)', padding:'10px 12px', borderRadius:'var(--r-md)' }}>{patientHistory.past_surgeries}</div>
                </div>
              )}

              {patientHistory.family_history && (
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>👨‍👩‍👧 Family history</div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', background:'var(--bg)', padding:'10px 12px', borderRadius:'var(--r-md)' }}>{patientHistory.family_history}</div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Smoking</div>
                  <div style={{ fontSize:13, fontWeight:600, textTransform:'capitalize' }}>{patientHistory.smoking || '—'}</div>
                </div>
                <div style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Alcohol</div>
                  <div style={{ fontSize:13, fontWeight:600, textTransform:'capitalize' }}>{patientHistory.alcohol || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    {viewingRecords && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16, overflowY:'auto' }}>
        <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:700, width:'100%', boxShadow:'var(--shadow-xl)', margin:'auto', maxHeight:'85vh', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'var(--text-primary)' }}>
              📁 {viewingRecords.patient_name}'s Medical Records
            </h2>
            <button onClick={() => setViewingRecords(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>✕</button>
          </div>

          {/* Category tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {(['diagnostic','pathological'] as const).map(tab => (
              <button key={tab} onClick={() => setRecordsTab(tab)} style={{
                flex:1, padding:'8px', borderRadius:'var(--r-md)', cursor:'pointer',
                border:`1.5px solid ${recordsTab===tab ? (tab==='diagnostic'?'#2563EB':'#7C3AED') : 'var(--border)'}`,
                background: recordsTab===tab ? (tab==='diagnostic'?'#EFF6FF':'#F5F3FF') : '#fff',
                color: recordsTab===tab ? (tab==='diagnostic'?'#2563EB':'#7C3AED') : 'var(--text-secondary)',
                fontSize:13, fontWeight: recordsTab===tab ? 700 : 400,
              }}>
                {tab==='diagnostic' ? '🔬 Diagnostic Reports' : '🧪 Lab Reports'}
              </button>
            ))}
          </div>

          {loadingRecords && <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</div>}

          {!loadingRecords && patientRecords.filter(r => r.category===recordsTab).length === 0 && (
            <div style={{ textAlign:'center', padding:40 }}>
              <div style={{ fontSize:36, marginBottom:10 }}>📂</div>
              <div style={{ fontSize:15, color:'var(--text-muted)' }}>No {recordsTab} reports uploaded yet</div>
            </div>
          )}

          {!loadingRecords && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {patientRecords.filter(r => r.category===recordsTab).map((r: any) => (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20 }}>{r.category==='diagnostic'?'🔬':'🧪'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{r.test_name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                      {r.file_name} {r.report_date ? '• ' + new Date(r.report_date).toLocaleDateString('en-IN') : ''}
                    </div>
                  </div>
                  <button onClick={() => viewRecord(r)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    👁️ View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
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
                        <button onClick={() => viewPatientHistory(item)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', background:'#0369A1', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          📋 History
                        </button>
                        <button onClick={() => viewPatientRecords(item)} style={{ padding:'6px 14px', borderRadius:'var(--r-md)', background:'#7C3AED', color:'#fff', border:'none', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                          📁 Records
                        </button>
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
