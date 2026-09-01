import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { formatDateBr } from '../../core/date-format';
import { DashboardService } from '../../core/dashboard/dashboard.service';
import { FeedbackService } from '../../core/ui/feedback.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent implements OnInit {
  readonly formatDate = formatDateBr;
  constructor(
    readonly auth: AuthService,
    readonly dashboard: DashboardService,
    private readonly feedback: FeedbackService,
  ) {}
  ngOnInit() {
    void this.feedback.run(() => this.dashboard.load());
  }
  firstName() {
    return this.auth.user()?.name.split(' ')[0] ?? '';
  }
  todayLabel() {
    return new Date()
      .toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
      .toUpperCase();
  }
}
