import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const COMMON_CONDITIONS = ['Diabetes','Hypertension','Asthma','Heart disease','Thyroid','Arthritis','Kidney disease','Liver disease','Cancer','Depression'];
const COMMON_ALLERGIES = ['Penicillin','Aspirin','Ibuprofen','Sulfa drugs','Codeine','Peanuts','Latex','Shellfish','Dust mites'];

export default function MedicalHistoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ['medical-history'],
    queryFn: async () => {
      const { data } = await api.get('/patients/me/history');
      return data.data;
    },
    enabled: user?.role === 'patient',
  });

  const [form, setForm] = useState<any>({});

  const startEdit = () => {
    setForm({
      blood_group: history?.blood_group || '',
      height_cm: history?.height_cm || '',
      weight_kg: history?.weight_kg || '',
      chronic_conditions: history?.chronic_conditions || [],
      allergies: history?.allergies || [],
      current_medications: history?.current_medications || '',
      past_surgeries: history?.past_surgeries || '',
      family_history: history?.family_history || '',
      smoking: history?.smoking || 'never',
      alcohol: history?.alcohol || 'never',
      emergency_contact_name: history?.emergency_contact_name || '',
      emergency_contact_phone: history?.emergency_contact_phone || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/patients/me/history', form);
      qc.invalidateQueries({ queryKey: ['medical-history'] });
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const toggleItem = (field: string, item: string) => {
    setForm((f: any) => ({
      ...f,
      [field]: f[field]?.includes(item)
        ? f[field].filter((i: string) => i !== item)
        : [...(f[field] || []), item],
    }));
  };

  const bmi = form.height_cm && form.weight_kg
    ? (form.weight_kg / Math.pow(form.height_cm / 100, 2)).toFixed(1)
    : history?.height_cm && history?.weight_kg
    ? (history.weight_kg / Math.pow(history.height_cm / 100, 2)).toFixed(1)
    : null;

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5 ? { label: 'Underweight', color: '#3B82F6' }
      : parseFloat(bmi) < 25 ? { label: 'Normal', color: '#16A34A' }
      : parseFloat(bmi) < 30 ? { label: 'Overweight', color: '#F59E0B' }
      : { label: 'Obese', color: '#EF4444' }
    : null;

  if (isLoading) return <div style={{ padding:60, textAlign:'center', color:'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 24px', fontFamily:'var(--font-body)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Medical History</h1>
          <p style={{ fontSize:14, color:'var(--text-secondary)' }}>Your health profile — shared with doctors during consultation</p>
        </div>
        {!editing && (
          <button onClick={startEdit} style={{ padding:'9px 18px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            ✏️ {history ? 'Edit' : 'Add'} history
          </button>
        )}
      </div>

      {!editing && !history && (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏥</div>
          <div style={{ fontSize:18, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>No medical history yet</div>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:20 }}>Add your health information to help doctors understand your condition better</div>
          <button onClick={startEdit} style={{ padding:'10px 24px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            + Add medical history
          </button>
        </div>
      )}

      {!editing && history && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Vitals */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>🩺 Vitals</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
              {[
                { label:'Blood group', value: history.blood_group || '—' },
                { label:'Height', value: history.height_cm ? `${history.height_cm} cm` : '—' },
                { label:'Weight', value: history.weight_kg ? `${history.weight_kg} kg` : '—' },
                { label:'BMI', value: bmi ? `${bmi} (${bmiCategory?.label})` : '—', color: bmiCategory?.color },
              ].map(v => (
                <div key={v.label} style={{ padding:'12px 14px', background:'var(--bg)', borderRadius:'var(--r-md)', textAlign:'center' }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{v.label}</div>
                  <div style={{ fontSize:16, fontWeight:700, color: v.color || 'var(--text-primary)' }}>{v.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          {history.chronic_conditions?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>🏥 Chronic conditions</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {history.chronic_conditions.map((c: string) => (
                  <div key={c} style={{ padding:'4px 12px', borderRadius:'var(--r-full)', background:'#FEF2F2', color:'#991B1B', fontSize:13, fontWeight:500, border:'1px solid #FECACA' }}>{c}</div>
                ))}
              </div>
            </div>
          )}

          {/* Allergies */}
          {history.allergies?.length > 0 && (
            <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>⚠️ Allergies</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {history.allergies.map((a: string) => (
                  <div key={a} style={{ padding:'4px 12px', borderRadius:'var(--r-full)', background:'#FFFBEB', color:'#92400E', fontSize:13, fontWeight:500, border:'1px solid #FDE68A' }}>{a}</div>
                ))}
              </div>
            </div>
          )}

          {/* Medications & History */}
          {(history.current_medications || history.past_surgeries || history.family_history) && (
            <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>💊 Medical details</h2>
              {history.current_medications && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}>Current medications</div>
                  <div style={{ fontSize:14, color:'var(--text-primary)' }}>{history.current_medications}</div>
                </div>
              )}
              {history.past_surgeries && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}>Past surgeries</div>
                  <div style={{ fontSize:14, color:'var(--text-primary)' }}>{history.past_surgeries}</div>
                </div>
              )}
              {history.family_history && (
                <div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}>Family history</div>
                  <div style={{ fontSize:14, color:'var(--text-primary)' }}>{history.family_history}</div>
                </div>
              )}
            </div>
          )}

          {/* Lifestyle */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>🌿 Lifestyle</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ padding:'10px 14px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}>Smoking</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', textTransform:'capitalize' }}>{history.smoking || 'Not specified'}</div>
              </div>
              <div style={{ padding:'10px 14px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:3 }}>Alcohol</div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', textTransform:'capitalize' }}>{history.alcohol || 'Not specified'}</div>
              </div>
            </div>
          </div>

          {/* Emergency contact */}
          {(history.emergency_contact_name || history.emergency_contact_phone) && (
            <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
              <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>🆘 Emergency contact</h2>
              <div style={{ fontSize:14, color:'var(--text-primary)' }}>
                {history.emergency_contact_name} — {history.emergency_contact_phone}
              </div>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Vitals */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>🩺 Vitals</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Blood group</label>
                <select value={form.blood_group} onChange={e => setForm((f: any) => ({...f, blood_group: e.target.value}))} style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Height (cm)</label>
                <input type="number" value={form.height_cm} onChange={e => setForm((f: any) => ({...f, height_cm: e.target.value}))} placeholder="170" style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Weight (kg)</label>
                <input type="number" value={form.weight_kg} onChange={e => setForm((f: any) => ({...f, weight_kg: e.target.value}))} placeholder="70" style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>🏥 Chronic conditions</h2>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {COMMON_CONDITIONS.map(c => (
                <div key={c} onClick={() => toggleItem('chronic_conditions', c)} style={{ padding:'6px 14px', borderRadius:'var(--r-full)', cursor:'pointer', border:`1.5px solid ${form.chronic_conditions?.includes(c) ? '#EF4444' : 'var(--border)'}`, background: form.chronic_conditions?.includes(c) ? '#FEF2F2' : '#fff', color: form.chronic_conditions?.includes(c) ? '#991B1B' : 'var(--text-secondary)', fontSize:13, fontWeight: form.chronic_conditions?.includes(c) ? 600 : 400 }}>{c}</div>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:12 }}>⚠️ Allergies</h2>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {COMMON_ALLERGIES.map(a => (
                <div key={a} onClick={() => toggleItem('allergies', a)} style={{ padding:'6px 14px', borderRadius:'var(--r-full)', cursor:'pointer', border:`1.5px solid ${form.allergies?.includes(a) ? '#F59E0B' : 'var(--border)'}`, background: form.allergies?.includes(a) ? '#FFFBEB' : '#fff', color: form.allergies?.includes(a) ? '#92400E' : 'var(--text-secondary)', fontSize:13, fontWeight: form.allergies?.includes(a) ? 600 : 400 }}>{a}</div>
              ))}
            </div>
          </div>

          {/* Medical details */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>💊 Medical details</h2>
            {[
              { key:'current_medications', label:'Current medications', ph:'List medicines you are currently taking...' },
              { key:'past_surgeries', label:'Past surgeries', ph:'Any surgeries or procedures in the past...' },
              { key:'family_history', label:'Family medical history', ph:'Conditions that run in your family...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{f.label}</label>
                <textarea value={form[f.key]} onChange={e => setForm((fm: any) => ({...fm, [f.key]: e.target.value}))} placeholder={f.ph} rows={2} style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', resize:'vertical' as any, fontFamily:'var(--font-body)', boxSizing:'border-box' as any }}/>
              </div>
            ))}
          </div>

          {/* Lifestyle */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>🌿 Lifestyle</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {[
                { key:'smoking', label:'Smoking', options:['never','occasional','regular','ex-smoker'] },
                { key:'alcohol', label:'Alcohol', options:['never','occasional','regular'] },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>{f.label}</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {f.options.map(o => (
                      <div key={o} onClick={() => setForm((fm: any) => ({...fm, [f.key]: o}))} style={{ padding:'5px 12px', borderRadius:'var(--r-full)', cursor:'pointer', border:`1.5px solid ${form[f.key]===o ? 'var(--primary)' : 'var(--border)'}`, background: form[f.key]===o ? 'var(--primary)' : '#fff', color: form[f.key]===o ? '#fff' : 'var(--text-secondary)', fontSize:12, fontWeight: form[f.key]===o ? 600 : 400, textTransform:'capitalize' }}>{o}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency contact */}
          <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'18px 20px' }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:14 }}>🆘 Emergency contact</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Name</label>
                <input value={form.emergency_contact_name} onChange={e => setForm((f: any) => ({...f, emergency_contact_name: e.target.value}))} placeholder="Contact name" style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Phone</label>
                <input value={form.emergency_contact_phone} onChange={e => setForm((f: any) => ({...f, emergency_contact_phone: e.target.value}))} placeholder="+91 98765 43210" style={{ width:'100%', padding:'9px 10px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setEditing(false)} style={{ padding:'11px 20px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:'var(--r-md)', border:'none', background: saving ? 'var(--border)' : 'var(--primary)', color: saving ? 'var(--text-muted)' : '#fff', fontSize:15, fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving...' : '💾 Save medical history'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
