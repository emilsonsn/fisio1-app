export interface Patient {
  id: number;
  name: string;
  document: string;
  birth_date: string;
  age: number;
  phone: string;
  indication: string | null;
  birthplace: string | null;
  marital_status: string | null;
  gender: string | null;
  profession: string | null;
  address: string | null;
  email: string | null;
  notes: string | null;
  has_photo: boolean;
  is_deleted?: boolean;
  clinical_records_count?: number;
  created_at: string;
}
