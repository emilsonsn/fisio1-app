import { Component, input, output } from '@angular/core';
import { formatDateBr } from '../../core/date-format';
import { Assessment, Evolution } from '../../core/models';
import { ClinicalRecordsService } from '../../core/clinical-records/clinical-records.service';
import { FeedbackService } from '../../core/ui/feedback.service';

@Component({
  selector: 'app-clinical-record-dialog',
  templateUrl: './clinical-record-dialog.component.html',
})
export class ClinicalRecordDialogComponent {
  readonly record = input.required<Assessment | Evolution>();
  readonly type = input.required<'initial_assessment' | 'evolution'>();
  readonly closed = output<void>();
  readonly changed = output<void>();
  constructor(
    private readonly service: ClinicalRecordsService,
    private readonly feedback: FeedbackService,
  ) {}
  date() {
    return formatDateBr(
      this.type() === 'evolution'
        ? (this.record() as Evolution).evolved_at
        : (this.record() as Assessment).assessed_at,
    );
  }
  fields() {
    const record = this.record();
    if (this.type() === 'evolution') {
      const item = record as Evolution;
      return [
        ['Queixa do dia', item.daily_complaint],
        ['Nível de dor', item.pain_level === null ? null : `${item.pain_level}/10`],
        ['Adesão às orientações domiciliares', item.home_guidance_adherence],
        ['Conduta terapêutica', item.therapeutic_conduct],
        ['Impressão final', item.session_final_impression],
        ['Observações', item.observations],
      ];
    }
    const item = record as Assessment;
    return [
      ['Indicação', item.indication],
      ['Queixa principal', item.chief_complaint],
      ['História da doença', item.condition_history],
      ['Hábitos de vida', item.life_habits],
      ['Antecedentes', item.personal_family_history],
      ['Tratamentos realizados', item.previous_treatments],
      ['Exame físico', item.physical_examination],
      ['Exames complementares', item.complementary_exams],
      ['Diagnóstico', item.physical_therapy_diagnosis],
      ['CBDF', item.cbdf],
      ['Recursos e técnicas', item.resources_methods_techniques],
      ['Objetivos', item.therapeutic_objectives],
      ['Prognóstico', item.physical_therapy_prognosis],
    ];
  }
  async addFiles(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    await this.feedback.run(async () => {
      await this.service.addAttachments(this.type(), this.record().id, files);
      this.feedback.success('Anexo(s) adicionado(s).');
      this.changed.emit();
    });
  }
  async remove(id: number) {
    await this.feedback.run(async () => {
      await this.service.deleteAttachment(id);
      this.feedback.success('Anexo removido.');
      this.changed.emit();
    });
  }
  async download(id: number, name: string) {
    await this.feedback.run(async () => {
      const url = URL.createObjectURL(await this.service.downloadAttachment(id));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}
