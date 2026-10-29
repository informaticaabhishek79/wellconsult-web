import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

const MEDICAL_SYSTEMS = [
  { id:'allopathy',   label:'Allopathy',    icon:'⚕️', desc:'Modern medicine, MBBS/MD' },
  { id:'homeopathy',  label:'Homeopathy',   icon:'💊', desc:'BHMS, DHM' },
  { id:'ayurveda',    label:'Ayurveda',     icon:'🌿', desc:'BAMS, MD Ayurveda' },
  { id:'yoga',        label:'Yoga Therapy', icon:'🧘', desc:'Yoga & naturopathy' },
  { id:'naturopathy', label:'Naturopathy',  icon:'🌱', desc:'BNYS, DNY' },
  { id:'unani',       label:'Unani',        icon:'⚗️', desc:'BUMS, MD Unani' },
];

const CONSULT_TYPES = [
  { id:'video',  label:'Video call', icon:'📹' },
  { id:'phone',  label:'Phone call', icon:'📞' },
  { id:'clinic', label:'In-clinic',  icon:'🏥' },
];

const LANGUAGES = ['English','Hindi','Bengali','Telugu','Tamil','Marathi','Gujarati','Kannada','Malayalam','Punjabi','Urdu'];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];

const DAY_MAP: Record<string, number> = { Monday:1, Tuesday:2, Wednesday:3, Thursday:4, Friday:5, Saturday:6, Sunday:0 };

interface Step {
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { title: 'Medical system',     subtitle: 'Select your area of practice' },
  { title: 'Credentials',        subtitle: 'Your qualifications and registration' },
  { title: 'Practice details',   subtitle: 'Location and specialization' },
  { title: 'Consultation types', subtitle: 'How do you consult?' },
  { title: 'Your fees',          subtitle: 'Set your consultation fees' },
  { title: 'Availability',       subtitle: 'Set your working hours' },
];

