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

function Field({ label, type='text', placeholder, value, onChange }: {
  label: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPw ? 'text' : 'password') : type;

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <input type={inputType} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ width:'100%', padding: isPassword ? '10px 44px 10px 14px' : '10px 14px', borderRadius:'var(--r-md)', border:`1.5px solid ${focused?'var(--primary)':'var(--border)'}`, fontSize:14, color:'var(--text-primary)', outline:'none', transition:'border-color 0.15s', background:'#fff', boxSizing:'border-box' as any }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(s => !s)}
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text-muted)', fontSize:16, display:'flex', alignItems:'center' }}>
            {showPw ? '🙈' : '👁️'}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background: loading?'var(--border)':'var(--primary)', color: loading?'var(--text-muted)':'#fff', fontSize:15, fontWeight:700, cursor: loading?'not-allowed':'pointer', marginTop:4 }}>
      {loading ? 'Please wait...' : label}
    </button>
  );
}

export default function AuthPage() {
  const { login, error: storeError } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient register fields
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pPassword, setPPassword] = useState('');
  const [pConfirm, setPConfirm] = useState('');

  // Doctor register fields
  const [dName, setDName] = useState('');
  const [dEmail, setDEmail] = useState('');
  const [dPhone, setDPhone] = useState('');
  const [dPassword, setDPassword] = useState('');
  const [dConfirm, setDConfirm] = useState('');
  const [dSystem, setDSystem] = useState('allopathy');

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password
  const [showReset, setShowReset] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetUserId, setResetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    console.log('[OAuth] href:', window.location.href);
    const params = new URLSearchParams(window.location.search);

    const oauthError = params.get('oauth_error');

    // OAuth handled in App.tsx

    if (oauthError) {
      setError('Google sign-in failed. Please try again or use email/password.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Handle password reset
    const token = params.get('reset_token');
    const userId = params.get('user_id');
    if (token && userId) {
      setResetToken(token);
      setResetUserId(userId);
      setShowReset(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    await login(email, password);
    setTimeout(() => { const e = useAuth.getState().error; if (e) setError(e); }, 100);
  };

  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pPassword !== pConfirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', { full_name: pName, email: pEmail, phone: pPhone, password: pPassword, role: 'patient' });
      setRegSuccess('Account created! You can now sign in.');
      setMode('login'); setEmail(pEmail);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleDoctorRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dPassword !== dConfirm) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/register', { full_name: dName, email: dEmail, phone: dPhone, password: dPassword, role: 'doctor', medical_system: dSystem });
      setRegSuccess('Doctor account created! You can now sign in.');
      setMode('login'); setEmail(dEmail);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { alert('Please enter your email.'); return; }
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
    } catch {}
    setForgotSent(true);
    setForgotLoading(false);
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) { alert('Please fill in all fields.'); return; }
    if (newPassword !== confirmPassword) { alert('Passwords do not match.'); return; }
    if (newPassword.length < 8) { alert('Password must be at least 8 characters.'); return; }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', { user_id: resetUserId, token: resetToken, new_password: newPassword });
      setResetSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Reset failed. Please request a new link.');
    } finally { setResetLoading(false); }
  };

  const TAB_COLORS: Record<string, { active: string; bg: string }> = {
    'login':           { active:'#0A7B6C', bg:'#E6F4F1' },
    'patient-register':{ active:'#2563EB', bg:'#EFF6FF' },
    'doctor-register': { active:'#7C3AED', bg:'#F5F3FF' },
  };

  // Reset password screen
  if (showReset) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', fontFamily:'var(--font-body)', padding:24 }}>
        <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:36, maxWidth:420, width:'100%', boxShadow:'var(--shadow-lg)' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{resetSuccess ? '✅' : '🔐'}</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>
              {resetSuccess ? 'Password reset!' : 'Set new password'}
            </h2>
            <p style={{ fontSize:14, color:'var(--text-secondary)' }}>
              {resetSuccess ? 'You can now sign in with your new password.' : 'Enter your new password below.'}
            </p>
          </div>
          {!resetSuccess ? (
            <>
              <Field label="New password" type="password" placeholder="Minimum 8 characters" value={newPassword} onChange={setNewPassword} />
              <Field label="Confirm password" type="password" placeholder="Repeat your new password" value={confirmPassword} onChange={setConfirmPassword} />
              <button onClick={handleResetPassword} disabled={resetLoading} style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background: resetLoading?'var(--border)':'var(--primary)', color: resetLoading?'var(--text-muted)':'#fff', fontSize:15, fontWeight:700, cursor: resetLoading?'not-allowed':'pointer' }}>
                {resetLoading ? 'Resetting...' : 'Reset password'}
              </button>
            </>
          ) : (
            <button onClick={() => { setShowReset(false); setResetSuccess(false); setNewPassword(''); setConfirmPassword(''); }} style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              Sign in now →
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Forgot password modal */}
      {showForgot && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:32, maxWidth:400, width:'100%', boxShadow:'var(--shadow-xl)' }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Forgot password?</h2>
            {!forgotSent ? (
              <>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:20 }}>Enter your email and we'll send you a reset link.</p>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="your@email.com"
                  onKeyDown={e => e.key==='Enter' && handleForgotPassword()}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', boxSizing:'border-box' as any, marginBottom:14 }}/>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setShowForgot(false); setForgotEmail(''); }} style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
                  <button onClick={handleForgotPassword} disabled={forgotLoading} style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background: forgotLoading?'var(--border)':'var(--primary)', color: forgotLoading?'var(--text-muted)':'#fff', fontSize:14, fontWeight:600, cursor: forgotLoading?'not-allowed':'pointer' }}>
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
                <button onClick={() => { setShowForgot(false); setForgotEmail(''); setForgotSent(false); }} style={{ width:'100%', padding:'11px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display:'flex', minHeight:'100vh', fontFamily:'var(--font-body)' }}>
        {/* Left panel */}
        <div style={{ flex:'0 0 55%', background:'linear-gradient(135deg,#0A5C52,#0A7B6C,#0E9E8A)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
          <div style={{ position:'absolute', bottom:-120, left:-60, width:400, height:400, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
              <div style={{ width:52, height:52, background:'rgba(255,255,255,0.15)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'#fff' }}>+</div>
              <div>
                <div style={{ fontSize:24, fontWeight:800, color:'#fff', fontFamily:'var(--font-display)' }}>Deemona Doctors</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', letterSpacing:2, textTransform:'uppercase', marginTop:1 }}>Holistic Healthcare</div>
              </div>
            </div>
            <h1 style={{ fontSize:38, fontWeight:800, color:'#fff', lineHeight:1.25, marginBottom:16, fontFamily:'var(--font-display)' }}>
              Connect with verified practitioners across all major medical systems.
            </h1>
            <p style={{ fontSize:16, color:'rgba(255,255,255,0.75)', lineHeight:1.7, marginBottom:40 }}>
              Quality care, anywhere in the world.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:40 }}>
              {[['500+','Doctors'],['50K+','Patients'],['6','Systems'],['4.9★','Rating']].map(([val,label]) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.12)', borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{val}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:1, marginTop:3 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:32 }}>
              {SPECIALTIES.map(s => (
                <div key={s.id} style={{ padding:'6px 14px', borderRadius:20, background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.9)', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                  <span>{s.icon}</span>{s.label}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:20 }}>
              {['🔒 HIPAA Compliant','✅ Verified Practitioners','🌐 24/7 Access'].map(t => (
                <span key={t} style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px 56px', background:'#fff', overflowY:'auto' }}>
          <div style={{ maxWidth:400, width:'100%', margin:'0 auto' }}>
            {/* Tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:28 }}>
              {([['login','Sign in'],['patient-register','Patient'],['doctor-register','Doctor']] as const).map(([key,label]) => {
                const c = TAB_COLORS[key];
                const active = mode === key;
                return (
                  <button key={key} onClick={() => { setMode(key); setError(''); setRegSuccess(''); }} style={{
                    flex:1, padding:'10px 4px', borderRadius:'var(--r-md)', cursor:'pointer', transition:'all 0.2s',
                    border:`2px solid ${active ? c.active : 'var(--border)'}`,
                    background: active ? c.bg : '#fff',
                    fontSize:13, fontWeight: active ? 700 : 500,
                    color: active ? c.active : 'var(--text-secondary)',
                    boxShadow: active ? `0 2px 8px ${c.active}30` : 'none',
                  }}>{label}</button>
                );
              })}
            </div>

            {error && <div style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B', fontSize:13, marginBottom:16 }}>{error}</div>}
            {regSuccess && <div style={{ padding:'10px 14px', borderRadius:'var(--r-md)', background:'#ECFDF5', border:'1px solid #A7F3D0', color:'#065F46', fontSize:13, marginBottom:16 }}>{regSuccess}</div>}

            {/* Sign in */}
            {mode === 'login' && (
              <>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Welcome back</h2>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:24 }}>Sign in to your Deemona Doctors account</p>
                <form onSubmit={handleLogin}>
                  <Field label="Email address" type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
                  <Field label="Password" type="password" placeholder="Enter your password" value={password} onChange={setPassword} />
                  <div style={{ textAlign:'right', marginBottom:20, marginTop:-8 }}>
                    <span onClick={() => setShowForgot(true)} style={{ fontSize:13, color:'var(--primary)', cursor:'pointer', fontWeight:500 }}>Forgot password?</span>
                  </div>
                  <SubmitBtn loading={loading} label="Sign in to Deemona Doctors" />
                </form>
              </>
            )}

            {/* Patient register */}
            {mode === 'patient-register' && (
              <>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Create patient account</h2>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:24 }}>Access holistic healthcare from anywhere</p>
                <form onSubmit={handlePatientRegister}>
                  <Field label="Full name" placeholder="Your full name" value={pName} onChange={setPName} />
                  <Field label="Email address" type="email" placeholder="you@example.com" value={pEmail} onChange={setPEmail} />
                  <Field label="Phone number" placeholder="+91 98765 43210" value={pPhone} onChange={setPPhone} />
                  <Field label="Password" type="password" placeholder="Minimum 8 characters" value={pPassword} onChange={setPPassword} />
                  <Field label="Confirm password" type="password" placeholder="Repeat your password" value={pConfirm} onChange={setPConfirm} />
                  <SubmitBtn loading={loading} label="Create patient account" />
                </form>
              </>
            )}

            {/* Doctor register */}
            {mode === 'doctor-register' && (
              <>
                <h2 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Join as a doctor</h2>
                <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:24 }}>Grow your practice globally</p>
                <form onSubmit={handleDoctorRegister}>
                  <Field label="Full name" placeholder="Dr. Your Name" value={dName} onChange={setDName} />
                  <Field label="Email address" type="email" placeholder="doctor@example.com" value={dEmail} onChange={setDEmail} />
                  <Field label="Phone number" placeholder="+91 98765 43210" value={dPhone} onChange={setDPhone} />
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:5 }}>Medical system</label>
                    <select value={dSystem} onChange={e => setDSystem(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:'var(--r-md)', border:'1.5px solid var(--border)', fontSize:14, outline:'none', background:'#fff', boxSizing:'border-box' as any }}>
                      {SPECIALTIES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <Field label="Password" type="password" placeholder="Minimum 8 characters" value={dPassword} onChange={setDPassword} />
                  <Field label="Confirm password" type="password" placeholder="Repeat your password" value={dConfirm} onChange={setDConfirm} />
                  <SubmitBtn loading={loading} label="Create doctor account" />
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    {/* Footer with legal links */}
      <div style={{ position:'fixed', bottom:0, left:0, right:0, padding:'10px 24px', background:'rgba(255,255,255,0.95)', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'16px', zIndex:10 }}>
        {[
          { label:'Terms of Service', slug:'terms' },
          { label:'Privacy Policy', slug:'privacy' },
          { label:'Refund Policy', slug:'refund-policy' },
          { label:'Medical Disclaimer', slug:'medical-disclaimer' },
          { label:'Contact Us', slug:'contact' },
        ].map(link => (
          <a key={link.slug} href={`https://deemona-doctors-web.onrender.com/legal/${link.slug}`} target="_blank" rel="noreferrer"
            style={{ fontSize:12, color:'var(--text-muted)', textDecoration:'none', cursor:'pointer' }}>
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
