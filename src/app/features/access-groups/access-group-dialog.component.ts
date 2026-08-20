import { Component, effect, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessGroupsService } from '../../core/access-groups/access-groups.service';
import { AccessGroup, Permission } from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';
import { PermissionMultiselectComponent } from './permission-multiselect.component';

@Component({
  selector: 'app-access-group-dialog',
  imports: [FormsModule, PermissionMultiselectComponent],
  templateUrl: './access-group-dialog.component.html',
})
export class AccessGroupDialogComponent {
  readonly group = input<AccessGroup | null>(null);
  readonly permissions = input.required<Permission[]>();
  readonly closed = output<void>();
  readonly saved = output<void>();

  form = { name: '', description: '', permission_ids: [] as number[] };

  constructor(
    private readonly groups: AccessGroupsService,
    private readonly feedback: FeedbackService,
  ) {
    effect(() => {
      const group = this.group();
      this.form = group
        ? {
            name: group.name,
            description: group.description ?? '',
            permission_ids: group.permissions.map((permission) => permission.id),
          }
        : { name: '', description: '', permission_ids: [] };
    });
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  async save(): Promise<void> {
    const payload = {
      name: this.form.name.trim(),
      description: this.form.description.trim() || null,
      permission_ids: this.form.permission_ids,
    };
    const current = this.group();
    const saved = await this.feedback.run(async () => {
      if (current) await this.groups.update(current.id, payload);
      else await this.groups.create(payload);
      return true;
    });

    if (!saved) return;
    this.feedback.success(current ? 'Grupo atualizado com sucesso.' : 'Grupo criado com sucesso.');
    this.saved.emit();
  }
}
