import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const DOCUMENTS = [
  { type: 'degree_certificate',       label: 'Degree Certificate',       desc: 'MBBS, BAMS, BHMS etc.', required: true, icon: '🎓' },
  { type: 'registration_certificate', label: 'Registration Certificate',  desc: 'NMC, State Medical Council', required: true, icon: '📜' },
  { type: 'id_proof',                 label: 'Government ID',             desc: 'Aadhaar, Passport, PAN', required: true, icon: '🪪' },
  { type: 'photo',                    label: 'Professional Photo',        desc: 'Clear face photo', required: false, icon: '📸' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:      { bg: '#FEF3C7', color: '#92400E', label: 'Pending review' },
  under_review: { bg: '#EFF6FF', color: '#1D4ED8', label: 'Under review' },
  verified:     { bg: '#ECFDF5', color: '#065F46', label: 'Verified' },
  rejected:     { bg: '#FEF2F2', color: '#991B1B', label: 'Rejected' },
};

export default function DoctorVerificationPage() {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  const { data, refetch } = useQuery({
    queryKey: ['verification-status'],
    queryFn: async () => {
      const { data } = await api.get('/verification/status');
      return data.data;
    },
  });

  const docStatus = (type: string) => data?.documents?.find((d: any) => d.document_type === type);

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      // Get presigned URL
      const { data: urlData } = await api.post('/verification/upload-url', {
        document_type: docType,
        file_name: file.name,
        content_type: file.type,
      });

      // Upload directly to R2
      const uploadRes = await fetch(urlData.data.upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      setUploaded(prev => ({ ...prev, [docType]: true }));
      await refetch();
    } catch (err: any) {
      alert(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const profileStatus = data?.profile_status || 'pending';
  const ss = STATUS_STYLE[profileStatus] || STATUS_STYLE.pending;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Verification & Documents
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Upload your credentials to get verified and appear in patient search
        </p>
      </div>

      {/* Status banner */}
      <div style={{ padding: '14px 18px', borderRadius: 'var(--r-lg)', background: ss.bg, border: `1px solid ${ss.color}30`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${ss.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {profileStatus === 'verified' ? '✅' : profileStatus === 'rejected' ? '❌' : profileStatus === 'under_review' ? '🔍' : '⏳'}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: ss.color }}>{ss.label}</div>
          <div style={{ fontSize: 12, color: ss.color, opacity: 0.8, marginTop: 2 }}>
            {profileStatus === 'verified' ? 'You are verified and visible to patients.' :
             profileStatus === 'rejected' ? `Reason: ${data?.rejection_reason || 'Please re-upload documents.'}` :
             profileStatus === 'under_review' ? 'Our team is reviewing your documents. This takes 24-48 hours.' :
             'Upload all required documents to start the verification process.'}
          </div>
        </div>
      </div>

      {/* Document upload cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DOCUMENTS.map(doc => {
          const status = docStatus(doc.type);
          const isUploading = uploading === doc.type;
          const isDone = uploaded[doc.type] || !!status;

          return (
            <div key={doc.type} style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: `1px solid ${isDone ? 'var(--primary)' : 'var(--border)'}`, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', background: isDone ? 'var(--primary-light)' : 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {doc.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</span>
                  {doc.required && <span style={{ fontSize: 10, color: 'var(--error)', fontWeight: 600 }}>REQUIRED</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.desc}</div>
                {status && (
                  <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 3 }}>
                    ✓ {status.file_name} — uploaded {new Date(status.uploaded_at).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
              <label style={{ cursor: isUploading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }} disabled={isUploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f); e.target.value = ''; }}/>
                <div style={{ padding: '7px 16px', borderRadius: 'var(--r-md)', border: `1.5px solid ${isDone ? 'var(--primary)' : 'var(--border)'}`, background: isDone ? 'var(--primary-light)' : '#fff', color: isDone ? 'var(--primary)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isUploading ? '⏳ Uploading...' : isDone ? '✓ Re-upload' : '📤 Upload'}
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        🔒 <strong>Privacy & Security:</strong> Your documents are encrypted and stored securely on Cloudflare R2. Only WellConsult admins can access them for verification. Documents are never shared with patients.
      </div>
    </div>
  );
}
