import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../store';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Chandigarh',
];

const DOC_TYPES = [
  { value:'aadhaar', label:'Aadhaar Card', required:true },
  { value:'pan', label:'PAN Card', required:true },
  { value:'photo', label:'Passport Photo', required:true },
  { value:'address_proof', label:'Address Proof', required:false },
  { value:'bank_details', label:'Bank Account Details / Cancelled Cheque', required:false },
];

const TNC = `DEEMONA DOCTORS MARKETING AGENT AGREEMENT

1. APPOINTMENT: You are appointed as a Marketing Agent of Deemona Doctors Healthcare Platform.

2. RESPONSIBILITIES:
   - Promote Deemona Doctors services ethically and professionally
   - Onboard patients and doctors to the platform
   - Maintain confidentiality of all user data
   - Follow all applicable laws and regulations
   - Not misrepresent services or make false claims

3. COMMISSION: Commission will be paid as per the agreed rate for each successful referral.

4. CODE OF CONDUCT:
   - No unauthorized collection of fees from patients/doctors
   - No sharing of confidential user information
   - No engagement in fraudulent activities
   - No defamation of Deemona Doctors brand
   - No solicitation of existing users for competing platforms

5. VIOLATIONS & TERMINATION:
   - First violation: Formal warning
   - Second violation: Suspension pending review
   - Third violation: Automatic termination
   - Severe violations may result in immediate termination

6. DATA PROTECTION: All patient/doctor data accessed through the platform is strictly confidential.

7. GOVERNING LAW: This agreement is governed by laws of India.`;

