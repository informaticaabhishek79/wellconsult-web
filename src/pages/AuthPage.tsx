import { useState, useEffect } from 'react';
import { useAuth } from '../store';
import { api } from '../api';

type Mode = 'login' | 'patient-register' | 'doctor-register';

const SPECIALTIES = [
  { id: 'allopathy',   label: 'Allopathy',    icon: '⚕️' },
  { id: 'homeopathy',  label: 'Homeopathy',   icon: '💊' },
  { id: 'ayurveda',    label: 'Ayurveda',     icon: '🌿' },
  { id: 'yoga',        label: 'Yoga Therapy', icon: '🧘' },
  { id: 'naturopathy', label: 'Naturopathy',  icon: '🌱' },
  { id: 'unani',       label: 'Unani',        icon: '⚗️' },
];

function Field({ label, type='text', placeholder, value, onChange, required }: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5 }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)',
          border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          fontSize: 14, color: 'var(--text-primary)', outline: 'none',
          transition: 'border-color 0.15s', background: '#fff', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', padding: '12px', borderRadius: 'var(--r-md)',
      background: loading ? 'var(--primary-mid)' : 'var(--primary)',
      color: '#fff', border: 'none', fontSize: 15, fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
      letterSpacing: '0.01em',
    }}>
      {loading ? 'Please wait...' : label}
    </button>
  );
}

