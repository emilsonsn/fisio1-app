export type RecordType = 'initial_assessment' | 'evolution';

export interface ClinicalRecordForm {
  patient_id: number;
  type: RecordType;
  performed_at: string;
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
  daily_complaint: string | null;
  pain_level: number | null;
  home_guidance_adherence: string | null;
  therapeutic_conduct: string | null;
  session_final_impression: string | null;
  observations: string | null;
}

export function emptyClinicalRecordForm(): ClinicalRecordForm {
  return {
    patient_id: 0,
    type: 'initial_assessment',
    performed_at: new Date().toISOString().slice(0, 10),
    indication: '',
    birthplace: '',
    marital_status: '',
    gender: '',
    profession: '',
    address: '',
    chief_complaint: '',
    condition_history: '',
    life_habits: '',
    personal_family_history: '',
    previous_treatments: '',
    physical_examination: '',
    complementary_exams: '',
    physical_therapy_diagnosis: '',
    cbdf: '',
    planned_sessions: null,
    resources_methods_techniques: '',
    therapeutic_objectives: '',
    physical_therapy_prognosis: '',
    daily_complaint: '',
    pain_level: null,
    home_guidance_adherence: '',
    therapeutic_conduct: '',
    session_final_impression: '',
    observations: '',
  };
}
