import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store';
import { api } from '../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  actions?: string[];
}

const SYSTEM_PROMPT = `You are Deemona Doctors's AI health assistant for an Indian holistic healthcare teleconsultation platform. Your name is "Veda".

ABOUT DEEMONA DOCTORS:
- Indian holistic healthcare platform connecting patients with doctors via teleconsultation
- Medical systems available: Allopathy, Homeopathy, Ayurveda, Yoga Therapy, Naturopathy, Unani
- Services: Video consultations, Chat consultations, Instant consultations with online doctors
- All consultations are online/remote - no physical visits

HOW TO HELP PATIENTS:
1. Greet warmly and ask about their health concern
2. Ask relevant follow-up questions about symptoms (duration, severity, location, triggers)
3. Based on symptoms, suggest which medical system/specialist might help
4. Guide them to book an appointment or use instant consultation
5. Explain platform features clearly

BOOKING GUIDANCE:
- Go to Appointments -> Book Appointment to schedule
- Go to Doctors Online (green dot in sidebar) for instant consultation
- Instant consultation connects with available doctors immediately
- Regular appointments can be scheduled for specific dates/times

MEDICAL SYSTEMS GUIDE:
- Allopathy: Modern medicine, acute conditions, infections, emergencies
- Ayurveda: Chronic conditions, digestive issues, lifestyle diseases, immunity
- Homeopathy: Allergies, skin conditions, chronic diseases, children's health  
- Yoga Therapy: Stress, anxiety, musculoskeletal issues, lifestyle management
- Naturopathy: Detox, chronic conditions, preventive health
- Unani: Digestive, respiratory, skin conditions using herbal remedies

IMPORTANT RULES:
- Never diagnose conditions definitively - always recommend consulting a doctor
- Keep responses concise (2-4 sentences max per response)
- Be warm, empathetic, and professional
- Speak in simple language - avoid medical jargon
- If emergency symptoms (chest pain, difficulty breathing, severe bleeding), advise calling emergency services immediately
- You can communicate in both English and Hindi
- Always end guidance with a call to action (book appointment, consult online doctor)`;

