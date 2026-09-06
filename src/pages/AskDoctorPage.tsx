import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';
import { useNavigate } from 'react-router-dom';

const SPECIALTIES = [
  { id:'allopathy',   label:'Allopathy',    icon:'⚕️' },
  { id:'homeopathy',  label:'Homeopathy',   icon:'💊' },
  { id:'ayurveda',    label:'Ayurveda',     icon:'🌿' },
  { id:'yoga',        label:'Yoga Therapy', icon:'🧘' },
  { id:'naturopathy', label:'Naturopathy',  icon:'🌱' },
  { id:'unani',       label:'Unani',        icon:'⚗️' },
];

export default function AskDoctorPage() {
  const { data: confirmedAppointments, isLoading: checkingAppts } = useQuery({
    queryKey: ['confirmed-appointments-check'],
    queryFn: async () => {
      const { data } = await api.get('/patients/me/appointments');
      return (data.data || []).filter((a: any) => a.status === 'confirmed' || a.status === 'completed');
    },
  });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [view, setView] = useState<'list'|'ask'>('list');
  const [specialty, setSpecialty] = useState('allopathy');
  const [question, setQuestion] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['my-questions'],
    queryFn: async () => {
      const { data } = await api.get('/consultations/questions');
      return data.data as any[] || [];
    },
  });

  const handleSubmit = async () => {
    if (!question.trim()) { alert('Please describe your health concern.'); return; }
    if (question.trim().length < 20) { alert('Please provide more details (at least 20 characters).'); return; }
    setSubmitting(true);
    try {
      await api.post('/consultations/questions', {
        specialty,
        question: question.trim(),
        patient_age: age ? parseInt(age) : undefined,
        patient_gender: gender || undefined,
      });
      setSuccess(true);
      setQuestion('');
      setAge('');
      setGender('');
      qc.invalidateQueries({ queryKey: ['my-questions'] });
      setTimeout(() => { setSuccess(false); setView('list'); }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Awaiting doctor' },
    answered:  { bg: '#ECFDF5', color: '#065F46', label: 'Answered' },
    closed:    { bg: '#F9FAFB', color: '#374151', label: 'Closed' },
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Ask a Doctor
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Get medical guidance from verified practitioners
          </p>
        </div>
        {view === 'list' && (
          <button onClick={() => setView('ask')} style={{
            padding: '10px 20px', borderRadius: 'var(--r-md)', background: 'var(--primary)',
            color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            + Ask a question
          </button>
        )}
      </div>

      {/* How it works banner */}
      {view === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '✍️', title: 'Describe your concern', desc: 'Write your health question in detail' },
            { icon: '🩺', title: 'Doctor reviews',        desc: 'A verified doctor reads and responds' },
            { icon: '💬', title: 'Get guidance',          desc: 'Receive medical advice within 24 hours' },
          ].map(s => (
            <div key={s.title} style={{ padding: 14, borderRadius: 'var(--r-lg)', background: '#fff', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ask form */}
      {view === 'ask' && (
        <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
            Describe your health concern
          </h2>

          {success && (
            <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
              ✓ Your question has been submitted! A doctor will respond within 24 hours.
            </div>
          )}

          {/* Specialty */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Which type of doctor do you want to consult?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SPECIALTIES.map(s => (
                <div key={s.id} onClick={() => setSpecialty(s.id)} style={{
                  padding: '6px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer',
                  border: `1.5px solid ${specialty === s.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: specialty === s.id ? 'var(--primary)' : '#fff',
                  color: specialty === s.id ? '#fff' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: specialty === s.id ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {s.icon} {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Patient info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5 }}>Age (optional)</label>
              <input type="number" placeholder="e.g. 35" value={age} onChange={e => setAge(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as any }}/>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5 }}>Gender (optional)</label>
              <select value={gender} onChange={e => setGender(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Question */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>
              Your health concern <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea
              placeholder="Describe your symptoms, how long you've had them, any medications you're taking, and what you'd like guidance on..."
              value={question} onChange={e => setQuestion(e.target.value)} rows={6}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'var(--font-body)', lineHeight: 1.6, boxSizing: 'border-box' as any }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
              {question.length} characters {question.length < 20 && question.length > 0 ? '(minimum 20)' : ''}
            </div>
          </div>

          {/* Tips */}
          <div style={{ padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--primary-light)', marginBottom: 16, fontSize: 12, color: 'var(--primary-dark)', lineHeight: 1.8 }}>
            <strong>Tips for a better response:</strong><br/>
            • Include duration of symptoms<br/>
            • Mention any medications or allergies<br/>
            • Describe pain level and location<br/>
            • Include relevant medical history
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setView('list')} style={{ padding: '10px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || question.length < 20} style={{
              flex: 1, padding: '10px', borderRadius: 'var(--r-md)', border: 'none',
              background: submitting || question.length < 20 ? 'var(--border)' : 'var(--primary)',
              color: submitting || question.length < 20 ? 'var(--text-muted)' : '#fff',
              fontSize: 14, fontWeight: 600, cursor: submitting || question.length < 20 ? 'not-allowed' : 'pointer',
            }}>
              {submitting ? 'Submitting...' : 'Submit question →'}
            </button>
          </div>
        </div>
      )}

      {/* Questions list */}
      {view === 'list' && (
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
          ) : !questions?.length ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No questions yet</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Ask your first question and get guidance from a verified doctor</div>
              <button onClick={() => setView('ask')} style={{ padding: '10px 24px', borderRadius: 'var(--r-md)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Ask a question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map((q: any) => {
                const ss = STATUS_STYLE[q.status] || STATUS_STYLE.pending;
                return (
                  <div key={q.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 'var(--r-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                            {q.specialty}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                          {q.question.length > 150 ? q.question.slice(0, 150) + '...' : q.question}
                        </p>
                      </div>
                      <div style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {ss.label}
                      </div>
                    </div>

                    {q.answer && (
                      <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 'var(--r-md)', background: '#ECFDF5', borderLeft: '3px solid var(--primary)' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                          🩺 Doctor's response {q.doctor_name ? `— ${q.doctor_name}` : ''}
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                          {q.answer}
                        </p>
                      </div>
                    )}
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
