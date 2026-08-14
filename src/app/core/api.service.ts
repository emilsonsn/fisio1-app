import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AccessGroup, ApiCollection, Assessment, ClinicalRecord, Evolution, Patient, Permission, User } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly base = 'https://fisio1.tech:3001/api/v1';
  constructor(private readonly http: HttpClient) {}
  login(email: string, password: string) { return firstValueFrom(this.http.post<{data:{user:User;token:string}}>(`${this.base}/auth/login`, { email, password, device_name: 'fisio1-angular' })); }
  forgotPassword(email: string) { return firstValueFrom(this.http.post<{message:string}>(`${this.base}/auth/forgot-password`, { email })); }
  me() { return firstValueFrom(this.http.get<{data:User}>(`${this.base}/auth/me`)); }
  dashboard() { return firstValueFrom(this.http.get<{data:{active_patients:number;initial_assessments:number;records_this_month:number;recent_records:ClinicalRecord[]}}>(`${this.base}/dashboard`)); }
  patients(search = '') { return firstValueFrom(this.http.get<ApiCollection<Patient>>(`${this.base}/patients`, { params: new HttpParams().set('search', search) })); }
  createPatient(payload: Partial<Patient>, photo?: File | null) { return firstValueFrom(this.http.post<{data:Patient}>(`${this.base}/patients`, this.patientFormData(payload, photo))); }
  updatePatient(id: number, payload: Partial<Patient>, photo?: File | null) { const form = this.patientFormData(payload, photo); form.append('_method', 'PATCH'); return firstValueFrom(this.http.post<{data:Patient}>(`${this.base}/patients/${id}`, form)); }
  records(patientId?: number) { const params = patientId ? new HttpParams().set('patient_id', patientId) : undefined; return firstValueFrom(this.http.get<ApiCollection<ClinicalRecord>>(`${this.base}/clinical-records`, { params })); }
  createRecord(form: FormData) { return firstValueFrom(this.http.post<{data:ClinicalRecord}>(`${this.base}/clinical-records`, form)); }
  processClinicalAudio(form: FormData) { return firstValueFrom(this.http.post<{data:{id:number; patient_id:number; type:'initial_assessment'|'evolution'; performed_at:string; transcript:string; fields:Record<string, unknown>}}>(`${this.base}/clinical-ai/process-audio`, form)); }
  assessments() { return firstValueFrom(this.http.get<ApiCollection<Assessment>>(`${this.base}/assessments`)); }
  evolutions() { return firstValueFrom(this.http.get<ApiCollection<Evolution>>(`${this.base}/evolutions`)); }
  assessment(id: number) { return firstValueFrom(this.http.get<{data:Assessment}>(`${this.base}/assessments/${id}`)); }
  evolution(id: number) { return firstValueFrom(this.http.get<{data:Evolution}>(`${this.base}/evolutions/${id}`)); }
  createAssessment(payload: object, attachments: File[] = []) { return firstValueFrom(this.http.post<{data:Assessment}>(`${this.base}/assessments`, this.recordFormData(payload, attachments))); }
  createEvolution(payload: object, attachments: File[] = []) { return firstValueFrom(this.http.post<{data:Evolution}>(`${this.base}/evolutions`, this.recordFormData(payload, attachments))); }
  addAssessmentAttachments(id: number, attachments: File[]) { const form = this.recordFormData({}, attachments); form.append('_method', 'PATCH'); return firstValueFrom(this.http.post<{data:Assessment}>(`${this.base}/assessments/${id}`, form)); }
  addEvolutionAttachments(id: number, attachments: File[]) { const form = this.recordFormData({}, attachments); form.append('_method', 'PATCH'); return firstValueFrom(this.http.post<{data:Evolution}>(`${this.base}/evolutions/${id}`, form)); }
  attachment(id: number) { return firstValueFrom(this.http.get(`${this.base}/record-attachments/${id}/download`, { responseType: 'blob' })); }
  deleteAttachment(id: number) { return firstValueFrom(this.http.delete(`${this.base}/record-attachments/${id}`)); }
  users() { return firstValueFrom(this.http.get<ApiCollection<User>>(`${this.base}/users`)); }
  createUser(payload: object, photo?: File | null) { return firstValueFrom(this.http.post<{data:User}>(`${this.base}/users`, this.userFormData(payload, photo))); }
  updateUser(id: number, payload: object, photo?: File | null) { const form = this.userFormData(payload, photo); form.append('_method', 'PATCH'); return firstValueFrom(this.http.post<{data:User}>(`${this.base}/users/${id}`, form)); }
  groups() { return firstValueFrom(this.http.get<ApiCollection<AccessGroup>>(`${this.base}/groups`)); }
  permissions() { return firstValueFrom(this.http.get<{data:Permission[]}>(`${this.base}/permissions`)); }
  createGroup(payload: object) { return firstValueFrom(this.http.post<{data:AccessGroup}>(`${this.base}/groups`, payload)); }
  updateGroup(id: number, payload: object) { return firstValueFrom(this.http.patch<{data:AccessGroup}>(`${this.base}/groups/${id}`, payload)); }
  pdf(patientId: number) { return firstValueFrom(this.http.get(`${this.base}/patients/${patientId}/history.pdf`, { responseType: 'blob' })); }
  photo(patientId: number) { return firstValueFrom(this.http.get(`${this.base}/patients/${patientId}/photo`, { responseType: 'blob' })); }
  userPhoto(userId: number) { return firstValueFrom(this.http.get(`${this.base}/users/${userId}/photo`, { responseType: 'blob' })); }
  private patientFormData(payload: Partial<Patient>, photo?: File | null) { const form = new FormData(); Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined && key !== 'has_photo') form.append(key, String(value)); }); if (photo) form.append('photo', photo); return form; }
  private userFormData(payload: object, photo?: File | null) { const form = new FormData(); Object.entries(payload).forEach(([key, value]) => { if (Array.isArray(value)) value.forEach(item => form.append(`${key}[]`, String(item))); else if (value !== null && value !== undefined) form.append(key, String(value)); }); if (photo) form.append('photo', photo); return form; }
  private recordFormData(payload: object, attachments: File[]) { const form = new FormData(); Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined) form.append(key, String(value)); }); attachments.forEach(file => form.append('attachments[]', file)); return form; }
}
