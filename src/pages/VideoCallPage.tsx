import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store';
import { api, TokenStorage } from '../api';
import { io } from 'socket.io-client';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

export default function VideoCallPage({ appointmentId, doctorName, patientName, onClose }: {
  appointmentId: string;
  doctorName?: string;
  patientName?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [status, setStatus]   = useState<'connecting'|'waiting'|'connected'|'error'>('connecting');
  const [error, setError]     = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const localVideoRef  = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const clientRef      = useRef<IAgoraRTCClient | null>(null);
  const localAudioRef  = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const socketRef      = useRef<any>(null);
  const chatEndRef     = useRef<HTMLDivElement>(null);

  const channelName = `deemona_${appointmentId.replace(/-/g, '').slice(0, 20)}`;

  useEffect(() => {
    // Setup socket for chat
    const token = TokenStorage.get('access_token');
    const s = io('https://wellconsult-backend.onrender.com', {
      auth: { token }, transports: ['websocket', 'polling'],
    });
    socketRef.current = s;
    s.on('message_history', (msgs: any[]) => setMessages(msgs));
    s.on('new_message', (msg: any) => setMessages(prev => [...prev, msg]));
    s.on('connect', () => s.emit('join_room', { appointmentId }));

    startCall();

    return () => {
      cleanup();
      s.disconnect();
    };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const cleanup = async () => {
    localAudioRef.current?.close();
    localVideoTrackRef.current?.close();
    if (clientRef.current) {
      await clientRef.current.leave().catch(() => {});
      clientRef.current.removeAllListeners();
    }
    localAudioRef.current = null;
    localVideoTrackRef.current = null;
    clientRef.current = null;
  };

  const startCall = async () => {
    setStatus('connecting'); setError('');
    try {
      // Get Agora token from backend
      const { data } = await api.post('/agora/token', { channel_name: channelName });
      const { token, app_id, uid } = data.data;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Handle remote users
      client.on('user-published', async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        console.log('[Agora] Subscribed to', remoteUser.uid, mediaType);

        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === remoteUser.uid);
            return exists ? prev.map(u => u.uid === remoteUser.uid ? remoteUser : u) : [...prev, remoteUser];
          });
          setTimeout(() => {
            if (remoteVideoRef.current && remoteUser.videoTrack) {
              remoteUser.videoTrack.play(remoteVideoRef.current);
              setStatus('connected');
            }
          }, 100);
        }
        if (mediaType === 'audio') {
          remoteUser.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
        }
      });

      client.on('user-left', (remoteUser) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
        setStatus('waiting');
      });

      // Join channel
      await client.join(app_id, channelName, token, uid);
      console.log('[Agora] Joined channel:', channelName);

      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await client.publish([audioTrack, videoTrack]);
      console.log('[Agora] Published local tracks');

      setStatus(client.remoteUsers.length > 0 ? 'connected' : 'waiting');
    } catch (err: any) {
      console.error('[Agora] Error:', err);
      if (err.message?.includes('PERMISSION') || err.name === 'NotAllowedError') {
        setError('PERMISSION_DENIED');
      } else {
        setError(err.message || 'Failed to start video call');
      }
      setStatus('error');
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { appointmentId, message: chatInput.trim() });
    setChatInput('');
  };

  const toggleMute = async () => {
    if (localAudioRef.current) {
      await localAudioRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleClose = async () => {
    await cleanup();
    setTimeout(onClose, 100);
  };

  const otherName = user?.role === 'doctor' ? (patientName || 'Patient') : (doctorName || 'Doctor');

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f0f1a', fontFamily:'var(--font-body)' }}>
      {/* Header */}
      <div style={{ padding:'10px 20px', background:'#16213e', display:'flex', alignItems:'center', gap:14, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>📹 Video Consultation</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 }}>
            {status==='connecting' ? 'Connecting...' : status==='waiting' ? `Waiting for ${otherName}...` : status==='connected' ? `with ${otherName}` : 'Connection failed'}
          </div>
        </div>
        <div style={{ width:8, height:8, borderRadius:'50%', background: status==='connected'?'#22C55E':status==='error'?'#EF4444':'#F59E0B' }}/>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,0.06)' }}>🔒 Agora</div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        {/* Video area */}
        <div style={{ flex:1, minWidth:0, position:'relative', background:'#0a0a14' }}>
          {/* Remote video */}
          <div ref={remoteVideoRef} style={{ width:'100%', height:'100%', background:'#0a0a14' }}/>

          {/* Local video PiP */}
          <div style={{ position:'absolute', bottom:16, right:16, width:160, height:120, borderRadius:12, overflow:'hidden', border:'2px solid rgba(255,255,255,0.2)', background:'#222', zIndex:5 }}>
            <div ref={localVideoRef} style={{ width:'100%', height:'100%' }}/>
            {isVideoOff && <div style={{ position:'absolute', inset:0, background:'#333', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👤</div>}
            <div style={{ position:'absolute', bottom:4, left:0, right:0, textAlign:'center', fontSize:10, color:'rgba(255,255,255,0.7)', zIndex:6 }}>You</div>
          </div>

          {/* Status overlays */}
          {(status==='connecting' || status==='waiting') && (
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, zIndex:4 }}>
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
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24, zIndex:4 }}>
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
                <button onClick={startCall} style={{ padding:'10px 20px', borderRadius:8, background:'#0A7B6C', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>🔄 Retry</button>
                <button onClick={handleClose} style={{ padding:'10px 20px', borderRadius:8, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', fontSize:14, cursor:'pointer' }}>Leave</button>
              </div>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
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

      {/* Controls */}
      <div style={{ padding:'14px 20px', background:'#1a1a2e', display:'flex', alignItems:'center', justifyContent:'center', gap:16, flexShrink:0 }}>
        <button onClick={() => setShowChat(s => !s)} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:18, background: showChat ? '#0A7B6C' : 'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>💬</button>
        <button onClick={toggleMute} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:20, background:isMuted?'#EF4444':'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>{isMuted?'🔇':'🎤'}</button>
        <button onClick={toggleVideo} style={{ width:48, height:48, borderRadius:'50%', border:'none', cursor:'pointer', fontSize:20, background:isVideoOff?'#EF4444':'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>{isVideoOff?'📵':'📹'}</button>
        <button onClick={handleClose} style={{ width:56, height:56, borderRadius:'50%', border:'none', cursor:'pointer', background:'#EF4444', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(239,68,68,0.4)' }}>📵</button>
      </div>

      <style>{"@keyframes pulse { 0%,60%,100% { opacity:0.3; transform:scale(1); } 30% { opacity:1; transform:scale(1.3); } }"}</style>
    </div>
  );
}
