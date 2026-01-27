import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" (click)="onBackdropClick($event)">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" (click)="$event.stopPropagation()">
          <div class="p-6 border-b flex justify-between items-center">
            <h3 class="text-xl font-bold">{{ title }}</h3>
            <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
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
