import { ClinicalRecordStatus } from './clinical-record.model';
import { Patient } from './patient.model';
import { User } from './user.model';

export type PatientHistoryEntryType = 'initial_assessment' | 'evolution';

export interface PatientHistorySummary {
  total_records: number;
  total_assessments: number;
  total_evolutions: number;
  first_record_at: string | null;
  last_record_at: string | null;
  initial_pain_level: number | null;
  current_pain_level: number | null;
  pain_change: number | null;
}

export interface PatientHistoryEntry {
  id: number;
  type: PatientHistoryEntryType;
  recorded_at: string;
  status: ClinicalRecordStatus;
  professional: User;
  attachment_count: number;
  pain_level: number | null;
  fields: Record<string, string | null>;
}

export interface PatientHistory {
  patient: Patient;
  summary: PatientHistorySummary;
  timeline: PatientHistoryEntry[];
}
