import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const CATEGORY_LABELS: Record<string, string> = {
  public: 'General',
  doctor: 'Doctor Portal',
  patient: 'Patient Portal',
};

export default function LegalPagesPublic({ onView }: { onView: (slug: string) => void }) {
  const [activeCategory, setActiveCategory] = useState('public');

  const { data: pages, isLoading } = useQuery({
    queryKey: ['legal-pages-public'],
    queryFn: async () => {
      const { data } = await api.get('/legal');
      return data.data as any[] || [];
    },
  });

  const categories = ['public', 'doctor', 'patient'];
  const filtered = (pages || []).filter((p: any) => p.category === activeCategory);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Legal & Policies</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Deemona Doctors's terms, policies and agreements</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '8px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
            border: `1.5px solid ${activeCategory === cat ? 'var(--primary)' : 'var(--border)'}`,
            background: activeCategory === cat ? 'var(--primary-light)' : '#fff',
            color: activeCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize: 13, fontWeight: activeCategory === cat ? 600 : 400,
          }}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((page: any) => (
          <div key={page.id} onClick={() => onView(page.slug)} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.15s' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{page.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Updated {new Date(page.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>→</span>
          </div>
        ))}
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No pages in this category yet.</div>
        )}
      </div>
    </div>
  );
}
