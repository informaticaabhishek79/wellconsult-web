import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_COLORS: Record<string, any> = {
  pending:    { bg:'#FFFBEB', color:'#92400E', label:'⏳ Pending' },
  active:     { bg:'#ECFDF5', color:'#065F46', label:'✅ Active' },
  suspended:  { bg:'#FEF2F2', color:'#991B1B', label:'⚠️ Suspended' },
  terminated: { bg:'#FEF2F2', color:'#991B1B', label:'❌ Terminated' },
  rejected:   { bg:'#F3F4F6', color:'#374151', label:'❌ Rejected' },
};

const VIOLATION_TYPES = [
  'Unauthorized fee collection', 'Data privacy breach', 'False representation',
  'Soliciting for competitors', 'Harassment of users', 'Document fraud',
  'Brand defamation', 'Other misconduct',
];

export default function AgentManagementAdmin() {
  const qc = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [violation, setViolation] = useState({ type:'', description:'', severity:'warning', action:'' });

  const { data: agents, isLoading } = useQuery({
    queryKey: ['admin-agents'],
    queryFn: async () => {
      const { data } = await api.get('/agents');
      return data.data as any[] || [];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['agent-docs', selectedAgent?.id],
    enabled: !!selectedAgent?.id,
    queryFn: async () => {
      const { data } = await api.get(`/agents/${selectedAgent.id}/documents`);
      return data.data as any[] || [];
    },
  });

  const filtered = (agents || []).filter((a: any) => {
    const matchSearch = !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.agent_code?.includes(search.toUpperCase());
    const matchStatus = filterStatus === 'all' || a.profile_status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: (agents || []).length,
    active: (agents || []).filter((a: any) => a.profile_status === 'active').length,
    pending: (agents || []).filter((a: any) => a.profile_status === 'pending').length,
    terminated: (agents || []).filter((a: any) => a.profile_status === 'terminated').length,
  };

  const doAction = async (agentId: string, action: string, body: any = {}) => {
    setActionLoading(true);
    try {
      await api.post(`/agents/${agentId}/${action}`, body);
      qc.invalidateQueries({ queryKey: ['admin-agents'] });
      alert(`Agent ${action}d successfully.`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || `Failed to ${action} agent.`);
    } finally { setActionLoading(false); }
  };

  const handleViolation = async () => {
    if (!violation.type || !violation.description) { alert('Please fill all violation fields.'); return; }
    setActionLoading(true);
    try {
      const { data } = await api.post(`/agents/${selectedAgent.id}/violations`, {
        violation_type: violation.type, description: violation.description,
        severity: violation.severity, action_taken: violation.action,
      });
      qc.invalidateQueries({ queryKey: ['admin-agents'] });
      setShowViolationModal(false);
      setViolation({ type:'', description:'', severity:'warning', action:'' });
      if (data.data.auto_terminated) {
        alert(`⚠️ Agent has been AUTO-TERMINATED after 3 violations.`);
      } else {
        alert(`Violation recorded. Agent now has ${data.data.violation_count}/3 violations.`);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record violation.');
    } finally { setActionLoading(false); }
  };

  const viewDocument = async (agentId: string, docId: string) => {
    try {
      const { data } = await api.get(`/agents/${agentId}/documents/${docId}/view`);
      window.open(data.data.url, '_blank');
    } catch { alert('Could not open document.'); }
  };

  return (
    <div style={{ fontFamily:'var(--font-body)' }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, marginBottom:20 }}>Marketing Agent Management</h2>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Agents', value:stats.total, icon:'🤝', color:'#2563EB' },
          { label:'Active', value:stats.active, icon:'✅', color:'#16A34A' },
          { label:'Pending Review', value:stats.pending, icon:'⏳', color:'#D97706' },
          { label:'Terminated', value:stats.terminated, icon:'❌', color:'#DC2626' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'14px 16px' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Violation Modal */}
      {showViolationModal && selectedAgent && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:480, width:'100%' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:'#DC2626', marginBottom:4 }}>⚠️ File Violation</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Agent: <strong>{selectedAgent.full_name}</strong> ({selectedAgent.agent_code}) · {selectedAgent.violation_count}/3 violations</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Violation Type *</label>
                <select value={violation.type} onChange={e => setViolation(v => ({...v, type:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
                  <option value="">Select type...</option>
                  {VIOLATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Severity</label>
                <select value={violation.severity} onChange={e => setViolation(v => ({...v, severity:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
                  <option value="warning">⚠️ Warning</option>
                  <option value="serious">🔴 Serious</option>
                  <option value="critical">⛔ Critical</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Description *</label>
                <textarea value={violation.description} onChange={e => setViolation(v => ({...v, description:e.target.value}))} rows={3}
                  placeholder="Describe the violation in detail..."
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', resize:'none' as any, boxSizing:'border-box' as any }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Action Taken</label>
                <input value={violation.action} onChange={e => setViolation(v => ({...v, action:e.target.value}))}
                  placeholder="e.g. Verbal warning issued"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              {selectedAgent.violation_count >= 2 && (
                <div style={{ background:'#FEF2F2', borderRadius:'var(--r-md)', padding:'10px 12px', fontSize:12, color:'#991B1B' }}>
                  ⚠️ This is the agent's {selectedAgent.violation_count + 1}rd violation. Filing this will automatically TERMINATE their account.
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => { setShowViolationModal(false); setViolation({ type:'', description:'', severity:'warning', action:'' }); }}
                style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleViolation} disabled={actionLoading || !violation.type || !violation.description}
                style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background: actionLoading ? 'var(--border)' : '#DC2626', color: actionLoading ? 'var(--text-muted)' : '#fff', fontSize:13, fontWeight:700, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                {actionLoading ? 'Filing...' : '⚠️ File Violation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document viewer */}
      {selectedAgent && documents && documents.length > 0 && !showViolationModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:500, width:'100%', maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700 }}>Documents — {selectedAgent.full_name}</h3>
              <button onClick={() => setSelectedAgent(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {documents.map((doc: any) => (
                <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'var(--bg)', borderRadius:'var(--r-md)' }}>
                  <span>📎</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{doc.doc_type.replace(/_/g,' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{doc.file_name}</div>
                  </div>
                  <button onClick={() => viewDocument(selectedAgent.id, doc.id)}
                    style={{ padding:'5px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:11, cursor:'pointer' }}>
                    👁️ View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input placeholder="Search by name or agent code..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none' }}/>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Agent List */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading agents...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🤝</div>
          <div style={{ fontSize:16, color:'var(--text-muted)' }}>No agents found</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map((agent: any) => {
            const s = STATUS_COLORS[agent.profile_status] || STATUS_COLORS.pending;
            return (
              <div key={agent.id} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontSize:15, fontWeight:700 }}>{agent.full_name}</span>
                      <span style={{ padding:'2px 8px', borderRadius:20, background:s.bg, color:s.color, fontSize:11, fontWeight:600 }}>{s.label}</span>
                      {agent.violation_count > 0 && (
                        <span style={{ padding:'2px 8px', borderRadius:20, background:'#FEF2F2', color:'#DC2626', fontSize:11, fontWeight:600 }}>
                          ⚠️ {agent.violation_count}/3 violations
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
                      🆔 {agent.agent_code} · {agent.email} · {agent.city}, {agent.state}
                    </div>
                    {agent.territory && <div style={{ fontSize:12, color:'var(--text-secondary)' }}>📍 Territory: {agent.territory}</div>}
                    {agent.location_id && (
                      <div style={{ fontSize:12, color:'#1D4ED8' }}>📍 {agent.location_id} {agent.location_name ? `— ${agent.location_name}` : ''}</div>
                    )}
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
                      Joined: {new Date(agent.created_at).toLocaleDateString('en-IN')} · Referrals: {agent.total_referrals} · Earnings: ₹{agent.total_earnings}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                    <button onClick={() => setSelectedAgent(agent)}
                      style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', color:'var(--text-secondary)', fontSize:11, cursor:'pointer' }}>
                      📄 Docs
                    </button>
                    {agent.profile_status === 'pending' && (
                      <button onClick={() => doAction(agent.id, 'verify')} disabled={actionLoading}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #A7F3D0', background:'#ECFDF5', color:'#065F46', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        ✅ Approve
                      </button>
                    )}
                    {agent.profile_status === 'pending' && (
                      <button onClick={() => { const r = prompt('Rejection reason:'); if(r) doAction(agent.id, 'reject', { reason:r }); }}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        ❌ Reject
                      </button>
                    )}
                    <button onClick={async () => {
                        const locId = prompt('Enter Location ID (e.g. ZONE-MH-001):');
                        const locName = prompt('Enter Location Name (e.g. Mumbai North):');
                        if (locId) {
                          try {
                            await api.post(`/agents/${agent.id}/assign-location`, { location_id: locId, location_name: locName });
                            qc.invalidateQueries({ queryKey: ['admin-agents'] });
                            alert('Location assigned!');
                          } catch { alert('Failed to assign location.'); }
                        }
                      }} style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                      📍 Location
                    </button>
                    {agent.profile_status === 'active' && (
                      <button onClick={() => { setSelectedAgent(agent); setShowViolationModal(true); }}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #FDE68A', background:'#FFFBEB', color:'#D97706', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        ⚠️ Violation
                      </button>
                    )}
                    {agent.profile_status === 'active' && (
                      <button onClick={() => { const r = prompt('Termination reason:'); if(r) doAction(agent.id, 'terminate', { reason:r }); }}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        🚫 Terminate
                      </button>
                    )}
                    {agent.profile_status === 'terminated' && (
                      <button onClick={() => doAction(agent.id, 'reinstate')} disabled={actionLoading}
                        style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #BFDBFE', background:'#EFF6FF', color:'#1D4ED8', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                        🔄 Reinstate
                      </button>
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
}
