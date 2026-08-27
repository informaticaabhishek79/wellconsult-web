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
    </div>
    </>
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
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Check URL for reset token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    const userId = params.get('user_id');
    if (token && userId) {
      setResetToken(token);
      setResetUserId(userId);
      setShowReset(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { alert('Please enter your email address.'); return; }
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotSent(true);
    } catch {
      setForgotSent(true); // Always show success to prevent enumeration
    } finally { setForgotLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { alert('Please fill in all fields.'); return; }
    if (newPassword !== confirmPassword) { alert('Passwords do not match.'); return; }
    if (newPassword.length < 8) { alert('Password must be at least 8 characters.'); return; }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', { user_id: resetUserId, token: resetToken, new_password: newPassword });
      setResetSuccess(true);
      setTimeout(() => { setShowReset(false); setResetSuccess(false); setNewPassword(''); setConfirmPassword(''); }, 3000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Reset failed. Please request a new link.');
    } finally { setResetLoading(false); }
  };

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

  // Reset password screen
  if (showReset) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', fontFamily:'var(--font-body)', padding:24 }}>
        <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:36, maxWidth:420, width:'100%', boxShadow:'var(--shadow-lg)' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
              {resetSuccess ? 'Password reset!' : 'Set new password'}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-secondary)' }}>
              {resetSuccess ? 'You can now sign in with your new password.' : 'Enter your new password below.'}
            </p>
          </div>
          {!resetSuccess && (
            <>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>New password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters"
                  style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>Confirm password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat your new password"
                  style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <button onClick={handleResetPassword} disabled={resetLoading} style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background: resetLoading ? 'var(--border)' : 'var(--primary)', color: resetLoading ? 'var(--text-muted)' : '#fff', fontSize:15, fontWeight:700, cursor: resetLoading ? 'not-allowed' : 'pointer' }}>
                {resetLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </>
          )}
          {resetSuccess && (
            <button onClick={() => setShowReset(false)} style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              Sign in now →
            </button>
          )}
        </div>
      </div>
    );
  }

  // Forgot password modal overlay
  const ForgotModal = showForgot ? (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:32, maxWidth:400, width:'100%', boxShadow:'var(--shadow-xl)' }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Forgot password?</h2>
        {!forgotSent ? (
          <>
            <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:20 }}>Enter your email and we'll send you a reset link.</p>
            <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="your@email.com"
              onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
              style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', boxSizing:'border-box' as any, marginBottom:14 }}/>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowForgot(false); setForgotEmail(''); }} style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleForgotPassword} disabled={forgotLoading} style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background: forgotLoading ? 'var(--border)' : 'var(--primary)', color: forgotLoading ? 'var(--text-muted)' : '#fff', fontSize:14, fontWeight:600, cursor: forgotLoading ? 'not-allowed' : 'pointer' }}>
                {forgotLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign:'center', padding:'20px 0' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
              <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:20 }}>
                If <strong>{forgotEmail}</strong> has an account, a reset link has been sent. Check your inbox and spam folder.
              </p>
            </div>
            <button onClick={() => { setShowForgot(false); setForgotEmail(''); setForgotSent(false); }} style={{ width:'100%', padding:'11px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
              Done
            </button>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {ForgotModal}
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
          <div style={{ display:'flex', gap:6, marginBottom:28 }}>
            {([
              ['login','Sign in','#0A7B6C','#E6F4F1'],
              ['patient-register','Patient','#2563EB','#EFF6FF'],
              ['doctor-register','Doctor','#7C3AED','#F5F3FF'],
            ] as const).map(([key,label,activeColor,activeBg]) => (
              <button key={key} onClick={() => setMode(key)} style={{
                flex:1, padding:'10px 4px', borderRadius:'var(--r-md)', cursor:'pointer', transition:'all 0.2s',
                border: `2px solid ${mode===key ? activeColor : 'var(--border)'}`,
                background: mode===key ? activeBg : '#fff',
                fontSize:13, fontWeight: mode===key ? 700 : 500,
                color: mode===key ? activeColor : 'var(--text-secondary)',
                boxShadow: mode===key ? `0 2px 8px ${activeColor}30` : 'none',
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
