import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PatientHistory, PatientHistoryEntry } from '../../core/models';
import { PatientsService } from '../../core/patients/patients.service';
import { FeedbackService } from '../../core/ui/feedback.service';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

interface DisplayField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-patient-history-page',
  imports: [RouterLink, AvatarComponent],
  templateUrl: './patient-history-page.component.html',
})
export class PatientHistoryPageComponent implements OnInit {
  readonly history = signal<PatientHistory | null>(null);
  readonly expandedEntries = signal<Set<string>>(new Set());

  private readonly labels: Record<string, string> = {
    chief_complaint: 'Queixa principal',
    condition_history: 'História da condição',
    physical_examination: 'Exame físico',
    physical_therapy_diagnosis: 'Diagnóstico fisioterapêutico',
    therapeutic_objectives: 'Objetivos terapêuticos',
    physical_therapy_prognosis: 'Prognóstico',
    resources_methods_techniques: 'Recursos e técnicas',
    daily_complaint: 'Queixa do dia',
    home_guidance_adherence: 'Adesão às orientações',
    therapeutic_conduct: 'Conduta terapêutica',
    session_final_impression: 'Impressão ao final da sessão',
    observations: 'Observações',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    readonly auth: AuthService,
    private readonly patients: PatientsService,
    private readonly feedback: FeedbackService,
  ) {}

  ngOnInit(): void {
    const patientId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(patientId) || patientId <= 0) {
      void this.router.navigateByUrl('/patients');
      return;
    }

    void this.feedback.run(async () => {
      this.history.set((await this.patients.history(patientId)).data);
    });
  }

  async downloadReport(): Promise<void> {
    const patient = this.history()?.patient;
    if (!patient) return;

    await this.feedback.run(async () => {
      const url = URL.createObjectURL(await this.patients.historyPdf(patient.id));
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-clinico-${this.fileSlug(patient.name)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      this.feedback.success('Relatório gerado com sucesso.');
    });
  }

  entryKey(entry: PatientHistoryEntry): string {
    return entry.type + ':' + entry.id;
  }

  toggleEntry(entry: PatientHistoryEntry): void {
    const key = this.entryKey(entry);
    this.expandedEntries.update((entries) => {
      const next = new Set(entries);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  isExpanded(entry: PatientHistoryEntry): boolean {
    return this.expandedEntries().has(this.entryKey(entry));
  }

  fields(entry: PatientHistoryEntry): DisplayField[] {
    return Object.entries(entry.fields)
      .filter((field): field is [string, string] => Boolean(field[1]?.trim()))
      .map(([key, value]) => ({ label: this.labels[key] ?? key, value }));
  }

  visibleFields(entry: PatientHistoryEntry): DisplayField[] {
    const fields = this.fields(entry);
    return this.isExpanded(entry) ? fields : fields.slice(0, 3);
  }

  entryTitle(entry: PatientHistoryEntry): string {
    if (entry.type === 'initial_assessment') return 'Avaliação inicial';
    const index =
      this.history()
        ?.timeline.filter((item) => item.type === 'evolution')
        .findIndex((item) => item.id === entry.id) ?? -1;
    return 'Evolução ' + (index + 1);
  }

  entryTypeLabel(entry: PatientHistoryEntry): string {
    return entry.type === 'evolution' ? 'Evolução' : 'Avaliação';
  }

  statusLabel(status: PatientHistoryEntry['status']): string {
    return {
      pending: 'Processando',
      in_review: 'Em revisão',
      completed: 'Concluído',
      failed: 'Falha',
      cancelled: 'Cancelado',
    }[status];
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(value + 'T00:00:00'));
  }

  treatmentPeriod(): string {
    const summary = this.history()?.summary;
    if (!summary?.first_record_at || !summary.last_record_at) return 'Sem registros';

    const first = new Date(summary.first_record_at + 'T00:00:00');
    const last = new Date(summary.last_record_at + 'T00:00:00');
    const days = Math.max(0, Math.round((last.getTime() - first.getTime()) / 86_400_000));
    if (days === 0) return 'Mesmo dia';
    if (days < 30) return days + ' ' + (days === 1 ? 'dia' : 'dias');
    const months = Math.max(1, Math.round(days / 30));
    return months + ' ' + (months === 1 ? 'mês' : 'meses');
  }

  painChangeLabel(): string {
    const change = this.history()?.summary.pain_change;
    if (change === null || change === undefined) return 'Sem dados de dor';
    if (change > 0) return 'Redução de ' + change + ' ' + (change === 1 ? 'ponto' : 'pontos');
    if (change < 0)
      return 'Aumento de ' + Math.abs(change) + ' ' + (change === -1 ? 'ponto' : 'pontos');
    return 'Nível de dor estável';
  }

  painChangeClass(): string {
    const change = this.history()?.summary.pain_change;
    if (change === null || change === undefined || change === 0) return 'stable';
    return change > 0 ? 'improvement' : 'worsening';
  }

  painComparison(entry: PatientHistoryEntry): { label: string; cssClass: string } | null {
    if (entry.pain_level === null) return null;
    const timeline = this.history()?.timeline ?? [];
    const index = timeline.findIndex((item) => item.type === entry.type && item.id === entry.id);
    const previous = timeline
      .slice(0, index)
      .reverse()
      .find((item) => item.pain_level !== null);
    if (!previous || previous.pain_level === null) {
      return { label: 'Primeira medição', cssClass: 'stable' };
    }

    const change = previous.pain_level - entry.pain_level;
    if (change > 0)
      return {
        label: 'Melhora de ' + change + ' ' + (change === 1 ? 'ponto' : 'pontos'),
        cssClass: 'improvement',
      };
    if (change < 0)
      return {
        label: 'Aumento de ' + Math.abs(change) + ' ' + (change === -1 ? 'ponto' : 'pontos'),
        cssClass: 'worsening',
      };
    return { label: 'Sem alteração', cssClass: 'stable' };
  }

  painWidth(level: number): number {
    return Math.max(0, Math.min(100, level * 10));
  }

  private fileSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
