import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export default function LegalPage({ slug, onBack }: { slug: string; onBack: () => void }) {
  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['legal-page', slug],
    queryFn: async () => {
      const { data } = await api.get(`/legal/${slug}`);
      return data.data;
    },
  });

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:14, fontWeight:500, marginBottom:24, padding:0 }}>
        ← Back
      </button>

      {isLoading && <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading...</div>}
      {isError && <div style={{ textAlign:'center', padding:60 }}><div style={{ fontSize:48, marginBottom:12 }}>📄</div><div style={{ fontSize:16, color:'var(--text-muted)' }}>Page not found.</div></div>}

      {page && (
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{page.title}</h1>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:28 }}>
            Last updated: {new Date(page.updated_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)', padding:'32px 36px', lineHeight:1.8, color:'var(--text-primary)', fontSize:15 }}
            dangerouslySetInnerHTML={{ __html: page.content }}/>
        </div>
      )}
    </div>
  );
}
