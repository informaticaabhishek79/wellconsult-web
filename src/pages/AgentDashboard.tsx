import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_STYLES: Record<string, any> = {
  pending:    { bg:'#FFFBEB', color:'#92400E', label:'⏳ Pending Review' },
  active:     { bg:'#ECFDF5', color:'#065F46', label:'✅ Active' },
  suspended:  { bg:'#FEF2F2', color:'#991B1B', label:'⚠️ Suspended' },
  terminated: { bg:'#FEF2F2', color:'#991B1B', label:'❌ Terminated' },
  rejected:   { bg:'#F3F4F6', color:'#374151', label:'❌ Rejected' },
};

export default function AgentDashboard() {
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent-me'],
    queryFn: async () => {
      const { data } = await api.get('/agents/me');
      return data.data;
    },
  });

  const { data: violations } = useQuery({
    queryKey: ['agent-violations'],
    enabled: !!agent,
    queryFn: async () => {
      const { data } = await api.get('/agents/me/violations');
      return data.data as any[] || [];
    },
  });

  const { data: referrals } = useQuery({
    queryKey: ['agent-referrals'],
    enabled: !!agent,
    queryFn: async () => {
      const { data } = await api.get('/agents/me/referrals');
      return data.data as any[] || [];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['agent-documents'],
    enabled: !!agent,
    queryFn: async () => {
      const { data } = await api.get('/agents/me/documents');
      return data.data as any[] || [];
    },
  });

  if (isLoading) return <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading...</div>;
  if (!agent) return null;

  const status = STATUS_STYLES[agent.profile_status] || STATUS_STYLES.pending;
  const violationWarnings = Math.max(0, 3 - (agent.violation_count || 0));

  return (
    <div style={{ fontFamily:'var(--font-body)', maxWidth:800, margin:'0 auto', padding:'0 16px' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', borderRadius:'var(--r-xl)', padding:'24px 28px', marginBottom:20, color:'#fff' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>AGENT ID</div>
            <div style={{ fontSize:28, fontWeight:800, fontFamily:'monospace', letterSpacing:2 }}>{agent.agent_code}</div>
            <div style={{ fontSize:15, fontWeight:600, marginTop:4 }}>{agent.full_name}</div>
            <div style={{ fontSize:12, opacity:0.8 }}>{agent.city}, {agent.state}</div>
            {agent.location_id && (
              <div style={{ fontSize:12, opacity:0.9, marginTop:4, background:'rgba(255,255,255,0.15)', padding:'3px 10px', borderRadius:20, display:'inline-block' }}>
                📍 {agent.location_id} {agent.location_name ? `— ${agent.location_name}` : ''}
              </div>
            )}
          </div>
          <div style={{ textAlign:'right' }}>
            <span style={{ padding:'6px 14px', borderRadius:20, background:'rgba(255,255,255,0.2)', fontSize:12, fontWeight:700 }}>
              {status.label}
            </span>
            <div style={{ fontSize:11, opacity:0.7, marginTop:8 }}>
              Commission: {agent.commission_rate}%
            </div>
          </div>
        </div>
      </div>

      {/* Violation warning */}
      {agent.violation_count > 0 && agent.profile_status !== 'terminated' && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r-lg)', padding:'14px 16px', marginBottom:16, display:'flex', gap:12, alignItems:'flex-start' }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#991B1B' }}>
              {agent.violation_count} Violation{agent.violation_count > 1 ? 's' : ''} on Record
            </div>
            <div style={{ fontSize:13, color:'#DC2626', marginTop:2 }}>
              {violationWarnings} more violation{violationWarnings !== 1 ? 's' : ''} will result in automatic termination.
            </div>
          </div>
        </div>
      )}

      {agent.profile_status === 'terminated' && (
        <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'var(--r-lg)', padding:'16px', marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#991B1B', marginBottom:4 }}>❌ Account Terminated</div>
          <div style={{ fontSize:13, color:'#DC2626' }}>{agent.termination_reason}</div>
          {agent.terminated_at && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>Terminated on: {new Date(agent.terminated_at).toLocaleDateString('en-IN')}</div>}
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Referrals', value:agent.total_referrals || 0, icon:'👥' },
          { label:'Total Earnings', value:`₹${(agent.total_earnings || 0).toFixed(0)}`, icon:'💰' },
          { label:'Violations', value:agent.violation_count || 0, icon:'⚠️' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      {agent.profile_status === 'active' && (
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>🔗 Your Referral Link</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ flex:1, padding:'8px 12px', borderRadius:'var(--r-md)', background:'var(--bg)', fontSize:12, fontFamily:'monospace', color:'var(--text-secondary)', wordBreak:'break-all' as any }}>
              https://wellconsult-web.onrender.com?ref={agent.agent_code}
            </div>
            <button onClick={() => navigator.clipboard.writeText(`https://wellconsult-web.onrender.com?ref=${agent.agent_code}`)}
              style={{ padding:'8px 14px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              📋 Copy
            </button>
          </div>
        </div>
      )}

      {/* Documents */}
      <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>📄 Documents</div>
        {(!documents || documents.length === 0) ? (
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>No documents uploaded yet.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {documents.map((doc: any) => (
              <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                <span>📎</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{doc.doc_type.replace(/_/g,' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{doc.file_name}</div>
                </div>
                <span style={{ fontSize:11, padding:'3px 8px', borderRadius:20, background: doc.verified ? '#ECFDF5' : '#FFFBEB', color: doc.verified ? '#065F46' : '#92400E' }}>
                  {doc.verified ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Violations */}
      {violations && violations.length > 0 && (
        <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, marginBottom:12, color:'#DC2626' }}>⚠️ Violation History</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {violations.map((v: any) => (
              <div key={v.id} style={{ padding:'12px', borderRadius:'var(--r-md)', background:'#FEF2F2', border:'1px solid #FECACA' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#991B1B' }}>{v.violation_type.replace(/_/g,' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <div style={{ fontSize:13, color:'#DC2626' }}>{v.description}</div>
                {v.action_taken && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Action: {v.action_taken}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals */}
      <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px', marginBottom:32 }}>
        <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>👥 Referrals</div>
        {(!referrals || referrals.length === 0) ? (
          <div style={{ textAlign:'center', padding:24 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>👥</div>
            <div style={{ fontSize:13, color:'var(--text-muted)' }}>No referrals yet. Share your referral link to start earning!</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {referrals.map((r: any) => (
              <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{r.referred_name || 'Anonymous'}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.referred_type} · {new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)' }}>₹{r.commission_amount}</div>
                  <div style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: r.status === 'paid' ? '#ECFDF5' : '#FFFBEB', color: r.status === 'paid' ? '#065F46' : '#92400E' }}>{r.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
