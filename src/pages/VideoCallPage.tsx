import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store';
import { api } from '../api';
import { io } from 'socket.io-client';
import { TokenStorage } from '../api';

export default function VideoCallPage({ appointmentId, doctorName, patientName, onClose }: {
  appointmentId: string;
  doctorName?: string;
  patientName?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [status, setStatus]         = useState<'connecting'|'waiting'|'connected'|'error'>('connecting');
  const [error, setError]           = useState('');
  const [isMuted, setIsMuted]       = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat]     = useState(false);
  const [messages, setMessages]     = useState<any[]>([]);
  const [chatInput, setChatInput]   = useState('');

  const localRef   = useRef<HTMLVideoElement>(null);
  const remoteRef  = useRef<HTMLVideoElement>(null);
  const pcRef      = useRef<RTCPeerConnection | null>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const socketRef  = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>('');
  const pulledRef  = useRef(false);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const roomId     = `video-${appointmentId.slice(0, 12)}`;

  useEffect(() => {
    const token = TokenStorage.get('access_token');
    const s = io('https://wellconsult-backend.onrender.com', {
      auth: { token }, transports: ['websocket', 'polling'],
    });
    socketRef.current = s;

    s.on('message_history', (msgs: any[]) => setMessages(msgs));
    s.on('new_message', (msg: any) => setMessages(prev => [...prev, msg]));
    s.on('peer_joined_video', (data: { sessionId: string; userId: string }) => {
      if (data.userId !== user?.id && data.sessionId) pullRemoteTracks(data.sessionId);
    });
    s.on('video_room_peers', (peers: { sessionId: string; userId: string }[]) => {
      const other = peers.find(p => p.userId !== user?.id);
      if (other?.sessionId) pullRemoteTracks(other.sessionId);
      else setStatus('waiting');
    });

    startCall(s);
    return () => { cleanup(); s.disconnect(); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach(t => { t.stop(); t.enabled = false; });
    streamRef.current = null;
    pcRef.current?.close(); pcRef.current = null;
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  };

  const pullRemoteTracks = async (remoteSessionId: string, attempt = 0) => {
    if (!sessionRef.current || attempt > 8 || pulledRef.current) return;
    const pc = pcRef.current;
    if (!pc) return;

    try {
      const { data: pullResp } = await api.post(`/video/session/${appointmentId}/pull`, {
        sessionId: sessionRef.current, remoteSessionId,
      });
      const remoteTracks = (pullResp.data || pullResp).remoteTracks || [];
      if (remoteTracks.length === 0) {
        setTimeout(() => pullRemoteTracks(remoteSessionId, attempt + 1), 2000);
        return;
      }

      pulledRef.current = true;

      // Change existing sendonly transceivers to sendrecv to receive remote tracks
      // This avoids creating new mids
      const transceivers = pc.getTransceivers();
      for (const t of transceivers) {
        if (t.direction === 'sendonly') {
          t.direction = 'sendrecv';
        }
      }

      // Renegotiate with updated directions
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const { data: pullResultResp } = await api.post(`/video/session/${appointmentId}/tracks/pull`, {
        sessionId: sessionRef.current,
        sessionDescription: { type: offer.type, sdp: offer.sdp },
        tracks: remoteTracks.map((t: any) => ({
          location: 'remote', sessionId: remoteSessionId, trackName: t.trackName,
        })),
      });

      const result = pullResultResp.data || pullResultResp;
      if (result.errorCode) {
        pulledRef.current = false;
        setTimeout(() => pullRemoteTracks(remoteSessionId, attempt + 1), 2000);
        return;
      }

      if (result.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(result.sessionDescription));
      }

      if (result.requiresImmediateRenegotiation) {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await api.put(`/video/session/${appointmentId}/renegotiate`, {
          sessionId: sessionRef.current,
          sessionDescription: { type: answer.type, sdp: answer.sdp },
        });
      }
    } catch (err: any) {
      console.error('[Video] Pull error:', err.message);
      pulledRef.current = false;
      setTimeout(() => pullRemoteTracks(remoteSessionId, attempt + 1), 3000);
    }
  };

  const startCall = async (s: any) => {
    setStatus('connecting'); setError('');
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (permErr: any) {
        setError(permErr.name === 'NotAllowedError' ? 'PERMISSION_DENIED' : permErr.message);
        setStatus('error'); return;
      }
      streamRef.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
        bundlePolicy: 'max-bundle',
      });
      pcRef.current = pc;

      // Handle incoming remote tracks on SAME PC
      pc.ontrack = (e) => {
        console.log('[Video] ontrack:', e.track.kind, 'readyState:', e.track.readyState);
        remoteStreamRef.current.addTrack(e.track);
        if (remoteRef.current) {
          remoteRef.current.srcObject = remoteStreamRef.current;
          remoteRef.current.play().catch(() => {});
        }
        setStatus('connected');
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[Video] ICE:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') pc.restartIce();
      };

      pc.onconnectionstatechange = () => {
        console.log('[Video] connection:', pc.connectionState);
        if (pc.connectionState === 'failed') pc.restartIce();
      };

      // Add sendonly transceivers
      const sendTransceivers: RTCRtpTransceiver[] = [];
      for (const track of stream.getTracks()) {
        sendTransceivers.push(pc.addTransceiver(track, { direction: 'sendonly' }));
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sendTracks = sendTransceivers
        .filter(t => t.mid !== null)
        .map(t => ({ location: 'local', mid: t.mid, trackName: t.sender.track?.kind }));

      const { data: sessionResp } = await api.post(`/video/session/${appointmentId}`, {
        sdp: offer.sdp, type: offer.type, tracks: sendTracks,
      });

      const sessionData = sessionResp.data || sessionResp;
      sessionRef.current = sessionData.session_id || sessionData.sessionId;
      console.log('[Video] Session:', sessionRef.current);

      if (sessionData.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(sessionData.sessionDescription));
      }

      const joinRoom = () => {
        s.emit('join_video_room', { roomId, sessionId: sessionRef.current, userId: user?.id });
        s.emit('join_room', { appointmentId });
      };
      if (s.connected) joinRoom(); else s.once('connect', joinRoom);

    } catch (err: any) {
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
      <div style={{ padding:'10px 20px', background:'#16213e', display:'flex', alignItems:'center', gap:14, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => { cleanup(); setTimeout(onClose, 100); }} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>📹 Video Consultation</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 }}>
            {status==='connecting' ? 'Connecting...' : status==='waiting' ? `Waiting for ${otherName} to join...` : status==='connected' ? `with ${otherName}` : 'Connection failed'}
          </div>
        </div>
        <div style={{ width:8, height:8, borderRadius:'50%', background: status==='connected'?'#22C55E':status==='error'?'#EF4444':'#F59E0B' }}/>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)' }}>🔒 Cloudflare Realtime</div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        <div style={{ flex:1, minWidth:0, position:'relative', background:'#0a0a14' }}>
          <video ref={remoteRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }}/>

          <div style={{ position:'absolute', bottom:16, right:16, width:160, height:120, borderRadius:12, overflow:'hidden', border:'2px solid rgba(255,255,255,0.2)', background:'#222' }}>
            <video ref={localRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' }}/>
            {isVideoOff && <div style={{ position:'absolute', inset:0, background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👤</div>}
            <div style={{ position:'absolute', bottom:4, left:0, right:0, textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.7)' }}>You</div>
          </div>

          {(status==='connecting' || status==='waiting') && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
              <div style={{ fontSize:48 }}>{status==='waiting' ? '⏳' : '📹'}</div>
              <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>
                {status==='waiting' ? `Waiting for ${otherName} to join...` : 'Connecting...'}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#0A7B6C', animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
              </div>
            </div>
          )}

          {status==='error' && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
              {error === 'PERMISSION_DENIED' ? (
                <>
                  <div style={{ fontSize:56 }}>📷</div>
                  <div style={{ fontSize:18, color:'#fff', fontWeight:700 }}>Camera & Microphone Access Required</div>
                  <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'16px 20px', maxWidth:420 }}>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:2 }}>
                      1. Click 🔒 in address bar<br/>
                      2. Set Camera and Microphone to Allow<br/>
                      3. Click Retry
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:48 }}>❌</div>
                  <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>Could not connect</div>
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', textAlign:'center', maxWidth:360 }}>{error}</div>
                </>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => startCall(socketRef.current)} style={{ padding:'10px 20px', borderRadius:8, background:'#0A7B6C', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>🔄 Retry</button>
                <button onClick={() => { cleanup(); setTimeout(onClose, 100); }} style={{ padding:'10px 20px', borderRadius:8, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', fontSize:14, cursor:'pointer' }}>Leave</button>
              </div>
            </div>
          )}
        </div>

        {showChat && (
          <div style={{ width:280, flexShrink:0, background:'#16213e', borderLeft:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>💬 Chat</span>
              <button onClick={() => setShowChat(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
              {messages.length === 0 && <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:12, marginTop:20 }}>No messages yet</div>}
              {messages.map((m: any) => {
                const own = m.sender_id === user?.id;
                return (
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>{m.sender_name}</div>
                    <div style={{ padding:'7px 11px', borderRadius:12, background: own ? '#0A7B6C' : 'rgba(255,255,255,0.12)', color:'#fff', fontSize:13, maxWidth:200, wordBreak:'break-word' as any }}>{m.message}</div>
                  </div>
                );
              })}
              <div ref={chatEndRef}/>
            </div>
            <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendChat()} placeholder="Type a message..." style={{ flex:1, padding:'8px 10px', borderRadius:8, border:'1px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, outline:'none' }}/>
              <button onClick={sendChat} style={{ width:34, height:34, borderRadius:'50%', border:'none', background:'#0A7B6C', color:'#fff', cursor:'pointer', fontSize:14 }}>➤</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:'14px 20px', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexShrink:0 }}>
        <button onClick={() => setShowChat(s => !s)} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, background: showChat ? '#0A7B6C' : 'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>💬</button>
        <button onClick={toggleMute} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:20, background:isMuted?'#EF4444':'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>{isMuted?'🔇':'🎤'}</button>
        <button onClick={toggleVideo} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:20, background:isVideoOff?'#EF4444':'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>{isVideoOff?'📵':'📹'}</button>
        <button onClick={() => { cleanup(); setTimeout(onClose, 100); }} style={{ width:56, height:56, borderRadius:'50%', border:'none', cursor:'pointer', background:'#EF4444', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.4)' }}>📵</button>
      </div>

      <style>{"@keyframes pulse { 0%,60%,100% { opacity:0.3; transform:scale(1); } 30% { opacity:1; transform:scale(1.3); } }"}</style>
    </div>
  );
}
