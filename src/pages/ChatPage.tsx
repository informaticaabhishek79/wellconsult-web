import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../store';
import { TokenStorage, api } from '../api';

const SOCKET_URL = 'https://deemona-doctors-backend.onrender.com';

interface Message {
  id: string;
  appointment_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  message_type: string;
  file_key?: string;
  file_name?: string;
  role: string;
  created_at: string;
}

export default function ChatPage({ appointmentId, doctorName, onClose }: {
  appointmentId: string;
  doctorName?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = TokenStorage.get('access_token');
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setConnected(true);
      setError('');
      s.emit('join_room', { appointmentId });
    });

    s.on('connect_error', (err) => {
      setError('Connection failed. Please refresh.');
      setConnected(false);
    });

    s.on('message_history', (msgs: Message[]) => {
      setMessages(msgs);
    });

    s.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('user_typing', ({ role, isTyping }: { role: string; isTyping: boolean }) => {
      if (role !== user?.role) setOtherTyping(isTyping);
    });

    s.on('error', ({ message }: { message: string }) => {
      setError(message);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [appointmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;
    e.target.value = '';

    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(file.type.startsWith('video/') ? 'Video must be under 50MB' : 'Image must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const { data: urlData } = await api.post('/chat/upload-url', {
        appointment_id: appointmentId,
        file_name: file.name,
        content_type: file.type,
      });

      await fetch(urlData.data.upload_url, {
        method: 'PUT', body: file, headers: { 'Content-Type': file.type },
      });

      socket.emit('send_media', {
        appointmentId,
        file_key: urlData.data.key,
        file_name: file.name,
        media_type: urlData.data.type,
      });
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const sendMessage = () => {
    if (!input.trim() || !socket || !connected) return;
    socket.emit('send_message', { appointmentId, message: input.trim() });
    setInput('');
    // Stop typing indicator
    socket.emit('typing', { appointmentId, isTyping: false });
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!socket || !connected) return;
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { appointmentId, isTyping: true });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      socket.emit('typing', { appointmentId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwn = (msg: Message) => msg.sender_id === user?.id;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', fontFamily: 'var(--font-body)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)', padding: '2px 6px' }}>←</button>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
          {doctorName ? doctorName.split(' ').map(w => w[0]).slice(0,2).join('') : '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {doctorName || 'Consultation chat'}
          </div>
          <div style={{ fontSize: 12, color: connected ? '#16A34A' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#16A34A' : 'var(--border)' }}/>
            {connected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', padding: '3px 10px', borderRadius: 'var(--r-full)', border: '1px solid var(--border)' }}>
          🔒 Encrypted
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: '8px 16px', background: 'var(--error-light)', color: 'var(--error)', fontSize: 13, textAlign: 'center', borderBottom: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && connected && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Start the conversation</div>
            <div style={{ fontSize: 13 }}>Messages are private and encrypted</div>
          </div>
        )}

        {messages.map(msg => {
          const own = isOwn(msg);
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: own ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              {!own && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                  {msg.sender_name?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || '?'}
                </div>
              )}
              <div style={{ maxWidth: '70%' }}>
                {!own && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, paddingLeft: 4 }}>
                    {msg.sender_name}
                  </div>
                )}
                <div style={{
                  padding: '10px 14px', borderRadius: own ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: own ? 'var(--primary)' : 'var(--bg)',
                  color: own ? '#fff' : 'var(--text-primary)',
                  fontSize: 14, lineHeight: 1.5,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: own ? 'right' : 'left', paddingLeft: own ? 0 : 4, paddingRight: own ? 4 : 0 }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {otherTyping && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-light)', flexShrink: 0 }}/>
            <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'var(--bg)', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            disabled={!connected}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--r-lg)',
              border: '1.5px solid var(--border)', fontSize: 14,
              outline: 'none', resize: 'none' as any,
              fontFamily: 'var(--font-body)', lineHeight: 1.5,
              maxHeight: 120, background: connected ? '#fff' : 'var(--bg)',
              boxSizing: 'border-box' as any,
            }}
          />
          <input ref={fileInputRef} type="file" style={{ display:'none' }}
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={uploadMedia}/>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading || !connected}
            style={{ width:42, height:42, borderRadius:'50%', border:'1px solid var(--border)', background:'#fff', cursor: uploading?'not-allowed':'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            title="Upload image or video">
            {uploading ? '⏳' : '📎'}
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: input.trim() && connected ? 'var(--primary)' : 'var(--border)',
              color: input.trim() && connected ? '#fff' : 'var(--text-muted)',
              cursor: input.trim() && connected ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            ➤
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
