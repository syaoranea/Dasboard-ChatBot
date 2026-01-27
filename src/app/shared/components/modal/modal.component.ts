import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" (click)="onBackdropClick($event)">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scaleIn" (click)="$event.stopPropagation()">
          <div class="px-6 py-5 border-b border-[var(--gray-200)] flex justify-between items-center bg-[var(--gray-50)]">
            <h3 class="text-lg font-semibold text-[var(--gray-900)]">{{ title }}</h3>
            <button (click)="close.emit()" class="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-200)] transition-all">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="p-6">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Output() close = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }
}
