export interface AuditEventOption {
  value: string;
  label: string;
  group: string;
}

export interface AuditUserOption {
  id: number;
  name: string;
  email: string;
  has_photo: boolean;
}

export interface AuditActor {
  id: number | null;
  name: string;
  email: string;
  has_photo: boolean;
}

export interface AuditableReference {
  type: string;
  id: number;
  label: string | null;
}

export interface AuditLog {
  id: number;
  event: string;
  event_label: string;
  event_group: string;
  user: AuditActor | null;
  auditable: AuditableReference | null;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogOptions {
  events: AuditEventOption[];
  users: AuditUserOption[];
}

export interface AuditLogFilters {
  event: string;
  user_id: number | null;
  date_from: string;
  date_to: string;
}
