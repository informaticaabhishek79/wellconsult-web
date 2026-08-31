import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../store';
import { api } from '../api';
import { io } from 'socket.io-client';
import { TokenStorage } from '../api';

declare global {
  interface Window { JitsiMeetExternalAPI: any; }
}

export default function VideoCallPage({ appointmentId, doctorName, patientName, onClose }: {
  appointmentId: string;
  doctorName?: string;
  patientName?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const jitsiRef = useRef<HTMLDivElement>(null);
  const apiRef   = useRef<any>(null);
  const socketRef = useRef<any>(null);
  const [status, setStatus]   = useState<'loading'|'ready'|'error'>('loading');
  const [messages, setMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const roomName = `wc${appointmentId.slice(0, 10)}${today}`;
  const displayName = user?.role === 'doctor'
    ? (doctorName || 'Doctor')
    : (patientName || 'Patient');

  useEffect(() => {
    // Load Jitsi script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => initJitsi();
    script.onerror = () => setStatus('error');
    document.head.appendChild(script);

    // Setup socket for chat
    const token = TokenStorage.get('access_token');
    const s = io('https://wellconsult-backend.onrender.com', {
      auth: { token }, transports: ['websocket', 'polling'],
    });
    socketRef.current = s;
    s.on('message_history', (msgs: any[]) => setMessages(msgs));
    s.on('new_message', (msg: any) => setMessages(prev => [...prev, msg]));
    s.on('connect', () => s.emit('join_room', { appointmentId }));

    return () => {
      apiRef.current?.dispose();
      s.disconnect();
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const initJitsi = () => {
    if (!jitsiRef.current || !window.JitsiMeetExternalAPI) return;
    try {
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName,
        parentNode: jitsiRef.current,
        userInfo: { displayName },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          defaultLanguage: 'en',
          lobby: { autoKnock: false, enableChat: false },
          enableLobbyChat: false,
          membersOnly: false,
          requireDisplayName: false,
          enableInsecureRoomNameWarning: false,
          toolbarButtons: [
            'microphone', 'camera', 'desktop', 'fullscreen',
            'hangup', 'tileview', 'settings',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
          MOBILE_APP_PROMO: false,
        },
      });

      apiRef.current.on('videoConferenceJoined', () => setStatus('ready'));
      apiRef.current.on('readyToClose', () => { apiRef.current?.dispose(); onClose(); });
      apiRef.current.on('errorOccurred', () => setStatus('error'));
      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { appointmentId, message: chatInput.trim() });
    setChatInput('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#0f0f1a', fontFamily:'var(--font-body)' }}>
      {/* Header */}
      <div style={{ padding:'10px 20px', background:'#16213e', display:'flex', alignItems:'center', gap:14, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => { apiRef.current?.dispose(); onClose(); }} style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'#fff', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>📹 Video Consultation</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:1 }}>
            {status === 'loading' ? 'Connecting...' : `with ${user?.role === 'doctor' ? patientName : doctorName} · Powered by Jitsi`}
          </div>
        </div>
        <div style={{ width:8, height:8, borderRadius:'50%', background: status==='ready'?'#22C55E':status==='error'?'#EF4444':'#F59E0B' }}/>
        <button onClick={() => setShowChat(s => !s)} style={{ background: showChat ? '#0A7B6C' : 'rgba(255,255,255,0.1)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:13 }}>
          💬 Chat
        </button>
      </div>

      {/* Main area */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>
        {/* Jitsi container */}
        <div style={{ flex:1, position:'relative', minWidth:0 }}>
          {status === 'loading' && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#0a0a14' }}>
              <div style={{ fontSize:48 }}>📹</div>
              <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>Connecting to video call...</div>
              <div style={{ display:'flex', gap:6 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'#0A7B6C', animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
              </div>
            </div>
          )}
          {status === 'error' && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#0a0a14' }}>
              <div style={{ fontSize:48 }}>❌</div>
              <div style={{ fontSize:16, color:'#fff', fontWeight:600 }}>Could not connect</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>Check your internet connection and try again</div>
              <button onClick={() => { apiRef.current?.dispose(); initJitsi(); }} style={{ padding:'10px 24px', borderRadius:8, background:'#0A7B6C', color:'#fff', border:'none', fontSize:14, cursor:'pointer' }}>
                🔄 Retry
              </button>
            </div>
          )}
          <div ref={jitsiRef} style={{ width:'100%', height:'100%' }}/>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div style={{ width:280, flexShrink:0, background:'#16213e', borderLeft:'1px solid rgba(255,255,255,0.1)', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize:14, fontWeight:600, color:'#fff' }}>💬 Consultation Notes</span>
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

      <style>{"@keyframes pulse { 0%,60%,100% { opacity:0.3; transform:scale(1); } 30% { opacity:1; transform:scale(1.3); } }"}</style>
    </div>
  );
}
