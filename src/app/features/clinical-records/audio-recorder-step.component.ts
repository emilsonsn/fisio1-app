import { Component, OnDestroy, input, output, signal } from '@angular/core';
import { FeedbackService } from '../../core/ui/feedback.service';
import { RecordType } from './clinical-record-form.model';

@Component({
  selector: 'app-audio-recorder-step',
  templateUrl: './audio-recorder-step.component.html',
})
export class AudioRecorderStepComponent implements OnDestroy {
  readonly type = input.required<RecordType>();
  readonly patientName = input.required<string>();
  readonly back = output<void>();
  readonly submitted = output<File>();
  readonly recording = signal(false);
  readonly ready = signal(false);
  seconds = 0;
  private file: File | null = null;
  private recorder?: MediaRecorder;
  private stream?: MediaStream;
  private chunks: Blob[] = [];
  private timer?: number;

  constructor(private readonly feedback: FeedbackService) {}
  ngOnDestroy() {
    window.clearInterval(this.timer);
    this.stream?.getTracks().forEach((track) => track.stop());
  }
  async toggle() {
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.recorder = new MediaRecorder(this.stream);
      this.chunks = [];
      this.recorder.ondataavailable = (event) => {
        if (event.data.size) this.chunks.push(event.data);
      };
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || 'audio/webm' });
        this.file = new File([blob], `atendimento-${Date.now()}.webm`, { type: blob.type });
        this.stream?.getTracks().forEach((track) => track.stop());
        this.recording.set(false);
        window.clearInterval(this.timer);
        this.ready.set(true);
        this.feedback.success('Gravação concluída e pronta para processar.');
      };
      this.recorder.start();
      this.seconds = 0;
      this.recording.set(true);
      this.timer = window.setInterval(() => (this.seconds += 1), 1000);
    } catch {
      this.feedback.failure('Não foi possível acessar o microfone. Envie um arquivo de áudio.');
    }
  }
  select(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (file) {
      this.file = file;
      this.ready.set(true);
      this.feedback.success('Áudio carregado e pronto para processar.');
    }
  }
  submit() {
    if (this.file) this.submitted.emit(this.file);
  }
  time() {
    return `${String(Math.floor(this.seconds / 60)).padStart(2, '0')}:${String(this.seconds % 60).padStart(2, '0')}`;
  }
}
