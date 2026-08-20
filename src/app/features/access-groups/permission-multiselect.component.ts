import {
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Permission } from '../../core/models';

interface PermissionGroup {
  module: string;
  label: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-permission-multiselect',
  imports: [FormsModule],
  templateUrl: './permission-multiselect.component.html',
})
export class PermissionMultiselectComponent {
  readonly permissions = input.required<Permission[]>();
  readonly value = input<number[]>([]);
  readonly valueChange = output<number[]>();
  readonly opened = signal(false);
  readonly search = signal('');

  readonly selectedPermissions = computed(() => {
    const selected = new Set(this.value());
    return this.permissions().filter((permission) => selected.has(permission.id));
  });

  readonly visibleSelectedPermissions = computed(() => this.selectedPermissions().slice(0, 3));

  readonly filteredPermissions = computed(() => {
    const term = this.normalize(this.search());
    if (!term) return this.permissions();

    return this.permissions().filter((permission) =>
      this.normalize(
        permission.name +
          ' ' +
          permission.key +
          ' ' +
          permission.module +
          ' ' +
          (permission.description ?? ''),
      ).includes(term),
    );
  });

  readonly groupedPermissions = computed<PermissionGroup[]>(() => {
    const grouped = new Map<string, Permission[]>();
    for (const permission of this.filteredPermissions()) {
      const current = grouped.get(permission.module) ?? [];
      current.push(permission);
      grouped.set(permission.module, current);
    }

    return [...grouped.entries()].map(([module, permissions]) => ({
      module,
      label: this.moduleLabel(module),
      permissions,
    }));
  });

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  closeWhenClickingOutside(event: MouseEvent): void {
    if (!this.element.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.opened.set(false);
    this.search.set('');
  }

  toggleOpen(): void {
    this.opened.update((opened) => !opened);
    if (!this.opened()) this.search.set('');
  }

  isSelected(id: number): boolean {
    return this.value().includes(id);
  }

  toggle(permission: Permission): void {
    const selected = new Set(this.value());
    if (selected.has(permission.id)) selected.delete(permission.id);
    else selected.add(permission.id);
    this.valueChange.emit([...selected]);
  }

  remove(id: number, event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(this.value().filter((selectedId) => selectedId !== id));
  }

  selectFiltered(): void {
    const selected = new Set(this.value());
    this.filteredPermissions().forEach((permission) => selected.add(permission.id));
    this.valueChange.emit([...selected]);
  }

  clear(event?: MouseEvent): void {
    event?.stopPropagation();
    this.valueChange.emit([]);
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private moduleLabel(module: string): string {
    const labels: Record<string, string> = {
      dashboard: 'Visão geral',
      patients: 'Pacientes',
      clinical_records: 'Registros clínicos',
      assessments: 'Avaliações',
      evolutions: 'Evoluções',
      attachments: 'Anexos',
      users: 'Usuários',
      groups: 'Grupos',
      permissions: 'Permissões',
      audit_logs: 'Auditoria',
    };

    return labels[module] ?? module.replaceAll('_', ' ');
  }
}
