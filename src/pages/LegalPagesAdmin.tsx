import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

const CATEGORIES = [
  { id: 'public', label: 'Public Pages', icon: '🌐' },
  { id: 'doctor', label: 'Doctor Portal', icon: '👨‍⚕️' },
  { id: 'patient', label: 'Patient Portal', icon: '🏥' },
];

const DEFAULT_PAGES = [
  // Public
  { slug:'about', title:'About WellConsult', category:'public', sort_order:1, content:`<h2>About WellConsult</h2><p>WellConsult is India's premier holistic healthcare consultation platform connecting patients with verified practitioners across all major medical systems including Allopathy, Homeopathy, Ayurveda, Yoga Therapy, Naturopathy, and Unani.</p><h3>Our Mission</h3><p>To make quality healthcare accessible to everyone, anywhere, anytime — through technology-driven consultations with verified and experienced practitioners.</p><h3>Our Vision</h3><p>A world where every person has access to the right healthcare guidance, regardless of geography or time.</p><h3>What We Offer</h3><ul><li>Video, audio and text consultations with verified doctors</li><li>Emergency consultations available 24/7</li><li>Secure digital prescriptions</li><li>Medical record management</li><li>Multi-system healthcare — Allopathy, Ayurveda, Homeopathy and more</li></ul><h3>Contact Us</h3><p>Email: support@wellconsult.in | Phone: 1800-XXX-XXXX</p>` },
  { slug:'contact', title:'Contact Us', category:'public', sort_order:2, content:`<h2>Contact Us</h2><p>We're here to help. Reach out to us through any of the following channels:</p><h3>General Support</h3><p>Email: support@wellconsult.in<br>Phone: 1800-XXX-XXXX (Toll Free)<br>Hours: Monday to Saturday, 9 AM – 6 PM IST</p><h3>Medical Emergencies</h3><p>For life-threatening emergencies, please call <strong>112</strong> (National Emergency) or visit your nearest hospital immediately. WellConsult is not an emergency medical service.</p><h3>Grievances</h3><p>Email: grievance@wellconsult.in<br>Grievance Officer: [Name], Contact: grievance@wellconsult.in<br>Response time: Within 48 business hours</p><h3>Registered Office</h3><p>WellConsult Healthcare Pvt. Ltd.<br>[Address], India</p>` },
  { slug:'terms', title:'Terms of Service', category:'public', sort_order:3, content:`<h2>Terms of Service</h2><p><strong>Last Updated: August 2026</strong></p><p>By accessing or using WellConsult ("Platform"), you agree to be bound by these Terms of Service. Please read them carefully.</p><h3>1. Acceptance of Terms</h3><p>By registering on WellConsult, you confirm that you are 18 years or older and agree to these terms. If you are registering on behalf of a minor, you take full responsibility for their use of the platform.</p><h3>2. Nature of Services</h3><p>WellConsult provides a technology platform that facilitates teleconsultation between patients and registered medical practitioners. WellConsult itself does not practice medicine or provide medical advice.</p><h3>3. Not an Emergency Service</h3><p>WellConsult is NOT an emergency medical service. For emergencies, call 112 or visit your nearest hospital immediately.</p><h3>4. User Accounts</h3><p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate, complete, and current information during registration.</p><h3>5. Prohibited Uses</h3><p>You may not use the platform to: provide false information, impersonate others, share consultation content without consent, or use the platform for any unlawful purpose.</p><h3>6. Fees and Payments</h3><p>Consultation fees are displayed before booking. Refunds are subject to our Refund & Cancellation Policy.</p><h3>7. Intellectual Property</h3><p>All content on WellConsult is proprietary. You may not reproduce, distribute, or create derivative works without written permission.</p><h3>8. Limitation of Liability</h3><p>WellConsult's liability is limited to the fees paid for the specific consultation. We are not liable for medical outcomes, missed diagnoses, or treatment decisions.</p><h3>9. Governing Law</h3><p>These terms are governed by the laws of India. Disputes shall be subject to jurisdiction of courts in [City], India.</p>` },
  { slug:'privacy', title:'Privacy Policy', category:'public', sort_order:4, content:`<h2>Privacy Policy</h2><p><strong>Last Updated: August 2026</strong></p><p>WellConsult Healthcare Pvt. Ltd. is committed to protecting your personal and medical information.</p><h3>1. Information We Collect</h3><ul><li>Personal information: Name, email, phone, date of birth</li><li>Medical information: Health history, symptoms, prescriptions, lab reports</li><li>Usage data: App usage, consultation history, device information</li><li>Payment information: Processed securely via Razorpay (we do not store card details)</li></ul><h3>2. How We Use Your Information</h3><ul><li>To facilitate consultations between patients and doctors</li><li>To send appointment reminders and health notifications</li><li>To improve our platform and services</li><li>To comply with legal obligations under the IT Act, 2000 and DPDP Act, 2023</li></ul><h3>3. Data Sharing</h3><p>We share your data only with: the doctor you consult with, payment processors, and regulatory authorities when legally required. We never sell your data.</p><h3>4. Data Security</h3><p>Your medical data is encrypted at rest and in transit. We use Cloudflare for security and follow industry best practices.</p><h3>5. Your Rights</h3><p>You have the right to access, correct, and delete your data. Contact privacy@wellconsult.in for any data requests.</p><h3>6. Data Retention</h3><p>Medical records are retained for 7 years as required by law. You may request deletion of non-medical personal data at any time.</p><h3>7. Cookies</h3><p>We use essential cookies only. No advertising or tracking cookies are used.</p>` },
  { slug:'teleconsultation-terms', title:'Teleconsultation Terms', category:'public', sort_order:5, content:`<h2>Teleconsultation Terms</h2><p>These terms apply specifically to video, audio, and text-based medical consultations conducted through WellConsult.</p><h3>1. Nature of Teleconsultation</h3><p>Teleconsultation is a remote medical consultation and is not a substitute for in-person examination where physical examination is necessary. The quality of consultation depends on the accuracy of information provided by the patient.</p><h3>2. Technical Requirements</h3><p>You are responsible for ensuring adequate internet connectivity, a functioning device with camera and microphone (for video consultations), and a private, quiet environment for your consultation.</p><h3>3. Recording Prohibition</h3><p>Recording of any consultation session without explicit consent of all parties is strictly prohibited and may be illegal under applicable law.</p><h3>4. Prescriptions</h3><p>Digital prescriptions issued through WellConsult are valid and comply with the Telemedicine Practice Guidelines, 2020 issued by the Ministry of Health & Family Welfare, Government of India.</p><h3>5. Limitation</h3><p>Some conditions require physical examination and cannot be adequately assessed via teleconsultation. In such cases, your doctor will advise you to visit in person.</p>` },
  { slug:'refund-policy', title:'Refund & Cancellation Policy', category:'public', sort_order:6, content:`<h2>Refund & Cancellation Policy</h2><h3>Patient Cancellations</h3><ul><li><strong>Cancelled 24+ hours before appointment:</strong> Full refund within 5-7 business days</li><li><strong>Cancelled 2-24 hours before appointment:</strong> 50% refund</li><li><strong>Cancelled less than 2 hours before:</strong> No refund</li><li><strong>No-show:</strong> No refund</li></ul><h3>Doctor Cancellations</h3><p>If a doctor cancels or fails to attend: Full refund + priority rebooking at discounted rate.</p><h3>Technical Issues</h3><p>If consultation cannot be completed due to platform technical issues: Full refund or free rescheduling at patient's choice.</p><h3>15-Minute SLA</h3><p>If a doctor does not respond within 15 minutes of the scheduled consultation start time: Full automatic refund within 24 hours.</p><h3>Refund Processing</h3><p>Refunds are processed to the original payment method within 5-7 business days. For UPI/wallet payments, refunds may take 1-3 business days.</p>` },
  { slug:'verification-policy', title:'Doctor/Practitioner Verification Policy', category:'public', sort_order:7, content:`<h2>Doctor & Practitioner Verification Policy</h2><p>WellConsult is committed to ensuring all practitioners on our platform are qualified, registered, and safe to practice.</p><h3>Verification Requirements</h3><p>All practitioners must submit:</p><ul><li>Degree Certificate (MBBS, BAMS, BHMS, or equivalent)</li><li>Registration Certificate from NMC, State Medical Council, or relevant regulatory body</li><li>Valid Government-issued Photo ID</li><li>Professional photograph</li></ul><h3>Verification Process</h3><ol><li>Document submission via secure upload</li><li>Document verification by our credentialing team (24-48 hours)</li><li>Cross-verification with NMC/State Medical Council registry where possible</li><li>Profile activation only after successful verification</li></ol><h3>Ongoing Compliance</h3><p>Practitioners must notify WellConsult of any changes to their registration status, disciplinary action, or legal proceedings within 7 days.</p><h3>Suspension</h3><p>WellConsult reserves the right to suspend or remove any practitioner found to have provided false credentials or engaged in unprofessional conduct.</p>` },
  { slug:'grievance', title:'Grievance Redressal', category:'public', sort_order:8, content:`<h2>Grievance Redressal Policy</h2><h3>How to File a Grievance</h3><p>Email: grievance@wellconsult.in<br>Subject: Grievance - [Your Name] - [Nature of Complaint]</p><h3>Grievance Officer</h3><p>Name: [Grievance Officer Name]<br>Email: grievance@wellconsult.in<br>Phone: [Phone Number]</p><h3>Response Timeline</h3><ul><li>Acknowledgment: Within 24 hours</li><li>Resolution: Within 15 business days for standard complaints</li><li>Escalation to DPDP authority: If unresolved within 30 days</li></ul><h3>Types of Complaints</h3><ul><li>Doctor conduct/professional behavior</li><li>Prescription disputes</li><li>Refund issues</li><li>Data privacy concerns</li><li>Platform technical issues</li><li>Billing disputes</li></ul><h3>Escalation</h3><p>If your complaint is not resolved satisfactorily, you may escalate to: National Medical Commission, State Medical Council, or Consumer Forum.</p>` },
  { slug:'medical-disclaimer', title:'Medical Disclaimer', category:'public', sort_order:9, content:`<h2>Medical Disclaimer</h2><p><strong>IMPORTANT: PLEASE READ CAREFULLY</strong></p><p>The information and services provided on WellConsult are for informational and teleconsultation purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment from a qualified healthcare provider who has examined you in person.</p><h3>No Doctor-Patient Relationship</h3><p>Use of this platform does not create a doctor-patient relationship between you and WellConsult. A doctor-patient relationship is established only when a registered practitioner on our platform agrees to treat you.</p><h3>Emergency Warning</h3><p><strong>IF YOU THINK YOU HAVE A MEDICAL EMERGENCY, CALL 112 IMMEDIATELY OR GO TO THE NEAREST EMERGENCY ROOM. DO NOT USE THIS PLATFORM FOR EMERGENCIES.</strong></p><h3>Accuracy of Information</h3><p>Medical knowledge evolves constantly. While we strive to keep information current, WellConsult does not guarantee the accuracy, completeness, or timeliness of any medical information on the platform.</p><h3>Individual Results May Vary</h3><p>Medical treatments and outcomes vary by individual. Information provided during consultations is based on the details you provide and may not account for all aspects of your health.</p>` },
  { slug:'emergency-disclaimer', title:'Emergency Medical Disclaimer', category:'public', sort_order:10, content:`<h2>Emergency Medical Disclaimer</h2><div style="background:#fee2e2;border:2px solid #dc2626;padding:16px;border-radius:8px;margin:16px 0"><strong>⚠️ CRITICAL: WellConsult IS NOT AN EMERGENCY SERVICE</strong></div><h3>For Medical Emergencies</h3><p>If you or someone near you is experiencing a medical emergency, <strong>DO NOT</strong> use WellConsult. Instead:</p><ul><li>Call <strong>112</strong> (National Emergency Number)</li><li>Call <strong>108</strong> (Ambulance Service)</li><li>Go immediately to the nearest hospital emergency department</li></ul><h3>What Constitutes an Emergency</h3><ul><li>Chest pain or difficulty breathing</li><li>Loss of consciousness</li><li>Severe bleeding or trauma</li><li>Stroke symptoms (FAST: Face drooping, Arm weakness, Speech difficulty, Time to call)</li><li>Severe allergic reactions</li><li>Drug overdose or poisoning</li><li>Any condition that is immediately life-threatening</li></ul><h3>WellConsult's Scope</h3><p>WellConsult is designed for non-emergency consultations only. Our response time SLA of 15 minutes applies to scheduled consultations and is NOT appropriate for emergency care.</p>` },
  // Doctor portal
  { slug:'practitioner-agreement', title:'Practitioner Agreement', category:'doctor', sort_order:1, content:`<h2>Practitioner Agreement</h2><p>This agreement governs your participation as a practitioner on WellConsult. By completing registration and verification, you agree to these terms.</p><h3>1. Eligibility</h3><p>You confirm that you: hold a valid medical degree recognized in India, are registered with the appropriate regulatory body (NMC, State Medical Council, etc.), are not under any disciplinary action, and are legally permitted to practice telemedicine.</p><h3>2. Telemedicine Compliance</h3><p>You agree to comply with the Telemedicine Practice Guidelines 2020, MCI/NMC regulations, and all applicable state medical council regulations.</p><h3>3. Professional Standards</h3><p>You commit to maintaining professional standards, providing consultations based on evidence-based medicine, not prescribing prohibited substances, and referring patients for in-person care when clinically necessary.</p><h3>4. Fees and Earnings</h3><p>WellConsult deducts a platform commission from consultation fees. Earnings are transferred weekly to your registered bank account.</p><h3>5. Termination</h3><p>Either party may terminate this agreement with 30 days notice. WellConsult may terminate immediately for breach of professional standards.</p>` },
  { slug:'code-of-conduct', title:'Code of Conduct', category:'doctor', sort_order:2, content:`<h2>Practitioner Code of Conduct</h2><h3>Professional Behavior</h3><ul><li>Treat all patients with dignity and respect regardless of gender, religion, caste, or economic status</li><li>Maintain strict patient confidentiality</li><li>Do not engage in any form of discrimination</li><li>Dress professionally for video consultations</li><li>Be punctual for scheduled appointments</li></ul><h3>Clinical Standards</h3><ul><li>Provide consultations only within your area of competence</li><li>Prescribe medications only when clinically indicated and within telemedicine guidelines</li><li>Do not prescribe Schedule X or prohibited medications via teleconsultation</li><li>Maintain adequate consultation records</li><li>Refer patients to in-person care when necessary</li></ul><h3>Communication</h3><ul><li>Respond to patient queries within 15 minutes during active consultation hours</li><li>Communicate clearly and in the patient's preferred language when possible</li><li>Do not use derogatory or inappropriate language</li></ul><h3>Violations</h3><p>Violations of this Code of Conduct may result in suspension, termination, and/or reporting to the relevant medical regulatory authority.</p>` },
  { slug:'data-confidentiality', title:'Data Confidentiality Agreement', category:'doctor', sort_order:3, content:`<h2>Data Confidentiality Agreement</h2><p>As a practitioner on WellConsult, you have access to sensitive patient health information. This agreement outlines your obligations regarding data confidentiality.</p><h3>Your Obligations</h3><ul><li>Maintain strict confidentiality of all patient information accessed through WellConsult</li><li>Do not share, copy, or transmit patient data outside the WellConsult platform</li><li>Do not discuss patient cases on social media or public forums, even without identifying information</li><li>Report any suspected data breach immediately to privacy@wellconsult.in</li></ul><h3>Permitted Use</h3><p>Patient data may be used solely for: providing the requested consultation, clinical record keeping within the platform, and mandatory reporting to regulatory authorities.</p><h3>Consequences of Breach</h3><p>Breach of this agreement may result in: immediate account termination, civil liability under DPDP Act 2023, criminal liability under IT Act 2000, and reporting to your medical regulatory body.</p>` },
  // Doctor portal - missing pages
  { slug:'verification-requirements', title:'Verification Requirements', category:'doctor', sort_order:3, content:`<h2>Verification Requirements</h2><p>All practitioners must meet the following requirements before being approved on WellConsult.</p><h3>Mandatory Documents</h3><ul><li><strong>Degree Certificate:</strong> MBBS, BAMS, BHMS, BUMS, BNYS, or equivalent recognized degree</li><li><strong>Registration Certificate:</strong> Valid registration with NMC, State Medical Council, Central Council of Indian Medicine (CCIM), or Central Council of Homeopathy (CCH)</li><li><strong>Government Photo ID:</strong> Aadhaar Card, Passport, or PAN Card</li><li><strong>Professional Photo:</strong> Recent clear photograph in professional attire</li></ul><h3>Additional Requirements</h3><ul><li>Minimum 1 year of post-graduation clinical experience</li><li>Valid registration (not expired or suspended)</li><li>No active disciplinary proceedings</li><li>Completion of WellConsult onboarding including profile, fees, and availability setup</li></ul><h3>Verification Timeline</h3><p>Document review is completed within 24-48 business hours. You will be notified by email of approval or rejection with reasons.</p>` },
  { slug:'professional-liability', title:'Professional Liability & Responsibility', category:'doctor', sort_order:4, content:`<h2>Professional Liability & Responsibility</h2><h3>Your Professional Responsibility</h3><p>As a registered practitioner on WellConsult, you retain full professional responsibility for all medical opinions, diagnoses, and prescriptions you provide through the platform.</p><h3>Liability</h3><ul><li>WellConsult is a technology platform and does not assume liability for clinical decisions made by practitioners</li><li>You are solely responsible for the medical advice you provide</li><li>You must carry adequate professional indemnity insurance</li><li>Any claims arising from your consultations are your professional responsibility</li></ul><h3>Professional Indemnity Insurance</h3><p>We strongly recommend that all practitioners maintain professional indemnity insurance coverage appropriate for teleconsultation practice. WellConsult may require proof of insurance for premium tier practitioners.</p><h3>Reporting Adverse Events</h3><p>Any adverse events or patient complaints related to consultations must be reported to WellConsult within 24 hours at safety@wellconsult.in</p>` },
  { slug:'prescription-requirements', title:'Prescription Requirements', category:'doctor', sort_order:5, content:`<h2>Prescription Requirements</h2><p>Digital prescriptions issued through WellConsult must comply with the Telemedicine Practice Guidelines 2020 and applicable pharmacy regulations.</p><h3>What You Can Prescribe</h3><ul><li>OTC (Over The Counter) medications — freely via teleconsultation</li><li>Schedule H medications — permissible via video/audio consultation with proper clinical assessment</li><li>Schedule H1 medications — only after an in-person consultation has established the doctor-patient relationship</li></ul><h3>What You Cannot Prescribe via Teleconsultation</h3><ul><li>Schedule X medications (narcotics, psychotropics)</li><li>Medications requiring mandatory physical examination</li><li>Abortifacients without proper counseling</li></ul><h3>Prescription Format</h3><p>All prescriptions must include: Doctor name, registration number, qualification, date, patient name, age, medicine name, dosage, frequency, duration, and any special instructions.</p><h3>Record Keeping</h3><p>Maintain prescription records for a minimum of 3 years as required by law.</p>` },
  { slug:'teleconsultation-requirements', title:'Teleconsultation Requirements', category:'doctor', sort_order:6, content:`<h2>Teleconsultation Requirements</h2><h3>Technical Requirements</h3><ul><li>Stable internet connection (minimum 5 Mbps for video consultations)</li><li>Functioning webcam and microphone</li><li>Professional, well-lit, private environment</li><li>A device capable of running WellConsult (laptop/desktop recommended)</li></ul><h3>Professional Conduct During Consultations</h3><ul><li>Be ready and available at the scheduled consultation time</li><li>Dress professionally — formal or semi-formal attire for video consultations</li><li>Ensure your background is clean and professional</li><li>Do not conduct consultations from moving vehicles or public spaces</li><li>Maintain full attention — do not engage in other activities during consultations</li></ul><h3>Response Time SLA</h3><ul><li>Video/Audio consultations: Be available within 5 minutes of scheduled time</li><li>Text questions: Respond within 15 minutes during active hours</li><li>Emergency consultations: Accept or decline within 2 minutes</li></ul><h3>Documentation</h3><p>Complete consultation notes within 24 hours of each consultation. Include chief complaint, assessment, and management plan.</p>` },
  { slug:'suspension-termination', title:'Suspension & Termination Policy', category:'doctor', sort_order:8, content:`<h2>Suspension & Termination Policy</h2><h3>Grounds for Immediate Suspension</h3><ul><li>Patient safety concerns or complaints of harm</li><li>Discovery of fraudulent credentials</li><li>Prescription of prohibited substances</li><li>Sexual misconduct or harassment</li><li>Breach of patient confidentiality</li><li>Active suspension by medical regulatory body</li></ul><h3>Grounds for Warning/Suspension</h3><ul><li>Repeated failure to meet response time SLA</li><li>Multiple patient complaints</li><li>Unprofessional conduct</li><li>Failure to maintain updated credentials</li><li>Violation of prescription guidelines</li></ul><h3>Process</h3><ol><li>Warning issued with details of violation</li><li>7-day opportunity to respond and rectify</li><li>If unresolved, temporary suspension pending review</li><li>Review committee decision within 15 days</li><li>Appeals to be submitted within 7 days of decision</li></ol><h3>Termination</h3><p>Termination results in removal from platform, reporting to relevant medical council if clinically indicated, and forfeiture of pending earnings if termination is due to misconduct.</p>` },

  // Patient portal - missing pages
    // Patient portal
  { slug:'patient-consent', title:'Patient Consent', category:'patient', sort_order:1, content:`<h2>Patient Consent for Teleconsultation</h2><p>By booking a consultation on WellConsult, you provide informed consent for the following:</p><h3>I Understand and Consent That</h3><ul><li>I am voluntarily seeking teleconsultation and understand its limitations compared to in-person consultation</li><li>The doctor cannot physically examine me and their assessment is based on information I provide</li><li>I will provide accurate and complete medical history and current symptoms</li><li>The consultation may not be sufficient for all medical conditions and I may be referred for in-person care</li><li>Digital prescriptions issued are valid under Telemedicine Practice Guidelines 2020</li><li>My consultation details will be securely stored and may be accessed by the consulting doctor</li><li>I may withdraw consent at any time by discontinuing the consultation</li></ul><h3>Emergencies</h3><p>I understand that WellConsult is NOT an emergency service and I will call 112 or go to a hospital for emergencies.</p>` },
  { slug:'consultation-consent', title:'Consultation Consent', category:'patient', sort_order:2, content:`<h2>Consultation Consent</h2><p>Before proceeding with your consultation, please confirm your understanding of the following:</p><h3>Video Consultation</h3><p>For video consultations, I consent to appearing on video and audio communication with my consulting doctor. I understand this is a private, secure connection.</p><h3>Recording</h3><p>I understand that WellConsult does not record consultations. I will not record the consultation without the doctor's explicit consent.</p><h3>Second Opinion</h3><p>I understand that the opinion provided is that of the individual doctor and I have the right to seek a second opinion from another practitioner.</p><h3>Treatment Decisions</h3><p>I retain the right to accept or refuse any treatment recommendation. The doctor's advice is a recommendation and the final decision is mine.</p>` },
  { slug:'privacy-consent', title:'Privacy Consent', category:'patient', sort_order:3, content:`<h2>Privacy Consent</h2><p>Your health information is sensitive and we take its protection seriously.</p><h3>What You Consent To</h3><ul><li>Collection and storage of your personal and medical information</li><li>Sharing of your medical information with your consulting doctor(s)</li><li>Use of anonymized, aggregated data for platform improvement</li><li>Storage of consultation records for 7 years as required by law</li></ul><h3>Your Rights</h3><ul><li>Right to access your data at any time through your profile</li><li>Right to correct inaccurate information</li><li>Right to request deletion of non-clinical personal data</li><li>Right to withdraw consent (which will prevent future consultations)</li></ul><h3>Data Protection Officer</h3><p>Contact: privacy@wellconsult.in</p>` },
  { slug:'emergency-care-warning', title:'Emergency Care Warning', category:'patient', sort_order:4, content:`<h2>Emergency Care Warning</h2><div style="background:#fee2e2;border:2px solid #dc2626;padding:20px;border-radius:8px"><h3 style="color:#dc2626">⚠️ DO NOT USE WELLCONSULT FOR EMERGENCIES</h3><p>WellConsult is a scheduled teleconsultation service. It is NOT suitable for medical emergencies.</p><p><strong>Emergency Numbers:</strong><br>National Emergency: <strong>112</strong><br>Ambulance: <strong>108</strong><br>Police: <strong>100</strong></p></div><h3>Recognize an Emergency</h3><p>Seek emergency care immediately if you experience: chest pain, difficulty breathing, loss of consciousness, severe bleeding, suspected stroke, severe allergic reaction, or any condition you believe is life-threatening.</p>` },
  { slug:'patient-refund-terms', title:'Refund Terms', category:'patient', sort_order:4, content:`<h2>Refund Terms for Patients</h2><h3>Your Refund Rights</h3><p>WellConsult is committed to fair and transparent refund policies.</p><h3>Automatic Refunds</h3><ul><li><strong>Doctor no-show:</strong> Full refund within 24 hours if doctor does not join within 15 minutes</li><li><strong>Technical failure:</strong> Full refund if consultation cannot proceed due to platform issues</li><li><strong>Payment error:</strong> Immediate reversal of duplicate or erroneous charges</li></ul><h3>Patient-Initiated Cancellations</h3><ul><li>24+ hours before: 100% refund</li><li>2-24 hours before: 50% refund</li><li>Less than 2 hours: No refund</li><li>After consultation starts: No refund</li></ul><h3>How to Request a Refund</h3><p>Email: refunds@wellconsult.in with your appointment ID and reason. Refunds are processed within 5-7 business days to your original payment method.</p><h3>Dispute Resolution</h3><p>If you are unsatisfied with a refund decision, escalate to grievance@wellconsult.in within 14 days.</p>` },
  { slug:'medical-record-access', title:'Medical Record Access Policy', category:'patient', sort_order:5, content:`<h2>Medical Record Access Policy</h2><h3>Your Records Are Yours</h3><p>All medical records, prescriptions, and health data on WellConsult belong to you. WellConsult acts as a custodian of your data on your behalf.</p><h3>Who Can Access Your Records</h3><ul><li><strong>You:</strong> Full access to all your records at all times</li><li><strong>Your consulting doctors:</strong> Can view records relevant to your consultation during and after the consultation period</li><li><strong>WellConsult staff:</strong> Only for technical support with your explicit permission, or as required by law</li><li><strong>No third parties:</strong> Your records are never sold or shared with insurers, employers, or marketers</li></ul><h3>Requesting Your Records</h3><p>You can download your records from the My Records section. For a complete data export, email records@wellconsult.in.</p><h3>Retention</h3><p>Medical consultation records are retained for 7 years as mandated by Indian medical regulations. Personal account data can be deleted upon request.</p>` },
];

