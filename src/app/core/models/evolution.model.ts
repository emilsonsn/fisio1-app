import { ClinicalAiProcess } from './clinical-ai-process.model';
import { ClinicalRecordStatus } from './clinical-record.model';
import { Patient } from './patient.model';
import { RecordAttachment } from './record-attachment.model';
import { User } from './user.model';

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
  status: ClinicalRecordStatus;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;
  ai_process: ClinicalAiProcess | null;
  patient: Patient;
  professional: User;
  attachments: RecordAttachment[];
}
