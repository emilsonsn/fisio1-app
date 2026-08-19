import { Component, OnInit, signal } from '@angular/core';
import { AccessGroupsService } from '../../core/access-groups/access-groups.service';
import { AccessGroup, User } from '../../core/models';
import { FeedbackService } from '../../core/ui/feedback.service';
import { UsersService } from '../../core/users/users.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { UserDialogComponent } from './user-dialog.component';

@Component({
  selector: 'app-users-page',
  imports: [AvatarComponent, UserDialogComponent],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent implements OnInit {
  readonly users = signal<User[]>([]);
  readonly groups = signal<AccessGroup[]>([]);
  readonly dialogOpen = signal(false);
  readonly editing = signal<User | null>(null);
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: AccessGroupsService,
    private readonly feedback: FeedbackService,
  ) {}
  ngOnInit() {
    void this.load();
  }
  async load() {
    await this.feedback.run(async () => {
      const [users, groups] = await Promise.all([
        this.usersService.list(),
        this.groupsService.list(),
      ]);
      this.users.set(users.data);
      this.groups.set(groups.data);
    });
  }
  open(user: User | null = null) {
    this.editing.set(user);
    this.dialogOpen.set(true);
  }
  close() {
    this.dialogOpen.set(false);
  }
  saved() {
    this.close();
    void this.load();
  }
  async toggle(user: User) {
    await this.feedback.run(async () => {
      await this.usersService.update(user.id, { is_active: !user.is_active });
      await this.load();
    });
  }
}
