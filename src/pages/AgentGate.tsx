import { useEffect, useState } from 'react';
import { api } from '../api';
import AgentDashboard from './AgentDashboard';
import AgentOnboarding from './AgentOnboarding';

export default function AgentGate() {
  const [state, setState] = useState<'loading' | 'join' | 'dash'>('loading');
  useEffect(() => {
    api.get('/agents/me')
      .then(r => { const d = r?.data?.data ?? r?.data; setState(d && (d.id || d.agent_id || d.full_name) ? 'dash' : 'join'); })
      .catch(e => setState(e?.response?.status === 404 || e?.response?.status === 400 ? 'join' : 'dash'));
  }, []);
  if (state === 'loading') return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div>;
  if (state === 'join') return <AgentOnboarding onSuccess={() => setState('dash')} />;
  return <AgentDashboard />;
}
