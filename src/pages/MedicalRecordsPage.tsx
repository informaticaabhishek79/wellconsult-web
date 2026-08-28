import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// ── Diagnostic Tests (Imaging & Radiology) ──────────────────────────────────
const DIAGNOSTIC_TESTS = [
  // X-Ray
  'X-Ray Chest','X-Ray Spine (Cervical)','X-Ray Spine (Lumbar)','X-Ray Spine (Thoracic)',
  'X-Ray Knee','X-Ray Hip','X-Ray Shoulder','X-Ray Wrist','X-Ray Ankle','X-Ray Foot',
  'X-Ray Hand','X-Ray Elbow','X-Ray Pelvis','X-Ray Skull','X-Ray Abdomen',
  'X-Ray Ribs','X-Ray Clavicle','X-Ray Sacrum','X-Ray Facial Bones','X-Ray Sinuses',
  // CT Scan
  'CT Scan Brain','CT Scan Chest','CT Scan Abdomen','CT Scan Pelvis','CT Scan Spine',
  'CT Scan Neck','CT Scan Angiography','CT Scan KUB','CT Scan PNS','CT Scan Orbit',
  'CT Scan Thorax','CT Scan Whole Body','CT Scan Coronary Angiography','CT Scan Temporal Bone',
  // MRI
  'MRI Brain','MRI Spine (Cervical)','MRI Spine (Lumbar)','MRI Spine (Thoracic)',
  'MRI Knee','MRI Shoulder','MRI Hip','MRI Wrist','MRI Ankle','MRI Abdomen',
  'MRI Pelvis','MRI Cardiac','MRI Angiography (Brain)','MRI Angiography (Peripheral)',
  'MRI Breast','MRI Liver','MRI MRCP','MRI Orbit','MRI Fistulogram',
  // Ultrasound
  'USG Abdomen','USG Pelvis','USG Whole Abdomen','USG Neck','USG Thyroid',
  'USG Breast','USG Scrotum','USG Doppler (Carotid)','USG Doppler (Peripheral)',
  'USG Doppler (Venous)','USG Doppler (Renal)','USG KUB','USG Obstetric (OB)',
  'USG Guided FNAC','USG Transvaginal','USG Echocardiography',
  // Nuclear Medicine & Others
  'PET Scan','PET CT Scan','Bone Scan','DEXA Scan (Bone Density)',
  'Mammography','OPG (Dental X-Ray)','Fluoroscopy','Barium Swallow',
  'Barium Meal','Barium Enema','Hysterosalpingography (HSG)',
  'Angiography (Cardiac)','Angiography (Peripheral)','Myelography',
  // Endoscopy
  'Upper GI Endoscopy','Colonoscopy','Sigmoidoscopy','Bronchoscopy',
  'Cystoscopy','Laparoscopy','Hysteroscopy','Arthroscopy','ERCP',
  // Cardiac
  'ECG / EKG','Echocardiogram','Stress Test (TMT)','Holter Monitor',
  'Ambulatory BP Monitor','Tilt Table Test','Cardiac Catheterization',
  // Pulmonary
  'Pulmonary Function Test (PFT)','Spirometry','Sleep Study (Polysomnography)',
  'Bronchoscopy Report','DLCO Test',
  // Neurological
  'EEG (Electroencephalogram)','EMG / NCV','Nerve Conduction Study',
  'Evoked Potentials','Lumbar Puncture Report',
  // Others
  'FNAC Report','Biopsy Report','Cytology Report','Bone Marrow Biopsy',
  'Skin Biopsy','Renal Biopsy','Liver Biopsy',
].sort();

