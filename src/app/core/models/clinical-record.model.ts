import { Patient } from './patient.model';
import { User } from './user.model';

export type ClinicalRecordType = 'initial_assessment' | 'evolution';
export type ClinicalRecordStatus = 'pending' | 'in_review' | 'completed' | 'failed';

export interface ClinicalRecordAttachmentSummary {
  id: number;
  name: string;
  download_url: string;
}

export interface ClinicalRecord {
  id: number;
  patient_id: number;
  professional_id: number;
  type: ClinicalRecordType;
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
  attachments: ClinicalRecordAttachmentSummary[];
}
