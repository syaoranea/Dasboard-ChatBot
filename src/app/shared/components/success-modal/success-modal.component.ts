import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div class="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-check text-2xl text-green-600"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Sucesso!</h3>
            <p class="text-gray-600 mb-6">{{ message }}</p>
            <button (click)="close.emit()" 
                    class="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Fechar
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class SuccessModalComponent {
  @Input() isOpen = false;
  @Input() message = 'Operação realizada com sucesso!';
  @Output() close = new EventEmitter<void>();
}
