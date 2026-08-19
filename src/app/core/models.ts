export interface Permission {
  id: number;
  key: string;
  name: string;
  module: string;
  description: string | null;
}
export interface AccessGroup {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Permission[];
  users_count?: number;
}
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  has_photo: boolean;
  access_groups: AccessGroup[];
  permissions?: string[];
}
export interface Patient {
  id: number;
  name: string;
  document: string;
  birth_date: string;
  phone: string;
  email: string | null;
  notes: string | null;
  has_photo: boolean;
  clinical_records_count?: number;
  created_at: string;
}
export interface ClinicalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  type: 'initial_assessment' | 'evolution';
  performed_at: string;
  pain_level: number | null;
  complaint: string | null;
  history: string | null;
  functional_limitations: string | null;
  treatment_objective: string | null;
  physical_assessment: string | null;
  conduct: string | null;
  next_steps: string | null;
  observations: string | null;
  patient: Patient;
  professional: User;
  attachments: { id: number; name: string; download_url: string }[];
}
export interface RecordAttachment {
  id: number;
  name: string;
  mime_type: string;
  size: number;
  download_url: string;
}
export interface Assessment {
  id: number;
  patient_id: number;
  professional_id: number;
  assessed_at: string;
  indication: string | null;
  birthplace: string | null;
  marital_status: string | null;
  gender: string | null;
  profession: string | null;
  address: string | null;
  chief_complaint: string | null;
  condition_history: string | null;
  life_habits: string | null;
  personal_family_history: string | null;
  previous_treatments: string | null;
  physical_examination: string | null;
  complementary_exams: string | null;
  physical_therapy_diagnosis: string | null;
  cbdf: string | null;
  planned_sessions: number | null;
  resources_methods_techniques: string | null;
  therapeutic_objectives: string | null;
  physical_therapy_prognosis: string | null;
  patient: Patient;
  professional: User;
  attachments: RecordAttachment[];
}
export interface Evolution {
  id: number;
  patient_id: number;
  professional_id: number;
  evolved_at: string;
  daily_complaint: string | null;
  pain_level: number | null;
  home_guidance_adherence: string | null;
  therapeutic_conduct: string | null;
  session_final_impression: string | null;
  observations: string | null;
  patient: Patient;
  professional: User;
  attachments: RecordAttachment[];
}
export interface ApiCollection<T> {
  data: T[];
  meta?: { total: number };
}
export type ClinicalRecordStatus = 'pending' | 'in_review' | 'completed' | 'failed';
export interface ClinicalAiProcess {
  id: number;
  status: 'pending' | 'splitting' | 'transcribing' | 'consolidating' | 'completed' | 'failed';
  chunks_count: number;
  processed_chunks: number;
  progress: number;
  error_message: string | null;
}
export interface Assessment {
  status: ClinicalRecordStatus;
  confirmed_at: string | null;
  ai_process: ClinicalAiProcess | null;
}
export interface Evolution {
  status: ClinicalRecordStatus;
  confirmed_at: string | null;
  ai_process: ClinicalAiProcess | null;
}
