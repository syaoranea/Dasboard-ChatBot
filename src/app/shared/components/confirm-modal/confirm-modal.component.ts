import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div class="bg-white p-8 rounded-xl shadow-xl max-w-md w-full mx-4 animate-scaleIn">
          <div class="text-center">
            <div class="w-16 h-16 bg-[var(--error-50)] rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-2xl text-[var(--error-500)]"></i>
            </div>
            <h3 class="text-xl font-bold text-[var(--gray-900)] mb-2">Confirmar Exclusão</h3>
            <p class="text-[var(--gray-600)] mb-6">{{ message }}</p>
            <div class="flex gap-3">
              <button (click)="cancel.emit()" class="btn-secondary flex-1">
                Cancelar
              </button>
              <button (click)="confirm.emit()" class="btn-danger flex-1">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() message = 'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
