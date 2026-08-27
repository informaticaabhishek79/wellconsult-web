import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../store';

interface SessionInfo {
  session_id: string;
  app_id: string;
  room_id: string;
  user_name: string;
  is_doctor: boolean;
}

const CF_APP_ID = 'b5c628780338d61f23ed3e8f952e44b8';
const CF_APP_TOKEN = '31d7096a8a858ca1861d0907c0199e822906fc5d89fe650b6c85827a075e2d31';
const CF_BASE = `https://rtc.live.cloudflare.com/v1/apps/${CF_APP_ID}`;

async function cfFetch(method: string, path: string, body?: any) {
  const res = await fetch(`${CF_BASE}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${CF_APP_TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export default function VideoCallPage({ appointmentId, doctorName, patientName, onClose }: {
  appointmentId: string;
  doctorName?: string;
  patientName?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [status, setStatus] = useState<'connecting'|'connected'|'error'>('connecting');
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sessionIdRef   = useRef<string>('');

  useEffect(() => {
    startCall();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
  };

  const startCall = async () => {
    try {
      setStatus('connecting');

      // Get session info from backend
      const { data } = await api.post(`/video/session/${appointmentId}`);
      const session: SessionInfo = data.data;
      sessionIdRef.current = session.session_id;

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
        bundlePolicy: 'max-bundle',
      });
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setStatus('connected');
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Push tracks to Cloudflare
      const pushResult = await cfFetch('POST', `/sessions/${session.session_id}/tracks/new`, {
        sessionDescription: { type: offer.type, sdp: offer.sdp },
        tracks: stream.getTracks().map(t => ({
          location: 'local',
          mid: pc.getSenders().find(s => s.track === t)?.getParameters().encodings?.[0]?.rid || null,
          trackName: t.kind,
        })),
      });

      if (pushResult.sessionDescription) {
        await pc.setRemoteDescription(pushResult.sessionDescription);
      }

      // Handle ICE candidates
      pc.onicecandidate = async ({ candidate }) => {
        if (candidate) {
          await cfFetch('PUT', `/sessions/${session.session_id}/renegotiate`, {
            sessionDescription: { type: 'offer', sdp: pc.localDescription?.sdp },
          });
        }
      };

      setStatus('connected');
    } catch (err: any) {
      console.error('Video call error:', err);
      setError(err.message || 'Failed to start video call');
      setStatus('error');
    }
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const endCall = () => {
    cleanup();
    onClose();
  };

  const otherName = doctorName || patientName || 'Participant';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f1a', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', background: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'connected' ? '#22C55E' : status === 'error' ? '#EF4444' : '#F59E0B', flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>📹 Video Consultation</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
            {status === 'connecting' ? 'Connecting...' : status === 'connected' ? `with ${otherName}` : 'Connection failed'}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)' }}>🔒 Cloudflare Realtime</div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', background: '#0a0a14', overflow: 'hidden' }}>
        {/* Remote video (main) */}
        <video ref={remoteVideoRef} autoPlay playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#111' }}/>

        {/* Local video (PiP) */}
        <div style={{ position: 'absolute', bottom: 80, right: 16, width: 160, height: 120, borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', background: '#222', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <video ref={localVideoRef} autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}/>
          {isVideoOff && (
            <div style={{ position: 'absolute', inset: 0, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>You</div>
        </div>

        {/* Connecting overlay */}
        {status === 'connecting' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(10,123,108,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📹</div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>Connecting to {otherName}...</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0A7B6C', animation: `pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ fontSize: 48 }}>❌</div>
            <div style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>Could not connect</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 360 }}>{error}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={startCall} style={{ padding: '10px 20px', borderRadius: 8, background: '#0A7B6C', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Retry</button>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer' }}>Leave</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 20px', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexShrink: 0 }}>
        <button onClick={toggleMute} style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 20,
          background: isMuted ? '#EF4444' : 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button onClick={toggleVideo} style={{
          width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 20,
          background: isVideoOff ? '#EF4444' : 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }} title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}>
          {isVideoOff ? '📵' : '📹'}
        </button>

        <button onClick={endCall} style={{
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: '#EF4444', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
        }} title="End call">
          📵
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