// ── Pathological / Lab Tests ─────────────────────────────────────────────────
const PATHOLOGICAL_TESTS = [
  // Complete Blood Count
  'CBC (Complete Blood Count)','Hemoglobin','WBC Count','Platelet Count',
  'ESR (Erythrocyte Sedimentation Rate)','Peripheral Blood Smear','Reticulocyte Count',
  'Blood Group & Rh Factor','Coagulation Profile (PT/INR/APTT)',
  // Blood Chemistry
  'Blood Glucose (Fasting)','Blood Glucose (Post Prandial)','HbA1c (Glycosylated Hemoglobin)',
  'Random Blood Glucose','Glucose Tolerance Test (GTT)',
  // Lipid Profile
  'Lipid Profile','Total Cholesterol','HDL Cholesterol','LDL Cholesterol',
  'Triglycerides','VLDL Cholesterol',
  // Liver Function
  'Liver Function Test (LFT)','SGOT (AST)','SGPT (ALT)','Alkaline Phosphatase',
  'Bilirubin (Total & Direct)','GGT','Albumin','Total Protein',
  // Kidney Function
  'Kidney Function Test (KFT)','Blood Urea Nitrogen (BUN)','Serum Creatinine',
  'Uric Acid','Electrolytes (Na/K/Cl)','eGFR','24 Hour Urine Protein',
  // Thyroid
  'Thyroid Profile (T3/T4/TSH)','TSH','Free T3','Free T4','Anti-TPO Antibodies',
  'Anti-Thyroglobulin Antibodies','Thyroglobulin',
  // Hormones
  'Testosterone','FSH','LH','Prolactin','Estradiol','Progesterone',
  'DHEA-S','Cortisol','Insulin','C-Peptide','ACTH','Growth Hormone',
  'AMH (Anti-Müllerian Hormone)','Beta HCG (Pregnancy Test)',
  // Cardiac Markers
  'Troponin I','Troponin T','CK-MB','LDH','BNP / NT-proBNP',
  'Homocysteine','hs-CRP (High Sensitivity CRP)',
  // Vitamins & Minerals
  'Vitamin D (25-OH)','Vitamin B12','Folic Acid','Iron Studies (Serum Iron/TIBC/Ferritin)',
  'Calcium','Phosphorus','Magnesium','Zinc','Copper','Selenium',
  // Immunology & Inflammation
  'CRP (C-Reactive Protein)','ANA (Antinuclear Antibody)','Anti-dsDNA',
  'ANCA','RF (Rheumatoid Factor)','Anti-CCP','Complement C3/C4',
  'Immunoglobulin (IgG/IgA/IgM)','Coombs Test',
  // Infectious Disease
  'HIV Test (ELISA/Western Blot)','HBsAg (Hepatitis B)','Anti-HCV (Hepatitis C)',
  'VDRL/RPR (Syphilis)','Dengue NS1 Antigen','Dengue IgM/IgG',
  'Malaria Antigen (RDT)','Malaria Smear','Typhoid Test (Widal/Typhi Dot)',
  'COVID-19 RT-PCR','COVID-19 Antigen','COVID-19 Antibody',
  'Leptospira IgM','Scrub Typhus IgM','H. Pylori Antigen (Stool)',
  'H. Pylori Antibody (Blood)','CMV IgG/IgM','EBV (Mono Spot)',
  // Cancer Markers
  'PSA (Prostate Specific Antigen)','CA 125','CA 19-9','CA 15-3',
  'CEA (Carcinoembryonic Antigen)','AFP (Alpha Fetoprotein)','Beta-2 Microglobulin',
  'LDH (Tumor Marker)','HCG (Tumor Marker)',
  // Urine Tests
  'Urine Routine & Microscopy','Urine Culture & Sensitivity',
  '24 Hour Urine Creatinine','Urine Microalbumin','Urine Pregnancy Test',
  'Urine Protein Creatinine Ratio','Drug Screen (Urine)',
  // Stool Tests
  'Stool Routine & Microscopy','Stool Culture','Stool Occult Blood',
  'Stool Calprotectin','H. Pylori Stool Antigen',
  // Microbiology
  'Blood Culture & Sensitivity','Sputum Culture','Throat Swab Culture',
  'Wound Swab Culture','CSF Culture','Fungal Culture','TB Culture',
  'AFB Smear (TB)','GeneXpert (TB)','CBNAAT',
  // Genetics & Special
  'Karyotyping','HLA B27','HLA Typing','G6PD Deficiency',
  'Sickle Cell Test','Thalassemia Screening','BRCA 1/2 Gene Test',
  'Pharmacogenomics Panel',
  // Allergy
  'Total IgE','Specific Allergen Panel','Food Allergy Panel',
  'Inhalant Allergy Panel','RAST Test',
  // Others
  'Semen Analysis','Sperm DNA Fragmentation','TORCH Panel',
  'Blood Alcohol Level','Lead Level','Heavy Metal Panel',
].sort();

