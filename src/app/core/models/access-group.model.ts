import { Permission } from './permission.model';

export interface AccessGroup {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: Permission[];
  users_count?: number;
}