export default function DoctorOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    medical_system:    '',
    degree:            '',
    reg_number:        '',
    reg_body:          '',
    experience_years:  '',
    specialization:    '',
    city:              '',
    bio:               '',
    languages:         [] as string[],
    consult_types:     [] as string[],
    fees:              { video: '', phone: '', clinic: '' },
    availability:      {} as Record<string, { from: string; to: string; enabled: boolean }>,
  });

  // Init availability
  const initAvail = () => {
    const avail: Record<string, { from: string; to: string; enabled: boolean }> = {};
    DAYS.forEach(d => { avail[d] = { from: '09:00', to: '17:00', enabled: ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(d) }; });
    return avail;
  };

  const [availability, setAvailability] = useState(initAvail);

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const toggleLanguage = (lang: string) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang],
    }));
  };

  const toggleConsultType = (type: string) => {
    setForm(f => ({
      ...f,
      consult_types: f.consult_types.includes(type) ? f.consult_types.filter(t => t !== type) : [...f.consult_types, type],
    }));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      // Update doctor profile
      await api.put('/doctors/me/profile', {
        medical_system:   form.medical_system,
        degree:           form.degree,
        reg_number:       form.reg_number,
        reg_body:         form.reg_body,
        experience_years: parseInt(form.experience_years) || 0,
        specialization:   form.specialization,
        city:             form.city,
        bio:              form.bio,
        languages:        form.languages,
        consult_types:    form.consult_types,
      });

      // Save fees
      for (const type of form.consult_types) {
        const fee = (form.fees as any)[type];
        if (fee) {
          await api.post('/doctors/me/fees', {
            consult_type: type,
            fee_amount:   Math.round(parseFloat(fee) * 100),
            currency:     'INR',
          });
        }
      }

      // Save availability
      for (const [day, slot] of Object.entries(availability)) {
        if (slot.enabled) {
          // Generate 30-min slots between from and to
          const fromIdx = SLOTS.indexOf(slot.from);
          const toIdx   = SLOTS.indexOf(slot.to);
          const dayNum  = DAY_MAP[day];
          for (let i = fromIdx; i < toIdx; i++) {
            await api.post('/doctors/me/availability', {
              day_of_week: dayNum,
              slot_start:  SLOTS[i],
              slot_end:    SLOTS[i+1] || slot.to,
            }).catch(() => {}); // ignore duplicate conflicts
          }
        }
      }

      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.medical_system;
    if (step === 1) return !!(form.degree && form.reg_number && form.reg_body && form.experience_years);
    if (step === 2) return !!(form.city && form.languages.length > 0);
    if (step === 3) return form.consult_types.length > 0;
    if (step === 4) return form.consult_types.every(t => !!(form.fees as any)[t]);
    return true;
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', fontFamily:'var(--font-body)' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'16px 24px', display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <div style={{ position:'absolute', width:14, height:3, background:'#fff', borderRadius:2 }}/>
            <div style={{ position:'absolute', width:3, height:14, background:'#fff', borderRadius:2 }}/>
          </div>
          <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Deemona Doctors</span>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>Step {step+1} of {STEPS.length}</span>
          <button type="button" onClick={() => { if (window.confirm('Sign out? Your progress on this page will not be saved.')) logout(); }}
            style={{ padding:'7px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', background:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', color:'var(--text-secondary)' }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:3, background:'var(--border)' }}>
        <div style={{ height:'100%', background:'var(--primary)', width:`${((step+1)/STEPS.length)*100}%`, transition:'width 0.3s ease' }}/>
      </div>

      {/* Content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 24px' }}>
        <div style={{ width:'100%', maxWidth:600 }}>

          {/* Step header */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i <= step ? 'var(--primary)' : 'var(--border)' }}/>
              ))}
            </div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>
              {STEPS[step].title}
            </h1>
            <p style={{ fontSize:15, color:'var(--text-secondary)' }}>{STEPS[step].subtitle}</p>
          </div>

          {/* Step 0 — Medical system */}
          {step === 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {MEDICAL_SYSTEMS.map(sys => (
                <div key={sys.id} onClick={() => setField('medical_system', sys.id)} style={{
                  padding:'20px', borderRadius:'var(--r-lg)', border:`2px solid ${form.medical_system===sys.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.medical_system===sys.id ? 'var(--primary-light)' : '#fff',
                  cursor:'pointer', transition:'all 0.15s',
                }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{sys.icon}</div>
                  <div style={{ fontSize:15, fontWeight:700, color: form.medical_system===sys.id ? 'var(--primary)' : 'var(--text-primary)', marginBottom:3 }}>{sys.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{sys.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Step 1 — Credentials */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { key:'degree',           label:'Degree / Qualification', ph:'e.g. MBBS, MD or BAMS' },
                { key:'reg_number',       label:'Registration number',    ph:'e.g. NMC-MH-12345' },
                { key:'reg_body',         label:'Registration body',      ph:'e.g. NMC, State Medical Council' },
                { key:'experience_years', label:'Years of experience',    ph:'e.g. 10', type:'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>{f.label}</label>
                  <input
                    type={f.type || 'text'} placeholder={f.ph}
                    value={(form as any)[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', boxSizing:'border-box' as any }}
                    onFocus={e => e.target.style.borderColor='var(--primary)'}
                    onBlur={e => e.target.style.borderColor='var(--border)'}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 2 — Practice details */}
          {step === 2 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { key:'city',           label:'City',           ph:'Mumbai, Delhi, Bangalore...' },
                { key:'specialization', label:'Specialization', ph:'e.g. General Physician, Panchakarma...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>{f.label}</label>
                  <input
                    placeholder={f.ph} value={(form as any)[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', boxSizing:'border-box' as any }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>Bio</label>
                <textarea placeholder="Describe your practice, expertise and approach to patient care..."
                  value={form.bio} onChange={e => setField('bio', e.target.value)} rows={4}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', resize:'vertical' as any, fontFamily:'var(--font-body)', boxSizing:'border-box' as any }}
                />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:8 }}>Languages spoken</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {LANGUAGES.map(lang => (
                    <div key={lang} onClick={() => toggleLanguage(lang)} style={{
                      padding:'6px 14px', borderRadius:'var(--r-full)', cursor:'pointer',
                      border:`1.5px solid ${form.languages.includes(lang) ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.languages.includes(lang) ? 'var(--primary)' : '#fff',
                      color: form.languages.includes(lang) ? '#fff' : 'var(--text-secondary)',
                      fontSize:13, fontWeight: form.languages.includes(lang) ? 600 : 400,
                    }}>{lang}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Consultation types */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {CONSULT_TYPES.map(ct => (
                <div key={ct.id} onClick={() => toggleConsultType(ct.id)} style={{
                  padding:'20px', borderRadius:'var(--r-lg)', cursor:'pointer',
                  border:`2px solid ${form.consult_types.includes(ct.id) ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.consult_types.includes(ct.id) ? 'var(--primary-light)' : '#fff',
                  display:'flex', alignItems:'center', gap:16,
                }}>
                  <span style={{ fontSize:28 }}>{ct.icon}</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:600, color: form.consult_types.includes(ct.id) ? 'var(--primary)' : 'var(--text-primary)' }}>{ct.label}</div>
                  </div>
                  <div style={{ marginLeft:'auto', width:22, height:22, borderRadius:'50%', border:`2px solid ${form.consult_types.includes(ct.id) ? 'var(--primary)' : 'var(--border)'}`, background: form.consult_types.includes(ct.id) ? 'var(--primary)' : '#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {form.consult_types.includes(ct.id) && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4 — Fees */}
          {step === 4 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {form.consult_types.map(type => {
                const ct = CONSULT_TYPES.find(c => c.id === type);
                return (
                  <div key={type} style={{ padding:'20px', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', background:'#fff' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:24 }}>{ct?.icon}</span>
                      <span style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', textTransform:'capitalize' }}>{ct?.label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:20, color:'var(--text-secondary)' }}>₹</span>
                      <input
                        type="number" placeholder="Enter fee amount"
                        value={(form.fees as any)[type] || ''}
                        onChange={e => setForm(f => ({ ...f, fees: { ...f.fees, [type]: e.target.value } }))}
                        style={{ flex:1, padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:16, fontWeight:600, outline:'none' }}
                      />
                      <span style={{ fontSize:13, color:'var(--text-muted)' }}>per session</span>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding:'12px 16px', borderRadius:'var(--r-md)', background:'var(--primary-light)', fontSize:13, color:'var(--primary-dark)' }}>
                💡 Fees are in Indian Rupees (₹). You can update them anytime from your profile.
              </div>
            </div>
          )}

          {/* Step 5 — Availability */}
          {step === 5 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {DAYS.map(day => {
                const slot = availability[day];
                return (
                  <div key={day} style={{ padding:'14px 16px', borderRadius:'var(--r-lg)', border:`1.5px solid ${slot.enabled ? 'var(--primary)' : 'var(--border)'}`, background: slot.enabled ? 'var(--primary-light)' : '#fff' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div onClick={() => setAvailability(a => ({ ...a, [day]: { ...a[day], enabled: !a[day].enabled } }))} style={{
                        width:20, height:20, borderRadius:4, border:`2px solid ${slot.enabled ? 'var(--primary)' : 'var(--border)'}`,
                        background: slot.enabled ? 'var(--primary)' : '#fff', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {slot.enabled && <span style={{ color:'#fff', fontSize:11 }}>✓</span>}
                      </div>
                      <span style={{ fontSize:14, fontWeight:600, color: slot.enabled ? 'var(--primary)' : 'var(--text-secondary)', flex:1 }}>{day}</span>
                      {slot.enabled && (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <select value={slot.from} onChange={e => setAvailability(a => ({ ...a, [day]: { ...a[day], from: e.target.value } }))} style={{ padding:'4px 8px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-primary)', outline:'none' }}>
                            {SLOTS.slice(0,-1).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span style={{ fontSize:13, color:'var(--text-muted)' }}>to</span>
                          <select value={slot.to} onChange={e => setAvailability(a => ({ ...a, [day]: { ...a[day], to: e.target.value } }))} style={{ padding:'4px 8px', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-primary)', outline:'none' }}>
                            {SLOTS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div style={{ marginTop:16, padding:'12px 16px', borderRadius:'var(--r-md)', background:'var(--error-light)', color:'var(--error)', fontSize:13, border:'1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {/* Navigation */}
          <div style={{ display:'flex', gap:10, marginTop:28 }}>
            {step === 0 && (
              <button type="button" onClick={() => { if (window.confirm('Sign out? Your progress on this page will not be saved.')) logout(); }} style={{ padding:'12px 24px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', background:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', color:'var(--text-secondary)' }}>
                Cancel &amp; sign out
              </button>
            )}
            {step > 0 && (
              <button onClick={() => setStep(s => s-1)} style={{ padding:'12px 24px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', background:'#fff', fontSize:14, fontWeight:500, cursor:'pointer', color:'var(--text-secondary)' }}>
                ← Back
              </button>
            )}
            {step < STEPS.length-1 ? (
              <button onClick={() => setStep(s => s+1)} disabled={!canNext()} style={{
                flex:1, padding:'12px', borderRadius:'var(--r-md)', border:'none',
                background: canNext() ? 'var(--primary)' : 'var(--border)',
                color: canNext() ? '#fff' : 'var(--text-muted)',
                fontSize:15, fontWeight:600, cursor: canNext() ? 'pointer' : 'not-allowed',
              }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving} style={{
                flex:1, padding:'12px', borderRadius:'var(--r-md)', border:'none',
                background: saving ? 'var(--border)' : 'var(--primary)',
                color: saving ? 'var(--text-muted)' : '#fff',
                fontSize:15, fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Saving...' : 'Complete setup →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