export default function LegalPagesAdmin({ onView }: { onView?: (slug: string) => void }) {
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('public');
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ slug:'', title:'', category:'public', content:'', is_published:true, sort_order:0 });

  const { data: pages, isLoading } = useQuery({
    queryKey: ['legal-pages-admin'],
    queryFn: async () => {
      const { data } = await api.get('/legal/admin/all');
      return data.data as any[] || [];
    },
  });

  const categoryPages = (pages || []).filter((p: any) => p.category === activeCategory);

  const handleEdit = (page: any) => {
    setEditing(page);
    setForm({ slug: page.slug, title: page.title, category: page.category, content: page.content, is_published: page.is_published, sort_order: page.sort_order });
  };

  const handleNew = (category: string) => {
    setEditing('new');
    setForm({ slug:'', title:'', category, content:'', is_published:true, sort_order:0 });
  };

  const handleSeed = async () => {
    if (!window.confirm('This will create all default legal pages. Continue?')) return;
    setSaving(true);
    try {
      for (const page of DEFAULT_PAGES) {
        await api.post('/legal', page);
      }
      qc.invalidateQueries({ queryKey: ['legal-pages-admin'] });
      alert('All default legal pages created!');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to seed pages.');
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!form.slug || !form.title || !form.content) { alert('Slug, title and content are required.'); return; }
    setSaving(true);
    try {
      await api.post('/legal', form);
      qc.invalidateQueries({ queryKey: ['legal-pages-admin'] });
      setEditing(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await api.delete(`/legal/${slug}`);
      qc.invalidateQueries({ queryKey: ['legal-pages-admin'] });
    } catch { alert('Delete failed.'); }
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, color:'var(--text-primary)' }}>Legal Pages</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleSeed} disabled={saving} style={{ padding:'8px 16px', borderRadius:'var(--r-md)', background:'#F59E0B', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            🌱 Seed Default Pages
          </button>
          <button onClick={() => handleNew(activeCategory)} style={{ padding:'8px 16px', borderRadius:'var(--r-md)', background:'var(--primary)', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            + New Page
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)} style={{
            padding:'8px 16px', borderRadius:'var(--r-md)', cursor:'pointer',
            border:`1.5px solid ${activeCategory===c.id ? 'var(--primary)' : 'var(--border)'}`,
            background: activeCategory===c.id ? 'var(--primary-light)' : '#fff',
            color: activeCategory===c.id ? 'var(--primary)' : 'var(--text-secondary)',
            fontSize:13, fontWeight: activeCategory===c.id ? 600 : 400,
          }}>
            {c.icon} {c.label} ({(pages||[]).filter((p:any)=>p.category===c.id).length})
          </button>
        ))}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:'var(--r-xl)', padding:28, maxWidth:760, width:'100%', boxShadow:'var(--shadow-xl)', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, marginBottom:20 }}>
              {editing === 'new' ? 'New Page' : 'Edit Page'}
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>Slug (URL)</label>
                <input value={form.slug} onChange={e => setForm(f => ({...f, slug:e.target.value}))} placeholder="e.g. privacy-policy"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>Title</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="Page title"
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', background:'#fff' }}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>Sort Order</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order:parseInt(e.target.value)||0}))}
                  style={{ width:'100%', padding:'9px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:13, outline:'none', boxSizing:'border-box' as any }}/>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, paddingBottom:2 }}>
                <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({...f, is_published:e.target.checked}))}/>
                  Published
                </label>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4 }}>Content (HTML)</label>
              <textarea value={form.content} onChange={e => setForm(f => ({...f, content:e.target.value}))} rows={16}
                style={{ width:'100%', padding:'10px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', fontSize:12, outline:'none', fontFamily:'monospace', resize:'vertical' as any, boxSizing:'border-box' as any }}/>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setEditing(null)} style={{ padding:'10px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', fontSize:14, cursor:'pointer', color:'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'10px', borderRadius:'var(--r-md)', border:'none', background: saving ? 'var(--border)' : 'var(--primary)', color: saving ? 'var(--text-muted)' : '#fff', fontSize:14, fontWeight:600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : '💾 Save Page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages list */}
      {isLoading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Loading...</div>
      ) : categoryPages.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:'var(--r-xl)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📄</div>
          <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>No pages yet</div>
          <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:16 }}>Click "Seed Default Pages" to create all legal pages at once</div>
          <button onClick={handleSeed} style={{ padding:'10px 20px', borderRadius:'var(--r-md)', background:'#F59E0B', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            🌱 Seed Default Pages
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {categoryPages.map((page: any) => (
            <div key={page.id} style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{page.title}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:'var(--r-full)', background: page.is_published ? '#ECFDF5' : '#FEF3C7', color: page.is_published ? '#065F46' : '#92400E' }}>
                    {page.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  /legal/{page.slug} · Updated {new Date(page.updated_at).toLocaleDateString('en-IN')}
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => onView && onView(page.slug)}
                  style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'#fff', color:'var(--text-secondary)', fontSize:12, cursor:'pointer' }}>
                  👁️ View
                </button>
                <button onClick={() => handleEdit(page)} style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid var(--primary)', background:'var(--primary-light)', color:'var(--primary)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleDelete(page.slug)} style={{ padding:'6px 12px', borderRadius:'var(--r-md)', border:'1px solid #FECACA', background:'#FEF2F2', color:'#DC2626', fontSize:12, cursor:'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
