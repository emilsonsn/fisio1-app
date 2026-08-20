import { Component, computed, OnInit, signal } from '@angular/core';
import { AccessGroupsService } from '../../core/access-groups/access-groups.service';
import { AccessGroup, Permission } from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AccessGroupDialogComponent } from './access-group-dialog.component';

@Component({
  selector: 'app-access-groups-page',
  imports: [AccessGroupDialogComponent],
  templateUrl: './access-groups-page.component.html',
})
export class AccessGroupsPageComponent implements OnInit {
  readonly groups = signal<AccessGroup[]>([]);
  readonly permissions = signal<Permission[]>([]);
  readonly search = signal('');
  readonly dialogOpen = signal(false);
  readonly editing = signal<AccessGroup | null>(null);
  readonly pendingDeletion = signal<AccessGroup | null>(null);

  readonly filteredGroups = computed(() => {
    const term = this.normalize(this.search());
    if (!term) return this.groups();

    return this.groups().filter((group) =>
      this.normalize(
        group.name +
          ' ' +
          (group.description ?? '') +
          ' ' +
          group.permissions.map((permission) => permission.name).join(' '),
      ).includes(term),
    );
  });

  constructor(
    private readonly service: AccessGroupsService,
    private readonly feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    await this.feedback.run(async () => {
      const [groups, permissions] = await Promise.all([
        this.service.list(),
        this.service.permissions(),
      ]);
      this.groups.set(groups.data);
      this.permissions.set(permissions.data);
    });
  }

  open(group: AccessGroup | null = null): void {
    if (group?.is_system) return;
    this.editing.set(group);
    this.dialogOpen.set(true);
  }

  close(): void {
    this.dialogOpen.set(false);
    this.editing.set(null);
  }

  saved(): void {
    this.close();
    void this.load();
  }

  requestDeletion(group: AccessGroup): void {
    if (!this.canDelete(group)) return;
    this.pendingDeletion.set(group);
  }

  cancelDeletion(): void {
    this.pendingDeletion.set(null);
  }

  async confirmDeletion(): Promise<void> {
    const group = this.pendingDeletion();
    if (!group) return;

    const deleted = await this.feedback.run(async () => {
      await this.service.delete(group.id);
      return true;
    });
    if (!deleted) return;

    this.pendingDeletion.set(null);
    this.feedback.success('Grupo excluído com sucesso.');
    await this.load();
  }

  canDelete(group: AccessGroup): boolean {
    return !group.is_system && (group.users_count ?? 0) === 0;
  }

  deletionTitle(group: AccessGroup): string {
    if (group.is_system) return 'O grupo do sistema não pode ser excluído.';
    if ((group.users_count ?? 0) > 0) return 'Remova os usuários deste grupo antes de excluí-lo.';
    return 'Excluir grupo';
  }

  visiblePermissions(group: AccessGroup): Permission[] {
    return group.permissions.slice(0, 3);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
