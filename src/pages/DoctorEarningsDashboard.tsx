import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useState } from 'react';

export default function DoctorEarningsDashboard() {
  const [period, setPeriod] = useState<'week'|'month'|'year'>('month');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['doctor-earnings', period],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/me/earnings?period=${period}`);
      return data.data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ['doctor-earnings-history', period],
    queryFn: async () => {
      const { data } = await api.get(`/doctors/me/earnings/history?period=${period}`);
      return data.data as any[] || [];
    },
  });

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading earnings...</div>;

  const totalEarnings = stats?.total_earnings || 0;
  const pendingEarnings = stats?.pending_earnings || 0;
  const totalConsultations = stats?.total_consultations || 0;
  const completedConsultations = stats?.completed_consultations || 0;
  const avgRating = stats?.avg_rating || 0;
  const platformFee = totalEarnings * 0.10; // 10% platform fee
  const netEarnings = totalEarnings - platformFee;

  return (
    <div style={{ fontFamily:'var(--font-body)', maxWidth:900, margin:'0 auto', padding:'0 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text-primary)', margin:0 }}>
          💰 Earnings Dashboard
        </h1>
        <div style={{ display:'flex', gap:6 }}>
          {(['week','month','year'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding:'7px 16px', borderRadius:20, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
              background: period === p ? 'var(--primary)' : 'var(--bg)',
              color: period === p ? '#fff' : 'var(--text-secondary)',
            }}>
              {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Main earnings card */}
      <div style={{ background:'linear-gradient(135deg, var(--primary) 0%, #0E9E8A 100%)', borderRadius:'var(--r-xl)', padding:'28px 32px', marginBottom:20, color:'#fff' }}>
        <div style={{ fontSize:13, opacity:0.8, marginBottom:8 }}>Net Earnings ({period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'})</div>
        <div style={{ fontSize:48, fontWeight:800, marginBottom:4 }}>₹{netEarnings.toFixed(0)}</div>
        <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
          <div style={{ fontSize:13, opacity:0.8 }}>Gross: ₹{totalEarnings.toFixed(0)}</div>
          <div style={{ fontSize:13, opacity:0.8 }}>Platform fee (10%): -₹{platformFee.toFixed(0)}</div>
          {pendingEarnings > 0 && <div style={{ fontSize:13, opacity:0.8 }}>Pending: ₹{pendingEarnings.toFixed(0)}</div>}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Consultations', value:totalConsultations, icon:'📅', color:'#2563EB' },
          { label:'Completed', value:completedConsultations, icon:'✅', color:'#16A34A' },
          { label:'Avg Rating', value:avgRating ? `⭐ ${parseFloat(avgRating).toFixed(1)}` : 'N/A', icon:'⭐', color:'#D97706' },
          { label:'Avg per Session', value:totalConsultations > 0 ? `₹${(totalEarnings/totalConsultations).toFixed(0)}` : '₹0', icon:'💵', color:'#7C3AED' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Payout info */}
      <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>💳 Payout Information</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ padding:'12px', background:'#ECFDF5', borderRadius:'var(--r-md)' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Next Payout Date</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#065F46' }}>
              {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
            </div>
          </div>
          <div style={{ padding:'12px', background:'#EFF6FF', borderRadius:'var(--r-md)' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Payout Amount</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#1D4ED8' }}>₹{netEarnings.toFixed(0)}</div>
          </div>
        </div>
        <div style={{ marginTop:12, padding:'10px 12px', background:'#FFFBEB', borderRadius:'var(--r-md)', fontSize:12, color:'#92400E' }}>
          ℹ️ Payouts are processed on the 1st of every month. 10% platform fee is deducted from gross earnings.
        </div>
      </div>

      {/* Consultation history */}
      <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:32 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>📋 Consultation History</div>
        {(!history || history.length === 0) ? (
          <div style={{ textAlign:'center', padding:40 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📅</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>No consultations in this period</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 100px', gap:12, padding:'8px 12px', background:'var(--bg)', borderRadius:'var(--r-md)', fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>
              <span>Patient</span>
              <span>Date</span>
              <span>Type</span>
              <span style={{ textAlign:'right' }}>Fee</span>
            </div>
            {history.map((item: any) => (
              <div key={item.id} style={{ display:'grid', gridTemplateColumns:'1fr 100px 100px 100px', gap:12, padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{item.patient_name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.consult_type}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                  {new Date(item.appt_date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                </div>
                <div>
                  <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600,
                    background: item.status === 'completed' ? '#ECFDF5' : item.status === 'confirmed' ? '#EFF6FF' : '#F3F4F6',
                    color: item.status === 'completed' ? '#065F46' : item.status === 'confirmed' ? '#1D4ED8' : '#374151',
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)', textAlign:'right' }}>
                  ₹{item.fee || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
