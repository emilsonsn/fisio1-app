export type ClinicalAiProcessStatus =
  'pending' | 'splitting' | 'transcribing' | 'consolidating' | 'completed' | 'failed';

export interface ClinicalAiProcess {
  id: number;
  status: ClinicalAiProcessStatus;
  chunks_count: number;
  processed_chunks: number;
  progress: number;
  error_message: string | null;
}
