import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessGroupsService } from '../../core/access-groups/access-groups.service';
import { AccessGroup, Permission } from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';

@Component({
  selector: 'app-access-groups-page',
  imports: [FormsModule],
  templateUrl: './access-groups-page.component.html',
})
export class AccessGroupsPageComponent implements OnInit {
  readonly groups = signal<AccessGroup[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly editing = signal<AccessGroup | null>(null);
  form = { name: '', description: '', permission_ids: [] as number[] };
  constructor(
    private readonly service: AccessGroupsService,
    private readonly feedback: FeedbackService,
  ) {}
  ngOnInit() {
    void this.load();
  }
  async load() {
    await this.feedback.run(async () => {
      const [groups, permissions] = await Promise.all([
        this.service.list(),
        this.service.permissions(),
      ]);
      this.groups.set(groups.data);
      this.permissions.set(permissions.data);
    });
  }
  edit(group: AccessGroup) {
    this.editing.set(group);
    this.form = {
      name: group.name,
      description: group.description ?? '',
      permission_ids: group.permissions.map((permission) => permission.id),
    };
  }
  cancel() {
    this.editing.set(null);
    this.form = { name: '', description: '', permission_ids: [] };
  }
  togglePermission(id: number) {
    const index = this.form.permission_ids.indexOf(id);
    if (index >= 0) this.form.permission_ids.splice(index, 1);
    else this.form.permission_ids.push(id);
  }
  async save() {
    await this.feedback.run(async () => {
      const current = this.editing();
      if (current) await this.service.update(current.id, this.form);
      else await this.service.create(this.form);
      this.feedback.success(current ? 'Grupo atualizado.' : 'Grupo criado.');
      this.cancel();
      await this.load();
    });
  }
}
