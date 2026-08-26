import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

export default function DoctorQuestionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['doctor-questions'],
    queryFn: async () => {
      const { data } = await api.get('/consultations/questions/pending');
      return data.data as any[] || [];
    },
    refetchInterval: 30000, // refresh every 30s
  });

  const handleAnswer = async () => {
    if (!answer.trim() || answer.trim().length < 10) {
      alert('Please provide a detailed answer (minimum 10 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/consultations/questions/${selected.id}/answer`, {
        answer: answer.trim(),
      });
      qc.invalidateQueries({ queryKey: ['doctor-questions'] });
      setSelected(null);
      setAnswer('');
      alert('Answer submitted successfully! The patient has been notified.');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const TIPS = [
    'Provide evidence-based guidance',
    'Recommend follow-up if needed',
    'Mention any red flags to watch for',
    'Suggest when to seek in-person care',
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Patient Questions
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Answer questions from patients in your specialty
        </p>
      </div>

      {selected ? (
        /* Answer view */
        <div>
          <button onClick={() => { setSelected(null); setAnswer(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)', marginBottom: 20 }}>
            ← Back to questions
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
            {/* Question card */}
            <div>
              <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                    {selected.specialty}
                  </span>
                  {selected.patient_age && (
                    <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 12 }}>
                      Age: {selected.patient_age}
                    </span>
                  )}
                  {selected.patient_gender && (
                    <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 12, textTransform: 'capitalize' }}>
                      {selected.patient_gender}
                    </span>
                  )}
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 12 }}>
                    {new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Patient's concern</h2>
                <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.8, margin: 0 }}>
                  {selected.question}
                </p>
              </div>

              {/* Answer textarea */}
              <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Your response
                </h2>
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Provide your medical guidance here. Be clear, empathetic and thorough. Include any recommendations for further care if needed..."
                  rows={8}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
                    fontSize: 14, outline: 'none', resize: 'vertical' as any,
                    fontFamily: 'var(--font-body)', lineHeight: 1.7,
                    boxSizing: 'border-box' as any, marginBottom: 8,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {answer.length} characters {answer.length < 10 && answer.length > 0 ? '(minimum 10)' : ''}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    This response will be visible to the patient
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setSelected(null); setAnswer(''); }} style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                  <button onClick={handleAnswer} disabled={submitting || answer.trim().length < 10} style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--r-md)', border: 'none',
                    background: submitting || answer.trim().length < 10 ? 'var(--border)' : 'var(--primary)',
                    color: submitting || answer.trim().length < 10 ? 'var(--text-muted)' : '#fff',
                    fontSize: 14, fontWeight: 600,
                    cursor: submitting || answer.trim().length < 10 ? 'not-allowed' : 'pointer',
                  }}>
                    {submitting ? 'Submitting...' : 'Submit response →'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tips sidebar */}
            <div>
              <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--r-lg)', padding: 16, border: '1px solid #A7D9D3', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 10 }}>
                  💡 Response guidelines
                </div>
                {TIPS.map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: 'var(--primary-dark)', lineHeight: 1.5 }}>
                    <span>✓</span> {tip}
                  </div>
                ))}
              </div>

              <div style={{ background: '#FEF3C7', borderRadius: 'var(--r-lg)', padding: 16, border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>
                  ⚠️ Important
                </div>
                <p style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6, margin: 0 }}>
                  Your response is medical guidance, not a diagnosis. Always recommend in-person consultation for serious conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Questions list */
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading questions...</div>
          ) : !questions?.length ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>All caught up!</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                No pending questions in your specialty right now.<br/>Check back in a few minutes.
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {questions.length} question{questions.length > 1 ? 's' : ''} awaiting your response
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q: any) => (
                  <div key={q.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 18, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => { setSelected(q); setAnswer(''); }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                            {q.specialty}
                          </span>
                          {q.patient_age && (
                            <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11 }}>
                              Age {q.patient_age}
                            </span>
                          )}
                          {q.patient_gender && (
                            <span style={{ padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>
                              {q.patient_gender}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                          {q.question.length > 200 ? q.question.slice(0, 200) + '...' : q.question}
                        </p>
                      </div>
                      <button style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                        Answer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
