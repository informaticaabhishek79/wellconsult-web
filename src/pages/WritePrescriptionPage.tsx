import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

interface PrescriptionItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: string;
  instructions: string;
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'As needed', 'At bedtime', 'Before meals', 'After meals'];

const BLANK_ITEM: PrescriptionItem = { medicine_name: '', dosage: '', frequency: '', duration_days: '', instructions: '' };

export default function WritePrescriptionPage({ appointmentId, patientName, onDone }: {
  appointmentId?: string;
  patientName?: string;
  onDone: () => void;
}) {
  const [items, setItems] = useState<PrescriptionItem[]>([{ ...BLANK_ITEM }]);
  const [medSystem, setMedSystem] = useState('allopathy');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addItem = () => setItems(prev => [...prev, { ...BLANK_ITEM }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const handleSave = async () => {
    const validItems = items.filter(item => item.medicine_name.trim());
    if (!validItems.length) { alert('Please add at least one medicine.'); return; }

    setSaving(true);
    try {
      // Get or create consultation for appointment
      let consultationId = null;
      if (appointmentId) {
        try {
          const res = await api.get(`/consultations/${appointmentId}`);
          consultationId = res.data.data?.id;
        } catch {
          try {
            const res2 = await api.post(`/consultations/${appointmentId}/start`, {});
            consultationId = res2.data.data?.id;
          } catch {}
        }
      }

      // If still no consultation, save prescription directly with appointment_id
      await api.post('/prescriptions', {
        appointment_id: appointmentId,
        consultation_id: consultationId || undefined,
        medical_system: medSystem,
        notes: notes.trim() || undefined,
        items: validItems.map(item => ({
          medicine_name: item.medicine_name.trim(),
          dosage: item.dosage.trim() || undefined,
          frequency: item.frequency || undefined,
          duration_days: item.duration_days ? parseInt(item.duration_days) : undefined,
          instructions: item.instructions.trim() || undefined,
        })),
      });

      setSuccess(true);
      setTimeout(() => { setSuccess(false); onDone(); }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save prescription.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', padding: 40, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Prescription Saved!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>The patient can view it in their Prescriptions tab.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onDone} style={{ padding: '7px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>← Back</button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>Write Prescription</h1>
          {patientName && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 3 }}>for {patientName}</p>}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
        {/* Medical system */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Medical system</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['allopathy','homeopathy','ayurveda','yoga','naturopathy','unani'].map(sys => (
              <div key={sys} onClick={() => setMedSystem(sys)} style={{
                padding: '6px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer',
                border: `1.5px solid ${medSystem===sys ? 'var(--primary)' : 'var(--border)'}`,
                background: medSystem===sys ? 'var(--primary)' : '#fff',
                color: medSystem===sys ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: medSystem===sys ? 600 : 400, textTransform: 'capitalize',
              }}>{sys}</div>
            ))}
          </div>
        </div>

        {/* Medicine items */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Medicines</label>
            <button onClick={addItem} style={{ padding: '5px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Add medicine
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medicine {i+1}</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: 16, padding: '2px 6px' }}>✕</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>Medicine name *</label>
                    <input placeholder="e.g. Paracetamol 500mg" value={item.medicine_name} onChange={e => updateItem(i, 'medicine_name', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as any }}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>Dosage</label>
                    <input placeholder="e.g. 500mg" value={item.dosage} onChange={e => updateItem(i, 'dosage', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as any }}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>Frequency</label>
                    <select value={item.frequency} onChange={e => updateItem(i, 'frequency', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}>
                      <option value="">Select</option>
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>Duration (days)</label>
                    <input type="number" placeholder="e.g. 7" value={item.duration_days} onChange={e => updateItem(i, 'duration_days', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as any }}/>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>Instructions</label>
                  <input placeholder="e.g. Take after meals with water" value={item.instructions} onChange={e => updateItem(i, 'instructions', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', fontSize: 13, outline: 'none', boxSizing: 'border-box' as any }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Additional notes (optional)</label>
          <textarea placeholder="Diet restrictions, lifestyle advice, follow-up instructions..." value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', resize: 'vertical' as any, fontFamily: 'var(--font-body)', boxSizing: 'border-box' as any }}/>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onDone} style={{ padding: '11px 20px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 14, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: '11px', borderRadius: 'var(--r-md)', border: 'none',
            background: saving ? 'var(--border)' : 'var(--primary)',
            color: saving ? 'var(--text-muted)' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Saving...' : '💊 Issue prescription'}
          </button>
        </div>
      </div>
    </div>
  );
}