export default function AuthPage() {
  const { login, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', password:'', confirm:'' });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  useEffect(() => { clearError(); setRegError(''); setRegSuccess(''); }, [mode]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form.email.trim().toLowerCase(), form.password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setRegError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setRegError('Password must be at least 8 characters.'); return; }
    setRegLoading(true); setRegError('');
    try {
      await api.post('/auth/register', {
        full_name: form.full_name.trim(),
        email:     form.email.trim().toLowerCase(),
        phone:     form.phone.trim() || undefined,
        password:  form.password,
        role:      mode === 'patient-register' ? 'patient' : 'doctor',
      });
      setRegSuccess('Account created! You can now sign in.');
      setTimeout(() => setMode('login'), 2000);
    } catch (err: any) {
      setRegError(err.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally { setRegLoading(false); }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:'var(--font-body)' }}>

      {/* LEFT — Brand */}
      <div style={{
        flex:'0 0 50%',
        background:'linear-gradient(145deg, #054D43 0%, #0A7B6C 50%, #0E9E8A 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'60px 48px', position:'relative', overflow:'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
          {[300,450,600,750].map((size,i) => (
            <div key={i} style={{
              position:'absolute', borderRadius:'50%',
              border:'1px solid rgba(255,255,255,0.07)',
              width:size, height:size,
              top:'50%', left:'50%',
              transform:'translate(-50%,-50%)',
            }}/>
          ))}
        </div>

        <div style={{ position:'relative', zIndex:1, textAlign:'center', width:'100%', maxWidth:440 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:24 }}>
            <div style={{
              width:54, height:54, borderRadius:14,
              background:'rgba(255,255,255,0.13)', backdropFilter:'blur(12px)',
              border:'1px solid rgba(255,255,255,0.22)',
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative', flexShrink:0,
            }}>
              <div style={{ position:'absolute', width:22, height:5, background:'#fff', borderRadius:2 }}/>
              <div style={{ position:'absolute', width:5, height:22, background:'#fff', borderRadius:2 }}/>
              <div style={{ position:'absolute', width:7, height:7, borderRadius:'50%', background:'#F59E0B', bottom:9, right:9 }}/>
            </div>
            <div style={{ textAlign:'left' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700, color:'#fff', lineHeight:1 }}>WellConsult</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:3, letterSpacing:'0.1em' }}>HOLISTIC HEALTHCARE</div>
            </div>
          </div>

          <p style={{ fontSize:17, color:'rgba(255,255,255,0.82)', lineHeight:1.75, marginBottom:40 }}>
            Connect with verified practitioners across all major medical systems. Quality care, anywhere in the world.
          </p>

          {/* Stats */}
          <div style={{ display:'flex', gap:0, marginBottom:40, border:'1px solid rgba(255,255,255,0.12)', borderRadius:'var(--r-lg)', overflow:'hidden' }}>
            {[['500+','Doctors'],['50K+','Patients'],['6','Systems'],['4.9★','Rating']].map(([val,label],i) => (
              <div key={label} style={{ flex:1, padding:'16px 8px', textAlign:'center', borderRight: i<3 ? '1px solid rgba(255,255,255,0.12)' : 'none', background:'rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize:20, fontWeight:800, color:'#fff', fontFamily:'var(--font-display)' }}>{val}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.55)', marginTop:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Specialty pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:40 }}>
            {SPECIALTIES.map(s => (
              <div key={s.id} style={{
                padding:'5px 12px', borderRadius:'var(--r-full)',
                background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)',
                fontSize:12, color:'rgba(255,255,255,0.82)', display:'flex', alignItems:'center', gap:5,
              }}>
                {s.icon} {s.label}
              </div>
            ))}
          </div>

          {/* Trust */}
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            {['🔒 HIPAA Compliant','✅ Verified Practitioners','🌍 24/7 Access'].map(b => (
              <div key={b} style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{b}</div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Forms */}
      <div style={{
        flex:'0 0 50%', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding:'48px 64px', background:'#fff', overflowY:'auto',
      }}>
        <div style={{ width:'100%', maxWidth:400 }}>

          {/* Mode selector */}
          <div style={{ display:'flex', gap:3, marginBottom:28, background:'var(--bg)', borderRadius:'var(--r-lg)', padding:4 }}>
            {([['login','Sign in'],['patient-register','Patient'],['doctor-register','Doctor']] as const).map(([key,label]) => (
              <button key={key} onClick={() => setMode(key)} style={{
                flex:1, padding:'8px 4px', borderRadius:'var(--r-md)', border:'none',
                background: mode===key ? '#fff' : 'transparent',
                boxShadow: mode===key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                fontSize:13, fontWeight: mode===key ? 600 : 500,
                color: mode===key ? 'var(--primary)' : 'var(--text-secondary)',
                cursor:'pointer', transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom:24 }}>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700, color:'var(--text-primary)', marginBottom:5 }}>
              {mode==='login' ? 'Welcome back' : mode==='patient-register' ? 'Create your account' : 'Join as a practitioner'}
            </h1>
            <p style={{ fontSize:14, color:'var(--text-secondary)' }}>
              {mode==='login' ? 'Sign in to your WellConsult account' : mode==='patient-register' ? 'Access holistic healthcare from anywhere' : 'Grow your practice globally'}
            </p>
          </div>

          {/* OAuth */}
          <div style={{ display:'flex', gap:8, marginBottom:18 }}>
            <button onClick={() => alert('Google OAuth — coming soon')} style={{
              flex:1, padding:'10px', borderRadius:'var(--r-md)',
              border:'1.5px solid var(--border)', background:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontSize:13, fontWeight:500, color:'var(--text-primary)', cursor:'pointer',
              boxShadow:'var(--shadow-sm)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button onClick={() => alert('Facebook OAuth — coming soon')} style={{
              flex:1, padding:'10px', borderRadius:'var(--r-md)',
              border:'none', background:'#1877F2',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:500, whiteSpace:'nowrap' }}>OR CONTINUE WITH EMAIL</span>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/>
          </div>

          {/* Alerts */}
          {regSuccess && (
            <div style={{ padding:'11px 14px', borderRadius:'var(--r-md)', background:'#ECFDF5', border:'1px solid #A7F3D0', color:'#065F46', fontSize:13, marginBottom:14 }}>
              ✓ {regSuccess}
            </div>
          )}
          {(error || regError) && (
            <div style={{ padding:'11px 14px', borderRadius:'var(--r-md)', background:'var(--error-light)', border:'1px solid #FECACA', color:'var(--error)', fontSize:13, marginBottom:14 }}>
              ⚠ {error || regError}
            </div>
          )}

          {/* Forms */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <Field label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={v => set('email',v)} required />
              <Field label="Password" type="password" placeholder="Enter your password" value={form.password} onChange={v => set('password',v)} required />
              <div style={{ textAlign:'right', marginTop:-8, marginBottom:18 }}>
                <button type="button" style={{ background:'none', border:'none', fontSize:13, color:'var(--primary)', fontWeight:500, cursor:'pointer' }}>Forgot password?</button>
              </div>
              <SubmitBtn loading={loading} label="Sign in to WellConsult" />
            </form>
          )}

          {mode === 'patient-register' && (
            <form onSubmit={handleRegister}>
              <Field label="Full name" placeholder="John Smith" value={form.full_name} onChange={v => set('full_name',v)} required />
              <Field label="Email address" type="email" placeholder="john@example.com" value={form.email} onChange={v => set('email',v)} required />
              <Field label="Phone (optional)" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={v => set('phone',v)} />
              <Field label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={v => set('password',v)} required />
              <Field label="Confirm password" type="password" placeholder="Re-enter password" value={form.confirm} onChange={v => set('confirm',v)} required />
              <SubmitBtn loading={regLoading} label="Create account" />
              <p style={{ fontSize:11, color:'var(--text-muted)', textAlign:'center', marginTop:10, lineHeight:1.6 }}>
                By continuing you agree to our <span style={{ color:'var(--primary)', cursor:'pointer' }}>Terms</span> and <span style={{ color:'var(--primary)', cursor:'pointer' }}>Privacy Policy</span>
              </p>
            </form>
          )}

          {mode === 'doctor-register' && (
            <form onSubmit={handleRegister}>
              <div style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'var(--primary-light)', border:'1px solid #A7D9D3', marginBottom:14, fontSize:13, color:'var(--primary-dark)', lineHeight:1.5 }}>
                🩺 Supports Allopathy · Ayurveda · Homeopathy · Yoga · Naturopathy · Unani
              </div>
              <Field label="Full name with title" placeholder="Dr. Sarah Johnson" value={form.full_name} onChange={v => set('full_name',v)} required />
              <Field label="Professional email" type="email" placeholder="dr.sarah@clinic.com" value={form.email} onChange={v => set('email',v)} required />
              <Field label="Phone (optional)" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={v => set('phone',v)} />
              <Field label="Password" type="password" placeholder="Minimum 8 characters" value={form.password} onChange={v => set('password',v)} required />
              <Field label="Confirm password" type="password" placeholder="Re-enter password" value={form.confirm} onChange={v => set('confirm',v)} required />
              <SubmitBtn loading={regLoading} label="Continue to practitioner onboarding" />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
