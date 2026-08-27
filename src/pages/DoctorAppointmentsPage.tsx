import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_STYLE: Record<string, {bg:string;color:string}> = {
  booked:    {bg:'#EFF6FF',color:'#1D4ED8'},
  confirmed: {bg:'#ECFDF5',color:'#065F46'},
  ongoing:   {bg:'#FFFBEB',color:'#92400E'},
  completed: {bg:'#F0FDF4',color:'#166534'},
  cancelled: {bg:'#FEF2F2',color:'#991B1B'},
};

export default function DoctorAppointmentsPage({ onChat, onVideo }: { onChat?: (id: string, patientName?: string) => void; onVideo?: (id: string, patientName?: string) => void }) {
  const [tab, setTab] = useState<'upcoming'|'past'>('upcoming');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: async () => {
      const { data } = await api.get('/doctors/me/appointments');
      return data.data as any[] || [];
    },
  });

  const all      = data || [];
  const upcoming = all.filter((a: any) => ['booked','confirmed','ongoing'].includes(a.status));
  const past     = all.filter((a: any) => ['completed','cancelled','no_show'].includes(a.status));
  const list     = tab === 'upcoming' ? upcoming : past;

  const handleConfirm = async (appt: any) => {
    try {
      await api.patch(`/appointments/${appt.id}/confirm`);
      await refetch();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not confirm.');
    }
  };

  const handleComplete = async (appt: any) => {
    if (!window.confirm(`Mark consultation with ${appt.patient_name} as completed?`)) return;
    try {
      await api.patch(`/appointments/${appt.id}/complete`);
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Could not complete.');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
        My Appointments
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
        {(['upcoming','past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none',
            borderBottom: tab===t ? '2px solid var(--primary)' : '2px solid transparent',
            marginBottom: -2, fontSize: 14, fontWeight: tab===t ? 700 : 500,
            color: tab===t ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer',
          }}>
            {t === 'upcoming' ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {tab === 'upcoming' ? 'Patient appointments will appear here.' : 'Completed consultations will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((item: any) => {
            const ss = STATUS_STYLE[item.status] || STATUS_STYLE.booked;
            const isUpcoming = tab === 'upcoming';
            return (
              <div key={item.id} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <div style={{ width: 4, background: item.status === 'booked' ? 'var(--primary)' : item.status === 'confirmed' ? '#16A34A' : 'var(--border)', flexShrink: 0 }}/>
                  <div style={{ flex: 1, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>
                          {item.patient_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || 'P'}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{item.patient_name || 'Patient'}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                            {item.consult_type} consultation
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '3px 10px', borderRadius: 'var(--r-full)', background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                        {item.status}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: isUpcoming ? 12 : 0, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📅 {item.appt_date?.slice(0,10)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🕐 {item.appt_time?.slice(0,5)}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {item.consult_type === 'video' ? '📹' : item.consult_type === 'phone' ? '📞' : '🏥'} {item.consult_type}
                      </span>
                    </div>

                    {isUpcoming && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {item.status === 'booked' && (
                          <button onClick={() => handleConfirm(item)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#16A34A', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            ✓ Confirm
                          </button>
                        )}
                        {onChat && (
                          <button onClick={() => onChat(item.id, item.patient_name)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#2563EB', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            💬 Chat
                          </button>
                        )}
                        {onVideo && (
                          <button onClick={() => onVideo(item.id, item.patient_name)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', background: '#7C3AED', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            📹 Video
                          </button>
                        )}
                        {item.status === 'confirmed' && (
                          <button onClick={() => handleComplete(item)} style={{ padding: '6px 14px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--primary)', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            ✓ Mark complete
                          </button>
                        )}
                      </div>
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
