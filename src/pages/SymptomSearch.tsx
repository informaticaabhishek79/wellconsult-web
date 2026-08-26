import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const SYMPTOMS = [
  { id:'fever',        label:'Fever',              icon:'🌡️', specialty:'allopathy' },
  { id:'headache',     label:'Headache',           icon:'🤕', specialty:'allopathy' },
  { id:'stomach',      label:'Stomach pain',       icon:'🤢', specialty:'allopathy' },
  { id:'cough',        label:'Cough & cold',       icon:'😷', specialty:'allopathy' },
  { id:'back_pain',    label:'Back pain',          icon:'🦴', specialty:'allopathy' },
  { id:'skin',         label:'Skin issues',        icon:'🧴', specialty:'allopathy' },
  { id:'anxiety',      label:'Stress & anxiety',  icon:'🧠', specialty:'allopathy' },
  { id:'diabetes',     label:'Diabetes',           icon:'💉', specialty:'allopathy' },
  { id:'bp',           label:'Blood pressure',     icon:'❤️', specialty:'allopathy' },
  { id:'joints',       label:'Joint pain',         icon:'🦵', specialty:'ayurveda' },
  { id:'digestion',    label:'Digestion issues',  icon:'🌿', specialty:'ayurveda' },
  { id:'immunity',     label:'Low immunity',       icon:'🛡️', specialty:'ayurveda' },
  { id:'sleep',        label:'Sleep problems',     icon:'😴', specialty:'homeopathy' },
  { id:'allergy',      label:'Allergies',          icon:'🤧', specialty:'homeopathy' },
  { id:'stress_yoga',  label:'Stress relief',     icon:'🧘', specialty:'yoga' },
  { id:'weight',       label:'Weight management', icon:'⚖️', specialty:'naturopathy' },
  { id:'detox',        label:'Detox & cleanse',   icon:'🌱', specialty:'naturopathy' },
  { id:'chronic',      label:'Chronic conditions',icon:'⚗️', specialty:'unani' },
];

const SPECIALTY_LABELS: Record<string, string> = {
  allopathy:'Allopathy', homeopathy:'Homeopathy', ayurveda:'Ayurveda',
  yoga:'Yoga Therapy', naturopathy:'Naturopathy', unani:'Unani',
};

const SPECIALTY_COLORS: Record<string, string> = {
  allopathy:'#2563EB', homeopathy:'#7C3AED', ayurveda:'#0A7B6C',
  yoga:'#EA580C', naturopathy:'#16A34A', unani:'#0369A1',
};

export default function SymptomSearch({ onBook }: { onBook: (doctorId: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<'symptoms'|'results'>('symptoms');
  const [searchText, setSearchText] = useState('');

  const suggestedSpecialty = selected.length > 0
    ? SYMPTOMS.find(s => selected.includes(s.id))?.specialty || 'allopathy'
    : null;

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['symptom-doctors', suggestedSpecialty],
    queryFn: async () => {
      const { data } = await api.get('/doctors', { params: { medical_system: suggestedSpecialty, limit: 6 } });
      return data.data || [];
    },
    enabled: step === 'results' && !!suggestedSpecialty,
  });

  const toggleSymptom = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const filteredSymptoms = SYMPTOMS.filter(s =>
    !searchText || s.label.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      {step === 'symptoms' ? (
        <>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🩺</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              What's bothering you?
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
              Select your symptoms and we'll connect you with the right specialist
            </p>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            <input
              placeholder="Search symptoms..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%', padding: '11px 16px 11px 42px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}
            />
          </div>

          {/* Symptom grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
            {filteredSymptoms.map(s => {
              const isSelected = selected.includes(s.id);
              const color = SPECIALTY_COLORS[s.specialty];
              return (
                <div key={s.id} onClick={() => toggleSymptom(s.id)} style={{
                  padding: '16px 12px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
                  border: `2px solid ${isSelected ? color : 'var(--border)'}`,
                  background: isSelected ? `${color}12` : '#fff',
                  textAlign: 'center', transition: 'all 0.15s',
                  boxShadow: isSelected ? `0 0 0 3px ${color}20` : 'none',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? color : 'var(--text-primary)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textTransform: 'capitalize' }}>
                    {SPECIALTY_LABELS[s.specialty]}
                  </div>
                  {isSelected && (
                    <div style={{ marginTop: 6, width: 20, height: 20, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, margin: '6px auto 0' }}>✓</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected summary */}
          {selected.length > 0 && (
            <div style={{ position: 'sticky', bottom: 16 }}>
              <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 18px', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selected.length} symptom{selected.length > 1 ? 's' : ''} selected
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Recommended: <span style={{ fontWeight: 600, color: SPECIALTY_COLORS[suggestedSpecialty!], textTransform: 'capitalize' }}>{SPECIALTY_LABELS[suggestedSpecialty!]}</span>
                  </div>
                </div>
                <button onClick={() => setStep('results')} style={{
                  padding: '10px 24px', borderRadius: 'var(--r-md)', border: 'none',
                  background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}>
                  Find doctors →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Results */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button onClick={() => setStep('symptoms')} style={{ padding: '7px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              ← Back
            </button>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                Recommended doctors
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                Based on your symptoms · <span style={{ textTransform: 'capitalize', color: SPECIALTY_COLORS[suggestedSpecialty!], fontWeight: 600 }}>{SPECIALTY_LABELS[suggestedSpecialty!]}</span> specialists
              </p>
            </div>
          </div>

          {/* Symptom badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {selected.map(id => {
              const s = SYMPTOMS.find(sym => sym.id === id);
              return s ? (
                <div key={id} style={{ padding: '4px 12px', borderRadius: 'var(--r-full)', background: `${SPECIALTY_COLORS[s.specialty]}15`, border: `1px solid ${SPECIALTY_COLORS[s.specialty]}30`, fontSize: 12, color: SPECIALTY_COLORS[s.specialty], fontWeight: 500 }}>
                  {s.icon} {s.label}
                </div>
              ) : null;
            })}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Finding the best doctors for you...</div>
          ) : !doctors?.length ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No doctors found</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Try different symptoms or browse all doctors</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {doctors.map((doc: any) => {
                const color = SPECIALTY_COLORS[doc.medical_system] || 'var(--primary)';
                const initials = doc.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'D';
                const rating = doc.avg_rating ? parseFloat(String(doc.avg_rating)).toFixed(1) : null;
                const fee = doc.min_fee ? `₹${(doc.min_fee/100).toFixed(0)}` : null;

                return (
                  <div key={doc.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ height: 4, background: color }}/>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.full_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{doc.degree}{doc.specialization ? ` · ${doc.specialization}` : ''}</div>
                          <div style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 'var(--r-full)', background: `${color}15`, color, fontSize: 10, fontWeight: 600, marginTop: 3, textTransform: 'capitalize' }}>
                            {doc.medical_system}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                        {rating && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⭐ {rating}</span>}
                        {doc.experience_years && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💼 {doc.experience_years} yrs</span>}
                        {doc.city && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {doc.city}</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          {fee && <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{fee}</span>}
                          {fee && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>onwards</span>}
                        </div>
                        <button onClick={() => onBook(doc.id)} style={{
                          padding: '7px 16px', borderRadius: 'var(--r-md)', border: 'none',
                          background: color, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}>
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
