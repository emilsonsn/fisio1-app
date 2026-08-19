import { AccessGroup } from './access-group.model';

export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  has_photo: boolean;
  access_groups: AccessGroup[];
  permissions?: string[];
}
