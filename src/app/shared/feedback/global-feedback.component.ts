import { Component } from '@angular/core';
import { FeedbackService } from '../../core/ui/feedback.service';

@Component({
  selector: 'app-global-feedback',
  template: `
    @if (feedback.loading()) {
      <div class="global-loading">
        <div class="loading-card">
          <div class="loading-mark"><span>✦</span><i></i><i></i></div>
          <strong>Carregando...</strong><small>Fisio1 • cuidado em movimento</small>
          <div class="loading-progress"><i></i></div>
        </div>
      </div>
    }
    @if (feedback.error()) {
      <div class="toast-region">
        <div class="toast error"><span>!</span>{{ feedback.error() }}</div>
      </div>
    }
    @if (feedback.message()) {
      <div class="toast-region">
        <div class="toast"><span>✓</span>{{ feedback.message() }}</div>
      </div>
    }
  `,
})
export class GlobalFeedbackComponent {
  constructor(readonly feedback: FeedbackService) {}
}