export default function ChatbotPage({ onNav }: { onNav?: (path: string) => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    text: `Namaste! 🙏 I'm Veda, your Deemona Doctors health assistant. I can help you find the right doctor, understand your symptoms, and guide you through our platform.\n\nHow are you feeling today? What health concern can I help you with?`,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => { synthRef.current?.cancel(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak text using Web Speech API
  const speak = (text: string) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, ''));
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    // Prefer Indian English voice if available
    const voices = synthRef.current.getVoices();
    const indVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en'));
    if (indVoice) utterance.voice = indVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
  };

  const pendingVoiceText = useRef('');

  // Voice input using Web Speech API
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input not supported. Please use Chrome.'); return; }
    pendingVoiceText.current = '';
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => { setListening(true); console.log('[Veda] Listening started'); };
    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const current = final || interim;
      pendingVoiceText.current = current;
      setInput(current);
      console.log('[Veda] Heard:', current, 'final:', !!final);
    };
    recognition.onerror = (e: any) => {
      console.log('[Veda] Speech error:', e.error);
      setListening(false);
    };
    recognition.onend = () => {
      console.log('[Veda] Listening ended, text:', pendingVoiceText.current);
      setListening(false);
      if (pendingVoiceText.current.trim()) {
        const text = pendingVoiceText.current.trim();
        pendingVoiceText.current = '';
        setInput('');
        setTimeout(() => sendMessage(text), 100);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');
    stopSpeaking();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msgText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role, content: m.text,
      }));

      const { data: respData } = await api.post('/chatbot/chat', {
        messages: [...history, { role: 'user', content: msgText }],
      });
      const replyText = respData.data?.text || "I'm sorry, I couldn't process that. Please try again.";

      // Detect routing intent in response
      const lowerReply = replyText.toLowerCase();
      const lowerMsg = msgText.toLowerCase();
      let actions: string[] = [];
      if (lowerMsg.includes('book') || lowerMsg.includes('appointment') || lowerMsg.includes('schedule') ||
          lowerReply.includes('book an appointment') || lowerReply.includes('schedule') || lowerReply.includes('consult a doctor')) {
        actions = ['book'];
      }
      if (lowerMsg.includes('instant') || lowerMsg.includes('online doctor') || lowerMsg.includes('now') ||
          lowerReply.includes('instant consultation') || lowerReply.includes('doctors online') || lowerReply.includes('available now')) {
        actions = [...actions, 'online'];
      }
      if (lowerMsg.includes('chat') || lowerReply.includes('chat with')) {
        actions = [...actions, 'chat'];
      }

      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: replyText, timestamp: new Date(), actions };
      setMessages(prev => [...prev, assistantMsg]);
      speak(replyText);
    } catch (err) {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: "I'm having trouble connecting. Please try again in a moment.", timestamp: new Date() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    '🤒 I have fever and cold',
    '😰 I feel stressed and anxious',
    '🩺 How do I book a doctor?',
    '⚡ How does instant consultation work?',
    '🌿 What is Ayurveda treatment?',
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)', fontFamily:'var(--font-body)' }}>
      {/* Header */}
      <div style={{ padding:'14px 20px', background:'#fff', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
          🤖
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>Veda — Deemona Doctors AI</div>
          <div style={{ fontSize:12, color:'#22C55E', display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E' }}/>
            Always available · Speaks English & Hindi
          </div>
        </div>
        <button onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); }}
          style={{ padding:'6px 12px', borderRadius:20, border:'1px solid var(--border)', background: voiceEnabled ? 'var(--primary-light)' : '#fff', color: voiceEnabled ? 'var(--primary)' : 'var(--text-muted)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
          {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap:4 }}>
            {msg.role === 'assistant' && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🤖</div>
                <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Veda</span>
              </div>
            )}
            <div style={{
              maxWidth:'75%', padding:'10px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'var(--primary)' : '#fff',
              color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize:14, lineHeight:1.6, boxShadow:'var(--shadow-sm)',
              whiteSpace:'pre-wrap' as any,
            }}>
              {msg.text}
            </div>
            {msg.role === 'assistant' && (
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={() => speak(msg.text)}
                  style={{ fontSize:11, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', padding:'2px 6px' }}>
                  🔊 Replay
                </button>
                {msg.actions?.includes('book') && (
                  <button onClick={() => onNav?.('/appointments')}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:20, border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', cursor:'pointer', fontWeight:600 }}>
                    📅 Book Appointment
                  </button>
                )}
                {msg.actions?.includes('online') && (
                  <button onClick={() => onNav?.('/online')}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:20, border:'1px solid #22C55E', background:'#ECFDF5', color:'#16A34A', cursor:'pointer', fontWeight:600 }}>
                    ⚡ See Online Doctors
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>🤖</div>
            <div style={{ padding:'10px 14px', borderRadius:'16px 16px 16px 4px', background:'#fff', border:'1px solid var(--border)', display:'flex', gap:4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--primary)', animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
            </div>
          </div>
        )}

        {speaking && (
          <div style={{ display:'flex', justifyContent:'center' }}>
            <div style={{ padding:'6px 14px', borderRadius:20, background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--primary)', animation:'pulse 0.8s ease-in-out infinite' }}/>
              Veda is speaking...
              <button onClick={stopSpeaking} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--primary)', marginLeft:4 }}>Stop</button>
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div style={{ padding:'0 20px 12px', display:'flex', gap:8, flexWrap:'wrap' }}>
          {quickQuestions.map(q => (
            <button key={q} onClick={() => sendMessage(q.replace(/^[^\s]+\s/, ''))}
              style={{ padding:'6px 12px', borderRadius:20, border:'1px solid var(--border)', background:'#fff', color:'var(--text-secondary)', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding:'12px 20px', background:'#fff', borderTop:'1px solid var(--border)', display:'flex', gap:10, alignItems:'flex-end', flexShrink:0 }}>
        <div style={{ flex:1, position:'relative' }}>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={listening ? '🎤 Listening...' : 'Ask Veda anything about your health...'}
            rows={1}
            style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:'1px solid var(--border)', fontSize:14, outline:'none', resize:'none', fontFamily:'var(--font-body)', lineHeight:1.5, background: listening ? 'var(--primary-light)' : '#fff', boxSizing:'border-box' as any }}/>
        </div>
        <button onClick={listening ? stopListening : startListening}
          style={{ width:42, height:42, borderRadius:'50%', border:'none', background: listening ? '#EF4444' : 'var(--bg)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {listening ? '⏹' : '🎤'}
        </button>
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          style={{ width:42, height:42, borderRadius:'50%', border:'none', background: !input.trim() || loading ? 'var(--bg)' : 'var(--primary)', color: !input.trim() || loading ? 'var(--text-muted)' : '#fff', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          ➤
        </button>
      </div>
      <style>{"@keyframes pulse { 0%,60%,100% { opacity:0.3; transform:scale(1); } 30% { opacity:1; transform:scale(1.2); } }"}</style>
    </div>
  );
}
