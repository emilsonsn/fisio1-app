import { ClinicalRecord } from './clinical-record.model';

export interface DashboardData {
  active_patients: number;
  initial_assessments: number;
  records_this_month: number;
  pending_records: number;
  recent_records: ClinicalRecord[];
}
