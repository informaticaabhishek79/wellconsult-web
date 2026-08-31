import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useAuth } from '../store';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const isDoctor = user?.role === 'doctor';
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string,string>>({});

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await api.get(isDoctor ? '/doctors/me/profile' : '/patients/me/profile');
      return data.data;
    },
  });

  const update = useMutation({
    mutationFn: (body: Record<string,string>) => api.put(isDoctor ? '/doctors/me/profile' : '/patients/me/profile', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-profile'] }); setEditing(false); },
  });

  const startEdit = () => {
    setForm({
      bio: profile?.bio || '',
      city: profile?.city || '',
      specialization: profile?.specialization || '',
      gender: profile?.gender || '',
      blood_group: profile?.blood_group || '',
      emergency_contact: profile?.emergency_contact || '',
    });
    setEditing(true);
  };

  const initials = user?.full_name?.split(' ').map(w => w[0]).slice(0,2).join('') || '?';

  const FIELDS = isDoctor
    ? [['bio','Bio','textarea'],['city','City','text'],['specialization','Specialization','text']]
    : [['gender','Gender','text'],['blood_group','Blood group','text'],['emergency_contact','Emergency contact','text']];

  const INFO = isDoctor
    ? [['🎓','Degree', profile?.degree],['🪪','Reg. number', profile?.reg_number],['📍','City', profile?.city],['🌐','Languages', profile?.languages?.join(', ')],['💊','Specialization', profile?.specialization]]
    : [['⚧','Gender', profile?.gender],['🩸','Blood group', profile?.blood_group],['📞','Emergency contact', profile?.emergency_contact]];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>Profile</h1>

      {/* Hero card */}
      <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
        <div style={{ height: 80, background: 'linear-gradient(135deg, var(--primary) 0%, #0E9E8A 100%)' }}/>
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', marginTop: -36, marginBottom: 12 }}>
            {initials}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.full_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                {isDoctor ? `${profile?.medical_system || ''} · ${profile?.profile_status || 'pending'}` : 'Patient'}
              </div>
            </div>
            <button onClick={startEdit} style={{ padding: '7px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text-primary)' }}>
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--primary)', padding: '20px', marginBottom: 16, boxShadow: '0 0 0 3px var(--primary-light)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>Edit profile</div>
          {FIELDS.map(([key, label, type]) => (
            <div key={String(key)} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</label>
              {type === 'textarea' ? (
                <textarea value={form[String(key)] || ''} onChange={e => setForm(f=>({...f,[String(key)]:e.target.value}))} rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}/>
              ) : (
                <input value={form[String(key)] || ''} onChange={e => setForm(f=>({...f,[String(key)]:e.target.value}))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}/>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => update.mutate(form)} style={{ padding: '8px 20px', borderRadius: 'var(--r-md)', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {update.isPending ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          {isDoctor ? 'Practice details' : 'Health information'}
        </div>
        {INFO.map(([icon, label, val]) => val ? (
          <div key={String(label)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 1 }}>{val}</div>
            </div>
          </div>
        ) : null)}
      </div>

      {/* Account */}
      <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '16px 20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Account</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span>📧</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email</div>
            <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{user?.email || '—'}</div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={() => { if (window.confirm('Sign out of Deemona Doctors?')) logout(); }} style={{
        width: '100%', padding: '13px', borderRadius: 'var(--r-md)',
        border: '1.5px solid var(--error)', background: 'var(--error-light)',
        color: 'var(--error)', fontSize: 15, fontWeight: 700, cursor: 'pointer',
      }}>
        🚪 Sign out
      </button>
    </div>
  );
}
