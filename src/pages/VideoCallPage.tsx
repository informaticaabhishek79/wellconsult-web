import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { io } from 'socket.io-client';
import { TokenStorage } from '../api';
import { useAuth } from '../store';

const CF_APP_ID = 'b5c628780338d61f23ed3e8f952e44b8';
const CF_TOKEN  = '31d7096a8a858ca1861d0907c0199e822906fc5d89fe650b6c85827a075e2d31';
const CF_BASE   = `https://rtc.live.cloudflare.com/v1/apps/${CF_APP_ID}`;

async function cfFetch(method: string, path: string, body?: any) {
  const res = await fetch(`${CF_BASE}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${CF_TOKEN}`, 'Content-Type': 'application/json' },
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
  const [error, setError]   = useState('');
  const [isMuted, setIsMuted]       = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const [messages, setMessages]     = useState<any[]>([]);
  const [chatInput, setChatInput]   = useState('');
  const socketRef = useRef<any>(null);

  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionId = useRef<string>('');

  useEffect(() => {
    startCall();
    // Init chat socket
    const token = TokenStorage.get('access_token');
    if (token) {
      const s = io('https://wellconsult-backend.onrender.com', {
        auth: { token }, transports: ['websocket', 'polling'],
      });
      s.on('connect', () => s.emit('join_room', { appointmentId }));
      s.on('message_history', (msgs: any[]) => setMessages(msgs));
      s.on('new_message', (msg: any) => setMessages(prev => [...prev, msg]));
      socketRef.current = s;
    }
    return () => { cleanup(); socketRef.current?.disconnect(); };
  }, []);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
  };

  const startCall = async () => {
    setStatus('connecting'); setError('');
    try {
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
        bundlePolicy: 'max-bundle',
      });
      pcRef.current = pc;

      // 3. Add local tracks
      stream.getTracks().forEach(t => pc.addTransceiver(t, { direction: 'sendonly' }));

      // 4. Add remote transceivers to receive tracks
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // 5. Handle remote tracks
      pc.ontrack = (e) => {
        if (remoteRef.current && e.streams[0]) {
          remoteRef.current.srcObject = e.streams[0];
          setStatus('connected');
        }
      };

      // 6. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 7. Create Cloudflare session (no body needed)
      const sessionData = await cfFetch('POST', '/sessions/new');
      sessionId.current = sessionData.sessionId;

      // 8. Push tracks to Cloudflare with SDP offer
      const tracksResp = await cfFetch('POST', `/sessions/${sessionData.sessionId}/tracks/new`, {
        sessionDescription: {
          type: offer.type,
          sdp: offer.sdp,
        },
        tracks: stream.getTracks().map(t => ({
          location: 'local',
          trackName: t.id,
        })),
      });

      // 9. Set remote SDP answer from Cloudflare
      if (tracksResp.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(tracksResp.sessionDescription));
      }

      // 10. ICE candidates
      pc.onicecandidate = () => {};
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('connected');
        }
      };

      // Set connected after a short delay if remote track doesn't arrive
      setTimeout(() => { if (status !== 'error') setStatus('connected'); }, 3000);

    } catch (err: any) {
      console.error('Video error:', err);
      setError(err.message || 'Failed to start video call');
      setStatus('error');
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { appointmentId, message: chatInput.trim() });
    setChatInput('');
  };

  const toggleMute = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsMuted(!t.enabled); }
  };

  const toggleVideo = () => {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setIsVideoOff(!t.enabled); }
  };

  const otherName = doctorName || patientName || 'Participant';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f0f1a', fontFamily:'var(--font-body)' }}>
      {/* Header */}
      <div style={{ padding:'10px 20px', background:'#16213e', display:'flex', alignItems:'center', gap:14, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>📹 Video Consultation</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 }}>
            {status==='connecting' ? 'Connecting...' : status==='connected' ? `with ${otherName}` : 'Connection failed'}
          </div>
        </div>
        <div style={{ width:8, height:8, borderRadius:'50%', background: status==='connected'?'#22C55E':status==='error'?'#EF4444':'#F59E0B' }}/>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)' }}>🔒 Cloudflare Realtime</div>
      </div>

      {/* Video area */}
      <div style={{ flex:1, position:'relative', background:'#0a0a14', overflow:'hidden' }}>
        <video ref={remoteRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }}/>

        {/* Local PiP */}
        <div style={{ position:'absolute', bottom:80, right:16, width:160, height:120, borderRadius:12, overflow:'hidden', border:'2px solid rgba(255,255,255,0.2)', background:'#222', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
          <video ref={localRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }}/>
          {isVideoOff && (
            <div style={{ position:'absolute', inset:0, background:'#333', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'#555', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👤</div>
            </div>
          )}
          <div style={{ position:'absolute', bottom:4, left:0, right:0, textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.7)' }}>You</div>
        </div>

        {/* Connecting overlay */}
        {status==='connecting' && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
            <div style={{ fontSize:48 }}>📹</div>
            <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>Connecting to {otherName}...</div>
            <div style={{ display:'flex', gap:6 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#0A7B6C', animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {status==='error' && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
            <div style={{ fontSize:48 }}>❌</div>
            <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>Could not connect</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', textAlign:'center', maxWidth:360 }}>{error}</div>
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button onClick={startCall} style={{ padding:'10px 20px', borderRadius:8, background:'#0A7B6C', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>Retry</button>
              <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:8, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', fontSize:14, cursor:'pointer' }}>Leave</button>
            </div>
          </div>
        )}
      </div>

      {/* Chat panel */}
      {showChat && (
        <div style={{ position:'absolute', top:0, right:0, width:280, height:'100%', background:'rgba(22,33,62,0.97)', borderLeft:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column', zIndex:10 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>💬 Chat</span>
            <button onClick={() => setShowChat(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
            {messages.map((m: any) => (
              <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: m.sender_id === user?.id ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>{m.sender_name}</div>
                <div style={{ padding:'7px 11px', borderRadius:12, background: m.sender_id === user?.id ? '#0A7B6C' : 'rgba(255,255,255,0.12)', color:'#fff', fontSize:13, maxWidth:200, wordBreak:'break-word' as any }}>
                  {m.message}
                </div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                  {new Date(m.created_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendChat()}
              placeholder="Type a message..." style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}/>
            <button onClick={sendChat} disabled={!chatInput.trim()} style={{ width:34, height:34, borderRadius:'50%', border:'none', background: chatInput.trim() ? '#0A7B6C' : 'rgba(255,255,255,0.1)', color:'#fff', cursor: chatInput.trim() ? 'pointer' : 'default', fontSize:14 }}>➤</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ padding:'14px 20px', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexShrink:0 }}>
        <button onClick={() => setShowChat(s => !s)} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, background: showChat ? '#0A7B6C' : 'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }} title="Toggle chat">
          💬
        </button>
        <button onClick={toggleMute} title={isMuted?'Unmute':'Mute'} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:20, background:isMuted?'#EF4444':'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isMuted?'🔇':'🎤'}
        </button>
        <button onClick={toggleVideo} title={isVideoOff?'Turn on camera':'Turn off camera'} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:20, background:isVideoOff?'#EF4444':'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {isVideoOff?'📵':'📹'}
        </button>
        <button onClick={() => { cleanup(); onClose(); }} title="End call" style={{ width:56, height:56, borderRadius:'50%', border:'none', cursor:'pointer', background:'#EF4444', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.4)' }}>
          📵
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%,60%,100% { opacity:0.3; transform:scale(1); }
          30% { opacity:1; transform:scale(1.3); }
        }
      `}</style>
    </div>
  );
}
