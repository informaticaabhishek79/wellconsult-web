import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

declare global { interface Window { Razorpay: any; } }

const PLAN_COLORS = {
  free:    { primary:'#6B7280', light:'#F3F4F6', badge:'Free' },
  gold:    { primary:'#D97706', light:'#FFFBEB', badge:'⭐ Gold' },
  diamond: { primary:'#7C3AED', light:'#F5F3FF', badge:'💎 Diamond' },
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  const { data: currentSub } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/me');
      return data.data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/plans');
      return data.data;
    },
  });

  const loadRazorpay = () => new Promise<boolean>(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  const handleSubscribe = async (plan: string) => {
    setError('');
    setLoading(plan);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError('Payment gateway failed to load. Please try again.'); return; }

      const { data } = await api.post('/subscriptions/create', { plan });
      const sub = data.data;

      const options = {
        key: sub.razorpay_key,
        subscription_id: sub.subscription_id,
        name: 'Deemona Doctors',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — ₹${sub.amount / 100}/month`,
        image: 'https://doctors.deemona.com/favicon.ico',
        prefill: {
          name: sub.user_name,
          email: sub.user_email,
          contact: sub.user_phone,
        },
        theme: { color: plan === 'gold' ? '#D97706' : '#7C3AED' },
        handler: async (response: any) => {
          // Payment successful
          await api.post('/subscriptions/verify', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });
          qc.invalidateQueries({ queryKey: ['subscription'] });
          alert(`🎉 ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated successfully!`);
        },
        modal: {
          ondismiss: () => setLoading(''),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading('');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription? You will retain access until end of current billing cycle.')) return;
    try {
      await api.post('/subscriptions/cancel');
      qc.invalidateQueries({ queryKey: ['subscription'] });
      alert('Subscription cancelled. You will retain access until end of billing cycle.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel.');
    }
  };

  const currentPlan = currentSub?.plan || 'free';

  return (
    <div style={{ fontFamily:'var(--font-body)', maxWidth:900, margin:'0 auto', padding:'0 16px' }}>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-primary)', marginBottom:8 }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize:15, color:'var(--text-secondary)' }}>
          Unlock better healthcare access with Deemona Doctors
        </p>
        {currentPlan !== 'free' && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:8, padding:'6px 16px', borderRadius:20, background: PLAN_COLORS[currentPlan as keyof typeof PLAN_COLORS]?.light, border:`1px solid ${PLAN_COLORS[currentPlan as keyof typeof PLAN_COLORS]?.primary}` }}>
            <span style={{ fontSize:13, fontWeight:700, color: PLAN_COLORS[currentPlan as keyof typeof PLAN_COLORS]?.primary }}>
              {PLAN_COLORS[currentPlan as keyof typeof PLAN_COLORS]?.badge} — Current Plan
            </span>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r-md)', padding:'12px 16px', marginBottom:20, fontSize:13, color:'#DC2626', textAlign:'center' }}>
          {error}
        </div>
      )}

      {/* Plan cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:32 }}>
        {plans && ['free','gold','diamond'].map(planKey => {
          const plan = plans[planKey];
          const colors = PLAN_COLORS[planKey as keyof typeof PLAN_COLORS];
          const isCurrent = currentPlan === planKey;
          const isActive = currentSub?.status === 'active';

          return (
            <div key={planKey} style={{
              background:'#fff', borderRadius:'var(--r-xl)',
              border: isCurrent ? `2px solid ${colors.primary}` : '1px solid var(--border)',
              padding:'24px 20px', position:'relative',
              boxShadow: isCurrent ? `0 0 0 4px ${colors.primary}20` : 'var(--shadow-sm)',
            }}>
              {isCurrent && (
                <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'4px 14px', borderRadius:20, background:colors.primary, color:'#fff', fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                  Current Plan
                </div>
              )}
              {planKey === 'diamond' && (
                <div style={{ position:'absolute', top:-12, right:16, padding:'4px 14px', borderRadius:20, background:'#7C3AED', color:'#fff', fontSize:11, fontWeight:700 }}>
                  Best Value
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:24, marginBottom:6 }}>
                  {planKey === 'free' ? '🆓' : planKey === 'gold' ? '⭐' : '💎'}
                </div>
                <div style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)', marginBottom:2 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontSize:32, fontWeight:800, color:colors.primary }}>
                    {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                  </span>
                  {plan.price > 0 && <span style={{ fontSize:13, color:'var(--text-muted)' }}>/month</span>}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {plan.features.map((f: string) => (
                  <div key={f} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'var(--text-secondary)' }}>
                    <span style={{ color:colors.primary, flexShrink:0, marginTop:1 }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {planKey === 'free' ? (
                <button disabled style={{ width:'100%', padding:'11px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text-muted)', fontSize:14, cursor:'not-allowed' }}>
                  {isCurrent ? 'Current Plan' : 'Always Free'}
                </button>
              ) : isCurrent && isActive ? (
                <button onClick={handleCancel} style={{ width:'100%', padding:'11px', borderRadius:'var(--r-md)', border:`1px solid ${colors.primary}`, background:'#fff', color:colors.primary, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel Subscription
                </button>
              ) : (
                <button onClick={() => handleSubscribe(planKey)} disabled={!!loading}
                  style={{ width:'100%', padding:'11px', borderRadius:'var(--r-md)', border:'none', background: loading === planKey ? 'var(--border)' : colors.primary, color: loading === planKey ? 'var(--text-muted)' : '#fff', fontSize:14, fontWeight:700, cursor: loading === planKey ? 'not-allowed' : 'pointer' }}>
                  {loading === planKey ? 'Processing...' : `Subscribe — ₹${plan.price}/mo`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active subscription details */}
      {currentSub && currentPlan !== 'free' && (
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:20 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>📋 Subscription Details</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Status</div>
              <div style={{ fontSize:13, fontWeight:600, color: currentSub.status === 'active' ? '#16A34A' : '#D97706' }}>
                {currentSub.status === 'active' ? '✅ Active' : currentSub.status === 'cancelling' ? '⏳ Cancelling' : currentSub.status}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Amount</div>
              <div style={{ fontSize:13, fontWeight:600 }}>₹{currentSub.amount}/month</div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2 }}>Next Renewal</div>
              <div style={{ fontSize:13, fontWeight:600 }}>
                {currentSub.expires_at ? new Date(currentSub.expires_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund policy */}
      <div style={{ background:'#F8FAFC', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px' }}>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>💡 Refund Policy</div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.7 }}>
          • Full refund within 24 hours of subscription purchase<br/>
          • Pro-rata refund if cancelled mid-month<br/>
          • Consultation fees refunded if doctor doesn't join within 15 minutes<br/>
          • No refund for completed consultations<br/>
          • Overpayments will be refunded within 5-7 business days
        </div>
      </div>
    </div>
  );
}