const CATEGORIES = [
  { id: 'diagnostic', label: 'Diagnostic / Imaging Reports', icon: '🔬', color: '#2563EB', tests: DIAGNOSTIC_TESTS },
  { id: 'pathological', label: 'Pathological / Lab Reports', icon: '🧪', color: '#7C3AED', tests: PATHOLOGICAL_TESTS },
];

const PAGE_SIZE = 20;

export default function MedicalRecordsPage() {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<'diagnostic'|'pathological'>('diagnostic');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState<string | null>(null);
  const [customTest, setCustomTest] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingTest, setPendingTest] = useState<string>('');

  const { data: records, isLoading } = useQuery({
    queryKey: ['medical-records'],
    queryFn: async () => {
      const { data } = await api.get('/patients/me/records');
      return data.data as any[] || [];
    },
  });

  const cat = CATEGORIES.find(c => c.id === activeCategory)!;
  const filtered = cat.tests.filter(t => !search || t.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const getRecord = (testName: string) => records?.find((r: any) => r.test_name === testName);

  const handleUploadClick = (testName: string) => {
    setPendingTest(testName);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingTest) return;
    e.target.value = '';

    setUploading(pendingTest);
    try {
      const { data: urlData } = await api.post('/patients/me/records/upload-url', {
        test_name: pendingTest,
        category: activeCategory,
        file_name: file.name,
        content_type: file.type,
      });

      await fetch(urlData.data.upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      await api.post('/patients/me/records', {
        test_name: pendingTest,
        category: activeCategory,
        file_key: urlData.data.key,
        file_name: file.name,
        file_size: file.size,
        report_date: new Date().toISOString().split('T')[0],
      });

      qc.invalidateQueries({ queryKey: ['medical-records'] });
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(null);
      setPendingTest('');
    }
  };

  const handleCustomUpload = () => {
    if (!customTest.trim()) return;
    setPendingTest(customTest.trim());
    setShowCustom(false);
    setCustomTest('');
    fileInputRef.current?.click();
  };

  const handleView = async (record: any) => {
    try {
      const { data } = await api.get(`/patients/me/records/${record.id}/view`);
      window.open(data.data.url, '_blank');
    } catch { alert('Could not load document.'); }
  };

  const handleDelete = async (record: any) => {
    if (!window.confirm(`Delete ${record.test_name} report?`)) return;
    try {
      await api.delete(`/patients/me/records/${record.id}`);
      qc.invalidateQueries({ queryKey: ['medical-records'] });
    } catch { alert('Delete failed.'); }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px', fontFamily: 'var(--font-body)' }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={handleFileChange}/>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Medical Records</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Upload and manage your diagnostic and pathological reports — shared securely with your doctor</p>
      </div>

      {/* Uploaded records summary */}
      {records && records.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32 }}>📁</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{records.length} reports uploaded</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              {records.filter((r: any) => r.category === 'diagnostic').length} diagnostic · {records.filter((r: any) => r.category === 'pathological').length} pathological
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {records.slice(0, 3).map((r: any) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--r-full)', background: r.category === 'diagnostic' ? '#EFF6FF' : '#F5F3FF', color: r.category === 'diagnostic' ? '#2563EB' : '#7C3AED', fontSize: 11, fontWeight: 500 }}>
                {r.category === 'diagnostic' ? '🔬' : '🧪'} {r.test_name}
                <span onClick={() => handleView(r)} style={{ cursor: 'pointer', marginLeft: 2 }}>👁️</span>
                <span onClick={() => handleDelete(r)} style={{ cursor: 'pointer', color: 'var(--error)' }}>✕</span>
              </div>
            ))}
            {records.length > 3 && <div style={{ padding: '4px 10px', borderRadius: 'var(--r-full)', background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11 }}>+{records.length - 3} more</div>}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => { setActiveCategory(c.id as any); setSearch(''); setPage(0); }} style={{
            flex: 1, padding: '12px 16px', borderRadius: 'var(--r-lg)', cursor: 'pointer', transition: 'all 0.2s',
            border: `2px solid ${activeCategory === c.id ? c.color : 'var(--border)'}`,
            background: activeCategory === c.id ? `${c.color}10` : '#fff',
            color: activeCategory === c.id ? c.color : 'var(--text-secondary)',
            fontSize: 14, fontWeight: activeCategory === c.id ? 700 : 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 20 }}>{c.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div>{c.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{c.tests.length}+ tests</div>
            </div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-muted)' }}>🔍</span>
        <input placeholder={`Search ${cat.label.toLowerCase()}...`} value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{ width: '100%', padding: '11px 16px 11px 44px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as any }}/>
        {search && <button onClick={() => { setSearch(''); setPage(0); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--text-muted)' }}>✕</button>}
      </div>

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        Showing {paged.length} of {filtered.length} tests {search && `matching "${search}"`}
      </div>

      {/* Tests list */}
      <div style={{ background: '#fff', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 12 }}>
        {paged.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No tests found</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Add your test manually below</div>
            <button onClick={() => { setShowCustom(true); setCustomTest(search); }} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', background: cat.color, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Add "{search}"
            </button>
          </div>
        ) : paged.map((test, i) => {
          const record = getRecord(test);
          const isUploading = uploading === test;
          return (
            <div key={test} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
              borderBottom: i < paged.length - 1 ? '1px solid var(--border)' : 'none',
              background: record ? `${cat.color}06` : '#fff',
              transition: 'background 0.1s',
            }}>
              <div style={{ flex: 1, fontSize: 13, color: record ? cat.color : 'var(--text-primary)', fontWeight: record ? 600 : 400 }}>
                {test}
                {record && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>• {record.file_name} • {new Date(record.report_date).toLocaleDateString('en-IN')}</span>}
              </div>
              {record ? (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => handleView(record)} style={{ padding: '5px 12px', borderRadius: 'var(--r-md)', border: `1px solid ${cat.color}`, background: `${cat.color}10`, color: cat.color, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    👁️ View
                  </button>
                  <button onClick={() => handleUploadClick(test)} style={{ padding: '5px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer' }}>
                    🔄 Replace
                  </button>
                  <button onClick={() => handleDelete(record)} style={{ padding: '5px 12px', borderRadius: 'var(--r-md)', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              ) : (
                <button onClick={() => handleUploadClick(test)} disabled={isUploading} style={{
                  padding: '6px 16px', borderRadius: 'var(--r-md)', border: `1.5px solid ${cat.color}`,
                  background: isUploading ? 'var(--border)' : `${cat.color}10`,
                  color: isUploading ? 'var(--text-muted)' : cat.color,
                  fontSize: 12, fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {isUploading ? '⏳ Uploading...' : '📤 Upload'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '6px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{ padding: '6px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13 }}>
            Next →
          </button>
        </div>
      )}

      {/* Custom test upload */}
      <div style={{ marginBottom: 16 }}>
        {!showCustom ? (
          <button onClick={() => setShowCustom(true)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-md)', border: '1.5px dashed var(--border)', background: '#fff', fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>
            + Can't find your test? Upload with custom name
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, padding: 14, background: '#fff', borderRadius: 'var(--r-lg)', border: `1.5px solid ${cat.color}` }}>
            <input autoFocus placeholder="Enter test name (e.g. Special Blood Panel)..." value={customTest} onChange={e => setCustomTest(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomUpload()}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}/>
            <button onClick={handleCustomUpload} disabled={!customTest.trim()} style={{ padding: '8px 16px', borderRadius: 'var(--r-md)', background: customTest.trim() ? cat.color : 'var(--border)', color: customTest.trim() ? '#fff' : 'var(--text-muted)', border: 'none', fontSize: 13, fontWeight: 600, cursor: customTest.trim() ? 'pointer' : 'not-allowed' }}>
              Upload
            </button>
            <button onClick={() => { setShowCustom(false); setCustomTest(''); }} style={{ padding: '8px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Security note */}
      <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        🔒 <strong>Privacy:</strong> Your reports are encrypted and stored securely on Cloudflare R2. Only you and doctors you consult with can access them. Accepted formats: PDF, JPG, PNG, WebP (max 10MB).
      </div>
    </div>
  );
}
