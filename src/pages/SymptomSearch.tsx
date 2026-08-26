import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

// Comprehensive symptom list sorted alphabetically
const ALL_SYMPTOMS = [
  { id:'abdominal_bloating', label:'Abdominal bloating', specialty:'allopathy' },
  { id:'abdominal_cramps', label:'Abdominal cramps', specialty:'allopathy' },
  { id:'abdominal_pain', label:'Abdominal pain', specialty:'allopathy' },
  { id:'acne', label:'Acne', specialty:'allopathy' },
  { id:'allergic_reaction', label:'Allergic reaction', specialty:'homeopathy' },
  { id:'anxiety', label:'Anxiety', specialty:'homeopathy' },
  { id:'appetite_loss', label:'Appetite loss', specialty:'ayurveda' },
  { id:'arm_pain', label:'Arm pain', specialty:'allopathy' },
  { id:'back_pain', label:'Back pain', specialty:'ayurveda' },
  { id:'bad_breath', label:'Bad breath', specialty:'ayurveda' },
  { id:'baldness', label:'Baldness / Hair loss', specialty:'ayurveda' },
  { id:'bloating', label:'Bloating', specialty:'allopathy' },
  { id:'blood_in_stool', label:'Blood in stool', specialty:'allopathy' },
  { id:'blood_in_urine', label:'Blood in urine', specialty:'allopathy' },
  { id:'blurred_vision', label:'Blurred vision', specialty:'allopathy' },
  { id:'body_ache', label:'Body ache', specialty:'allopathy' },
  { id:'breathlessness', label:'Breathlessness', specialty:'allopathy' },
  { id:'burning_urination', label:'Burning urination', specialty:'allopathy' },
  { id:'chest_pain', label:'Chest pain', specialty:'allopathy' },
  { id:'chest_tightness', label:'Chest tightness', specialty:'allopathy' },
  { id:'chills', label:'Chills', specialty:'allopathy' },
  { id:'chronic_fatigue', label:'Chronic fatigue', specialty:'naturopathy' },
  { id:'cold_hands', label:'Cold hands and feet', specialty:'allopathy' },
  { id:'confusion', label:'Confusion / Brain fog', specialty:'allopathy' },
  { id:'constipation', label:'Constipation', specialty:'ayurveda' },
  { id:'cough', label:'Cough', specialty:'allopathy' },
  { id:'dandruff', label:'Dandruff', specialty:'ayurveda' },
  { id:'depression', label:'Depression', specialty:'homeopathy' },
  { id:'diabetes', label:'Diabetes symptoms', specialty:'allopathy' },
  { id:'diarrhea', label:'Diarrhea', specialty:'allopathy' },
  { id:'dizziness', label:'Dizziness', specialty:'allopathy' },
  { id:'dry_eyes', label:'Dry eyes', specialty:'allopathy' },
  { id:'dry_mouth', label:'Dry mouth', specialty:'allopathy' },
  { id:'dry_skin', label:'Dry skin', specialty:'allopathy' },
  { id:'ear_pain', label:'Ear pain', specialty:'allopathy' },
  { id:'eczema', label:'Eczema', specialty:'homeopathy' },
  { id:'erectile_dysfunction', label:'Erectile dysfunction', specialty:'allopathy' },
  { id:'excessive_sweating', label:'Excessive sweating', specialty:'allopathy' },
  { id:'excessive_thirst', label:'Excessive thirst', specialty:'allopathy' },
  { id:'eye_pain', label:'Eye pain', specialty:'allopathy' },
  { id:'fatigue', label:'Fatigue', specialty:'allopathy' },
  { id:'fever', label:'Fever', specialty:'allopathy' },
  { id:'flatulence', label:'Flatulence / Gas', specialty:'ayurveda' },
  { id:'foot_pain', label:'Foot pain', specialty:'allopathy' },
  { id:'frequent_urination', label:'Frequent urination', specialty:'allopathy' },
  { id:'hair_fall', label:'Hair fall', specialty:'ayurveda' },
  { id:'headache', label:'Headache', specialty:'allopathy' },
  { id:'heartburn', label:'Heartburn', specialty:'allopathy' },
  { id:'high_bp', label:'High blood pressure', specialty:'allopathy' },
  { id:'high_cholesterol', label:'High cholesterol', specialty:'allopathy' },
  { id:'hives', label:'Hives / Urticaria', specialty:'homeopathy' },
  { id:'indigestion', label:'Indigestion', specialty:'ayurveda' },
  { id:'insomnia', label:'Insomnia', specialty:'homeopathy' },
  { id:'irregular_heartbeat', label:'Irregular heartbeat', specialty:'allopathy' },
  { id:'irregular_periods', label:'Irregular periods', specialty:'allopathy' },
  { id:'itching', label:'Itching', specialty:'homeopathy' },
  { id:'jaundice', label:'Jaundice', specialty:'allopathy' },
  { id:'joint_pain', label:'Joint pain', specialty:'ayurveda' },
  { id:'kidney_stones', label:'Kidney stones', specialty:'allopathy' },
  { id:'knee_pain', label:'Knee pain', specialty:'ayurveda' },
  { id:'leg_cramps', label:'Leg cramps', specialty:'allopathy' },
  { id:'leg_pain', label:'Leg pain', specialty:'allopathy' },
  { id:'leg_swelling', label:'Leg swelling', specialty:'allopathy' },
  { id:'loose_motion', label:'Loose motion', specialty:'allopathy' },
  { id:'low_bp', label:'Low blood pressure', specialty:'allopathy' },
  { id:'low_libido', label:'Low libido', specialty:'ayurveda' },
  { id:'memory_loss', label:'Memory loss', specialty:'allopathy' },
  { id:'menstrual_cramps', label:'Menstrual cramps', specialty:'allopathy' },
  { id:'migraine', label:'Migraine', specialty:'allopathy' },
  { id:'mood_swings', label:'Mood swings', specialty:'homeopathy' },
  { id:'mouth_ulcers', label:'Mouth ulcers', specialty:'allopathy' },
  { id:'muscle_cramps', label:'Muscle cramps', specialty:'allopathy' },
  { id:'muscle_weakness', label:'Muscle weakness', specialty:'allopathy' },
  { id:'nausea', label:'Nausea', specialty:'allopathy' },
  { id:'neck_pain', label:'Neck pain', specialty:'allopathy' },
  { id:'night_sweats', label:'Night sweats', specialty:'allopathy' },
  { id:'numbness', label:'Numbness / Tingling', specialty:'allopathy' },
  { id:'obesity', label:'Obesity / Overweight', specialty:'naturopathy' },
  { id:'oily_skin', label:'Oily skin', specialty:'ayurveda' },
  { id:'palpitations', label:'Palpitations', specialty:'allopathy' },
  { id:'panic_attacks', label:'Panic attacks', specialty:'homeopathy' },
  { id:'pid', label:'Pelvic pain', specialty:'allopathy' },
  { id:'psoriasis', label:'Psoriasis', specialty:'homeopathy' },
  { id:'rash', label:'Rash / Skin redness', specialty:'allopathy' },
  { id:'runny_nose', label:'Runny nose', specialty:'allopathy' },
  { id:'scalp_itching', label:'Scalp itching', specialty:'ayurveda' },
  { id:'sexual_weakness', label:'Sexual weakness', specialty:'unani' },
  { id:'shortness_of_breath', label:'Shortness of breath', specialty:'allopathy' },
  { id:'shoulder_pain', label:'Shoulder pain', specialty:'allopathy' },
  { id:'sinus', label:'Sinus / Sinusitis', specialty:'allopathy' },
  { id:'skin_dryness', label:'Skin dryness', specialty:'ayurveda' },
  { id:'skin_infection', label:'Skin infection', specialty:'allopathy' },
  { id:'sleep_apnea', label:'Sleep apnea', specialty:'allopathy' },
  { id:'sneezing', label:'Sneezing', specialty:'allopathy' },
  { id:'sore_throat', label:'Sore throat', specialty:'allopathy' },
  { id:'stomach_ulcer', label:'Stomach ulcer', specialty:'allopathy' },
  { id:'stress', label:'Stress', specialty:'yoga' },
  { id:'swollen_glands', label:'Swollen glands', specialty:'allopathy' },
  { id:'thyroid', label:'Thyroid issues', specialty:'allopathy' },
  { id:'toothache', label:'Toothache', specialty:'allopathy' },
  { id:'tremors', label:'Tremors / Shaking', specialty:'allopathy' },
  { id:'urinary_infection', label:'Urinary infection', specialty:'allopathy' },
  { id:'vomiting', label:'Vomiting', specialty:'allopathy' },
  { id:'weakness', label:'Weakness / Lethargy', specialty:'ayurveda' },
  { id:'weight_gain', label:'Weight gain', specialty:'naturopathy' },
  { id:'weight_loss', label:'Unexplained weight loss', specialty:'allopathy' },
  { id:'wheezing', label:'Wheezing', specialty:'allopathy' },
  { id:'wrist_pain', label:'Wrist pain', specialty:'allopathy' },
].sort((a, b) => a.label.localeCompare(b.label));

