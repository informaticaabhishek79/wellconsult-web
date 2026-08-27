import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

interface VideoSession {
  room_url: string;
  token: string;
  user_name: string;
  is_doctor: boolean;
}

export default function VideoCallPage({ appointmentId, doctorName, patientName, onClose }: {
  appointmentId: string;
  doctorName?: string;
  patientName?: string;
  onClose: () => void;
}) {
  const [session, setSession] = useState<VideoSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    api.post(`/video/room/${appointmentId}`)
      .then(res => {
        setSession(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error?.message || 'Failed to start video call.');
        setLoading(false);
      });
  }, [appointmentId]);

  const callUrl = session ? `${session.room_url}?t=${session.token}` : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a2e', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', background: '#16213e', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
            📹 Video Consultation
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            {doctorName ? `with ${doctorName}` : patientName ? `with ${patientName}` : 'WellConsult'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }}/>
          <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>Secure</span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '4px 10px', borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,0.05)' }}>
          🔒 End-to-end encrypted
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(10,123,108,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📹</div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>Setting up your consultation...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Creating a secure room</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0A7B6C', animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ fontSize: 48 }}>❌</div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>Could not start video call</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 400 }}>{error}</div>
            <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 'var(--r-md)', background: 'var(--primary)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>
              Go back
            </button>
          </div>
        )}

        {session && (
          <iframe
            ref={iframeRef}
            src={callUrl}
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Video consultation"
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
