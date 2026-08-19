import { ClinicalAiProcess } from './clinical-ai-process.model';
import { ClinicalRecordStatus } from './clinical-record.model';
import { Patient } from './patient.model';
import { RecordAttachment } from './record-attachment.model';
import { User } from './user.model';

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
  status: ClinicalRecordStatus;
  confirmed_at: string | null;
  ai_process: ClinicalAiProcess | null;
  patient: Patient;
  professional: User;
  attachments: RecordAttachment[];
}