export default function AgentOnboarding({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState<'details'|'documents'|'tnc'|'success'>('details');
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [tncAccepted, setTncAccepted] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState('');

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: '',
    city: '',
    state: '',
    address: '',
    territory: '',
  });

  const handleRegister = async () => {
    if (!form.full_name || !form.phone || !form.city || !form.state) {
      alert('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/agents/register', form);
      setAgentId(data.data.id);
      setAgentCode(data.data.agent_code);
      setStep('documents');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const handleUploadDoc = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      const { data: urlData } = await api.post('/agents/me/documents/upload-url', {
        file_name: file.name, content_type: file.type, doc_type: docType,
      });
      await fetch(urlData.data.upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await api.post('/agents/me/documents', {
        doc_type: docType, file_key: urlData.data.key, file_name: file.name,
      });
      setUploadedDocs(prev => ({ ...prev, [docType]: true }));
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally { setUploading(''); }
  };

  const requiredDocsUploaded = DOC_TYPES.filter(d => d.required).every(d => uploadedDocs[d.value]);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-body)', padding:24 }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>🤝</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>
            Become a Deemona Doctors Agent
          </h1>
          <p style={{ fontSize:14, color:'var(--text-secondary)' }}>
            Join our network of marketing agents and earn commissions by connecting people with healthcare
          </p>
        </div>

        {/* Progress */}
        <div style={{ display:'flex', gap:0, marginBottom:32 }}>
          {['details','documents','tnc'].map((s, i) => (
            <div key={s} style={{ flex:1, display:'flex', alignItems:'center' }}>
              <div style={{ flex:1, height:3, background: step === 'success' || ['details','documents','tnc'].indexOf(step) >= i ? 'var(--primary)' : 'var(--border)' }}/>
              <div style={{ width:28, height:28, borderRadius:'50%', background: step === 'success' || ['details','documents','tnc'].indexOf(step) >= i ? 'var(--primary)' : 'var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:700, flexShrink:0 }}>
                {i+1}
              </div>
              {i < 2 && <div style={{ flex:1, height:3, background: ['details','documents','tnc'].indexOf(step) > i ? 'var(--primary)' : 'var(--border)' }}/>}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:24 }}>
          <span>Personal Details</span>
          <span>Documents</span>
          <span>Terms & Conditions</span>
        </div>

        {/* Step 1: Personal Details */}
        {step === 'details' && (
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, border:'1px solid var(--border)' }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:20 }}>Personal Information</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Full Name *</label>
                <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name:e.target.value}))}
                  placeholder="As per Aadhaar card"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Mobile Number *</label>
                <input value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}
                  placeholder="+91 XXXXX XXXXX" type="tel"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>City *</label>
                  <input value={form.city} onChange={e => setForm(f => ({...f, city:e.target.value}))}
                    placeholder="Your city"
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>State *</label>
                  <select value={form.state} onChange={e => setForm(f => ({...f, state:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff', boxSizing:'border-box' as any }}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Full Address</label>
                <textarea value={form.address} onChange={e => setForm(f => ({...f, address:e.target.value}))} rows={2}
                  placeholder="House/Flat no, Street, Area"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', resize:'none' as any, boxSizing:'border-box' as any }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, marginBottom:5 }}>Preferred Territory</label>
                <input value={form.territory} onChange={e => setForm(f => ({...f, territory:e.target.value}))}
                  placeholder="Area/district you want to cover"
                  style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <button onClick={handleRegister} disabled={loading}
                style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background: loading ? 'var(--border)' : 'var(--primary)', color: loading ? 'var(--text-muted)' : '#fff', fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', marginTop:6 }}>
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 'documents' && (
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, border:'1px solid var(--border)' }}>
            <div style={{ background:'#ECFDF5', borderRadius:'var(--r-md)', padding:'10px 14px', marginBottom:20, fontSize:13, color:'#065F46' }}>
              🎉 Your Agent ID is <strong>{agentCode}</strong> — Save this for reference!
            </div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:6 }}>Upload Documents</h2>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:20 }}>Please upload the following documents for verification. All documents are securely stored.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {DOC_TYPES.map(doc => (
                <div key={doc.value} style={{ padding:'14px', borderRadius:'var(--r-lg)', border:`1.5px solid ${uploadedDocs[doc.value] ? '#22C55E' : 'var(--border)'}`, background: uploadedDocs[doc.value] ? '#ECFDF5' : '#fff' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                        {doc.label} {doc.required && <span style={{ color:'#EF4444' }}>*</span>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>PDF, JPG, PNG • Max 5MB</div>
                    </div>
                    {uploadedDocs[doc.value] ? (
                      <span style={{ fontSize:13, color:'#16A34A', fontWeight:600 }}>✅ Uploaded</span>
                    ) : (
                      <label style={{ padding:'7px 14px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor: uploading === doc.value ? 'not-allowed' : 'pointer' }}>
                        {uploading === doc.value ? '⏳ Uploading...' : '📤 Upload'}
                        <input type="file" style={{ display:'none' }} accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => { const f = e.target.files?.[0]; if(f) handleUploadDoc(doc.value, f); e.target.value=''; }}
                          disabled={uploading === doc.value}/>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('tnc')} disabled={!requiredDocsUploaded}
              style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background: requiredDocsUploaded ? 'var(--primary)' : 'var(--border)', color: requiredDocsUploaded ? '#fff' : 'var(--text-muted)', fontSize:15, fontWeight:700, cursor: requiredDocsUploaded ? 'pointer' : 'not-allowed', marginTop:20 }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 3: T&C */}
        {step === 'tnc' && (
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, border:'1px solid var(--border)' }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:6 }}>Terms & Conditions</h2>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Please read the agent agreement carefully before proceeding.</p>
            <div style={{ height:280, overflowY:'auto', padding:'14px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'var(--bg)', fontSize:12, color:'var(--text-secondary)', lineHeight:1.8, whiteSpace:'pre-wrap' as any, marginBottom:16 }}>
              {TNC}
            </div>
            <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', marginBottom:20 }}>
              <input type="checkbox" checked={tncAccepted} onChange={e => setTncAccepted(e.target.checked)} style={{ marginTop:2, width:16, height:16, cursor:'pointer' }}/>
              <span style={{ fontSize:13, color:'var(--text-primary)' }}>
                I have read, understood, and agree to the Deemona Doctors Marketing Agent Agreement and Code of Conduct. I understand that violation of these terms may result in termination.
              </span>
            </label>
            <button onClick={() => { if(tncAccepted) setStep('success'); }} disabled={!tncAccepted}
              style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background: tncAccepted ? 'var(--primary)' : 'var(--border)', color: tncAccepted ? '#fff' : 'var(--text-muted)', fontSize:15, fontWeight:700, cursor: tncAccepted ? 'pointer' : 'not-allowed' }}>
              Submit Application →
            </button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:36, border:'1px solid var(--border)', textAlign:'center' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:24, fontWeight:800, color:'var(--text-primary)', marginBottom:8 }}>Application Submitted!</h2>
            <p style={{ fontSize:15, color:'var(--text-secondary)', marginBottom:20, lineHeight:1.6 }}>
              Your application has been submitted successfully. Our team will review your documents and activate your account within 2-3 business days.
            </p>
            <div style={{ background:'var(--bg)', borderRadius:'var(--r-lg)', padding:'16px', marginBottom:24 }}>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>Your Agent ID</div>
              <div style={{ fontSize:28, fontWeight:800, color:'var(--primary)', fontFamily:'monospace' }}>{agentCode}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>Save this ID — you'll need it for referrals</div>
            </div>
            <button onClick={onSuccess} style={{ width:'100%', padding:'13px', borderRadius:'var(--r-md)', border:'none', background:'var(--primary)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer' }}>
              Go to Agent Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
