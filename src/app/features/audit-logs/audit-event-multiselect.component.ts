import { Component, computed, ElementRef, HostListener, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditEventOption } from '../../core/models';

interface EventGroup {
  label: string;
  events: AuditEventOption[];
}

@Component({
  selector: 'app-audit-event-multiselect',
  imports: [FormsModule],
  templateUrl: './audit-event-multiselect.component.html',
})
export class AuditEventMultiselectComponent {
  readonly events = input.required<AuditEventOption[]>();
  readonly value = input<string[]>([]);
  readonly valueChange = output<string[]>();
  readonly opened = signal(false);
  readonly search = signal('');

  readonly selectedEvents = computed(() => {
    const selected = new Set(this.value());
    return this.events().filter((event) => selected.has(event.value));
  });
  readonly visibleSelectedEvents = computed(() => this.selectedEvents().slice(0, 3));
  readonly filteredEvents = computed(() => {
    const term = this.normalize(this.search());
    if (!term) return this.events();

    return this.events().filter((event) =>
      this.normalize(`${event.label} ${event.group} ${event.value}`).includes(term),
    );
  });
  readonly groupedEvents = computed<EventGroup[]>(() => {
    const grouped = new Map<string, AuditEventOption[]>();
    for (const event of this.filteredEvents()) {
      const current = grouped.get(event.group) ?? [];
      current.push(event);
      grouped.set(event.group, current);
    }

    return [...grouped.entries()].map(([label, events]) => ({ label, events }));
  });

  constructor(private readonly element: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  closeWhenClickingOutside(event: MouseEvent): void {
    if (!this.element.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.opened.set(false);
    this.search.set('');
  }

  toggleOpen(): void {
    this.opened.update((opened) => !opened);
    if (!this.opened()) this.search.set('');
  }

  isSelected(value: string): boolean {
    return this.value().includes(value);
  }

  toggle(event: AuditEventOption): void {
    const selected = new Set(this.value());
    if (selected.has(event.value)) selected.delete(event.value);
    else selected.add(event.value);
    this.valueChange.emit([...selected]);
  }

  remove(value: string, event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(this.value().filter((selected) => selected !== value));
  }

  selectFiltered(): void {
    this.valueChange.emit([...new Set([...this.value(), ...this.filteredEvents().map((event) => event.value)])]);
  }

  clear(event?: MouseEvent): void {
    event?.stopPropagation();
    this.valueChange.emit([]);
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
