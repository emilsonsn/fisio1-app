import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalFeedbackComponent } from './shared/feedback/global-feedback.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalFeedbackComponent],
  templateUrl: './app.html',
})
export class App {}
