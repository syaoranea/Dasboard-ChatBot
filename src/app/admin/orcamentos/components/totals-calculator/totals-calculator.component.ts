import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrcamentoValores } from '../../../../core/models/interfaces';

/**
 * Componente para cálculo e exibir totais do orçamento
 * Calcula subtotal, desconto geral, frete e total final
 */
@Component({
  selector: 'app-totals-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-[var(--gray-900)] mb-4">
        Totais e Condições
      </h3>
      
      <!-- Subtotal (readonly) -->
      <div class="flex items-center justify-between p-4 bg-[var(--gray-50)] rounded-lg">
        <div>
          <label class="text-sm font-medium text-[var(--gray-700)]">
            Subtotal dos Itens
          </label>
          <p class="text-xs text-[var(--gray-500)] mt-0.5">
            Soma de todos os itens adicionados
          </p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold text-[var(--gray-900)]">
            R$ {{ subtotal | number:'1.2-2' }}
          </p>
        </div>
      </div>
      
      <!-- Desconto Geral -->
      <div>
        <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
          Desconto Geral (R$)
          <span class="text-xs text-[var(--gray-500)] font-normal ml-1">(Opcional)</span>
        </label>
        <input
          type="number"
          [(ngModel)]="localValores.desconto"
          (ngModelChange)="onValoresChange()"
          min="0"
          step="0.01"
          [max]="subtotal"
          class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)]"
          placeholder="0.00"
        />
        @if (localValores.desconto > 0) {
          <p class="text-xs text-[var(--gray-500)] mt-1">
            <i class="fas fa-info-circle mr-1"></i>
            Percentual: {{ calcularPercentualDesconto() | number:'1.2-2' }}%
          </p>
        }
      </div>
      
      <!-- Frete -->
      <div>
        <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
          Valor do Frete (R$)
          <span class="text-xs text-[var(--gray-500)] font-normal ml-1">(Opcional)</span>
        </label>
        <input
          type="number"
          [(ngModel)]="localValores.frete"
          (ngModelChange)="onValoresChange()"
          min="0"
          step="0.01"
          class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)]"
          placeholder="0.00"
        />
      </div>
      
      <!-- Divider -->
      <div class="border-t-2 border-[var(--gray-300)] my-4"></div>
      
      <!-- Total Final -->
      <div class="p-6 bg-gradient-to-r from-[var(--primary-50)] to-[var(--primary-100)] rounded-xl border-2 border-[var(--primary-200)]">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-base font-semibold text-[var(--gray-900)]">
              Total Final do Orçamento
            </label>
            <p class="text-xs text-[var(--gray-600)] mt-1">
              Subtotal {{ localValores.desconto > 0 ? '- Desconto' : '' }} {{ localValores.frete > 0 ? '+ Frete' : '' }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold text-[var(--primary-700)]">
              R$ {{ localValores.total | number:'1.2-2' }}
            </p>
          </div>
        </div>
        
        <!-- Breakdown dos valores -->
        <div class="mt-4 pt-4 border-t border-[var(--primary-200)] space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-[var(--gray-700)]">Subtotal</span>
            <span class="font-medium text-[var(--gray-900)]">R$ {{ subtotal | number:'1.2-2' }}</span>
          </div>
          @if (localValores.desconto > 0) {
            <div class="flex items-center justify-between text-sm">
              <span class="text-red-600">Desconto</span>
              <span class="font-medium text-red-700">- R$ {{ localValores.desconto | number:'1.2-2' }}</span>
            </div>
          }
          @if (localValores.frete > 0) {
            <div class="flex items-center justify-between text-sm">
              <span class="text-[var(--gray-700)]">Frete</span>
              <span class="font-medium text-[var(--gray-900)]">+ R$ {{ localValores.frete | number:'1.2-2' }}</span>
            </div>
          }
        </div>
      </div>
      
      <!-- Alertas de validação -->
      @if (localValores.desconto > subtotal) {
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            O desconto não pode ser maior que o subtotal
          </p>
        </div>
      }
      
      @if (subtotal === 0) {
        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-sm text-yellow-700">
            <i class="fas fa-info-circle mr-2"></i>
            Adicione itens ao orçamento para calcular o total
          </p>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class TotalsCalculatorComponent implements OnChanges {
  @Input() subtotal = 0;
  @Input() valores: OrcamentoValores = {
    subtotal: 0,
    desconto: 0,
    frete: 0,
    total: 0
  };
  @Output() valoresChange = new EventEmitter<OrcamentoValores>();
  
  localValores: OrcamentoValores = {
    subtotal: 0,
    desconto: 0,
    frete: 0,
    total: 0
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['subtotal'] || changes['valores']) {
      this.localValores = { ...this.valores };
      this.calcularTotal();
    }
  }

  onValoresChange(): void {
    // Validar valores
    if (this.localValores.desconto < 0) {
      this.localValores.desconto = 0;
    }
    if (this.localValores.frete < 0) {
      this.localValores.frete = 0;
    }
    
    this.calcularTotal();
  }

  private calcularTotal(): void {
    this.localValores.subtotal = this.subtotal;
    this.localValores.total = this.subtotal - this.localValores.desconto + this.localValores.frete;
    
    // Garantir que o total não seja negativo
    if (this.localValores.total < 0) {
      this.localValores.total = 0;
    }
    
    this.valoresChange.emit(this.localValores);
  }

  calcularPercentualDesconto(): number {
    if (this.subtotal === 0) return 0;
    return (this.localValores.desconto / this.subtotal) * 100;
  }
}