const SPECIALTY_LABELS: Record<string, string> = {
  allopathy:'Allopathy', homeopathy:'Homeopathy', ayurveda:'Ayurveda',
  yoga:'Yoga Therapy', naturopathy:'Naturopathy', unani:'Unani',
};

const SPECIALTY_COLORS: Record<string, string> = {
  allopathy:'#2563EB', homeopathy:'#7C3AED', ayurveda:'#0A7B6C',
  yoga:'#EA580C', naturopathy:'#16A34A', unani:'#0369A1',
};

const PAGE_SIZE = 20;

export default function SymptomSearch({ onBook }: { onBook: (doctorId: string) => void }) {
  const [selected, setSelected] = useState<typeof ALL_SYMPTOMS[0][]>([]);
  const [step, setStep] = useState<'symptoms'|'results'>('symptoms');
  const [searchText, setSearchText] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [page, setPage] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = ALL_SYMPTOMS.filter(s =>
    !searchText || s.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const suggestedSpecialty = selected.length > 0
    ? selected[0].specialty
    : 'allopathy';

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['symptom-doctors', suggestedSpecialty],
    queryFn: async () => {
      const { data } = await api.get('/doctors', { params: { medical_system: suggestedSpecialty, limit: 6 } });
      return data.data || [];
    },
    enabled: step === 'results',
  });

  const toggleSymptom = (s: typeof ALL_SYMPTOMS[0]) => {
    setSelected(prev =>
      prev.find(p => p.id === s.id)
        ? prev.filter(p => p.id !== s.id)
        : [...prev, s]
    );
  };

  const addCustomSymptom = () => {
    if (!customSymptom.trim()) return;
    const custom = { id: `custom_${Date.now()}`, label: customSymptom.trim(), specialty: 'allopathy' };
    setSelected(prev => [...prev, custom]);
    setCustomSymptom('');
    setShowCustom(false);
  };

  useEffect(() => { setPage(0); }, [searchText]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      {step === 'symptoms' ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              What are your symptoms?
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Search and select your symptoms — we'll recommend the right specialist
            </p>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-muted)' }}>🔍</span>
            <input
              ref={searchRef}
              placeholder="Search symptoms... (e.g. headache, fever, back pain)"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 44px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}
            />
            {searchText && (
              <button onClick={() => setSearchText('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>✕</button>
            )}
          </div>

          {/* Results count */}
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            Showing {paged.length} of {filtered.length} symptoms
            {searchText && ` matching "${searchText}"`}
          </div>

          {/* Symptom list */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
            {paged.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No matching symptoms</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Can't find your symptom? Add it manually below.</div>
                <button onClick={() => { setShowCustom(true); setCustomSymptom(searchText); }} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Add "{searchText}" as custom symptom
                </button>
              </div>
            ) : (
              paged.map((s, i) => {
                const isSelected = !!selected.find(p => p.id === s.id);
                const color = SPECIALTY_COLORS[s.specialty];
                return (
                  <div key={s.id} onClick={() => toggleSymptom(s)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < paged.length-1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    background: isSelected ? `${color}08` : '#fff',
                    transition: 'background 0.1s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, border: `2px solid ${isSelected ? color : 'var(--border)'}`,
                      background: isSelected ? color : '#fff', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: isSelected ? color : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400 }}>
                        {s.label}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--r-full)', background: `${color}15`, color, fontWeight: 500 }}>
                      {SPECIALTY_LABELS[s.specialty]}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13 }}>
                ← Prev
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page+1} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page >= totalPages-1} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', cursor: page >= totalPages-1 ? 'not-allowed' : 'pointer', color: page >= totalPages-1 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13 }}>
                Next →
              </button>
            </div>
          )}

          {/* Custom symptom */}
          <div style={{ marginBottom: 16 }}>
            {!showCustom ? (
              <button onClick={() => setShowCustom(true)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', border: '1.5px dashed var(--border)', background: '#fff', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
                + Can't find your symptom? Add it manually
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, padding: 14, background: '#fff', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--primary)' }}>
                <input
                  autoFocus
                  placeholder="Describe your symptom..."
                  value={customSymptom}
                  onChange={e => setCustomSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSymptom()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                />
                <button onClick={addCustomSymptom} disabled={!customSymptom.trim()} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: customSymptom.trim() ? 'pointer' : 'not-allowed' }}>
                  Add
                </button>
                <button onClick={() => { setShowCustom(false); setCustomSymptom(''); }} style={{ padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Selected symptoms */}
          {selected.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                Selected symptoms ({selected.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {selected.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--r-full)', background: `${SPECIALTY_COLORS[s.specialty]}15`, border: `1px solid ${SPECIALTY_COLORS[s.specialty]}30`, fontSize: 12, color: SPECIALTY_COLORS[s.specialty] }}>
                    {s.label}
                    <span onClick={() => setSelected(prev => prev.filter(p => p.id !== s.id))} style={{ cursor: 'pointer', marginLeft: 2, fontWeight: 700 }}>✕</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Recommended specialist: <strong style={{ color: SPECIALTY_COLORS[suggestedSpecialty], textTransform: 'capitalize' }}>{SPECIALTY_LABELS[suggestedSpecialty]}</strong>
              </div>
              <button onClick={() => setStep('results')} style={{ width: '100%', padding: '11px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Find {SPECIALTY_LABELS[suggestedSpecialty]} doctors →
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Results */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setStep('symptoms')} style={{ padding: '7px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>← Back</button>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>Recommended doctors</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                <span style={{ color: SPECIALTY_COLORS[suggestedSpecialty], fontWeight: 600, textTransform: 'capitalize' }}>{SPECIALTY_LABELS[suggestedSpecialty]}</span> specialists for your symptoms
              </p>
            </div>
          </div>

          {/* Selected symptoms chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {selected.map(s => (
              <div key={s.id} style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: `${SPECIALTY_COLORS[s.specialty]}12`, border: `1px solid ${SPECIALTY_COLORS[s.specialty]}25`, fontSize: 12, color: SPECIALTY_COLORS[s.specialty] }}>
                {s.label}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Finding the best doctors for you...</div>
          ) : !doctors?.length ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No doctors available</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Try different symptoms or browse all doctors</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {doctors.map((doc: any) => {
                const color = SPECIALTY_COLORS[doc.medical_system] || 'var(--primary)';
                const initials = doc.full_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'D';
                const rating = doc.avg_rating ? parseFloat(String(doc.avg_rating)).toFixed(1) : null;
                const fees = Array.isArray(doc.fees) ? doc.fees : [];
                const minFee = fees.length > 0 ? Math.min(...fees.filter((f: any) => f?.fee).map((f: any) => f.fee)) : null;

                return (
                  <div key={doc.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ height: 3, background: color }}/>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.full_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.degree}{doc.specialization ? ` · ${doc.specialization}` : ''}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                        {rating && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⭐ {rating}</span>}
                        {doc.experience_years > 0 && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>💼 {doc.experience_years} yrs</span>}
                        {doc.city && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📍 {doc.city}</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          {minFee && <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>₹{(minFee/100).toFixed(0)}</span>}
                          {minFee && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>onwards</span>}
                        </div>
                        <button onClick={() => onBook(doc.id)} style={{ padding: '7px 16px', borderRadius: 'var(--r-md)', border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
