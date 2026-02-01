import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrcamentoItem } from '../../../../core/models/interfaces';

/**
 * Componente para exibir tabela de itens do orçamento
 * Mostra SKU, descrição, quantidade, preço, desconto, total e ações
 */
@Component({
  selector: 'app-items-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-3">
        <label class="block text-sm font-medium text-[var(--gray-700)]">
          Itens do Orçamento
        </label>
        <span class="text-sm text-[var(--gray-500)]">
          {{ items.length }} {{ items.length === 1 ? 'item' : 'itens' }}
        </span>
      </div>
      
      @if (items.length === 0) {
        <div class="border-2 border-dashed border-[var(--gray-200)] rounded-lg p-8 text-center">
          <i class="fas fa-box-open text-4xl text-[var(--gray-300)] mb-3"></i>
          <p class="text-[var(--gray-500)] font-medium">Nenhum item adicionado</p>
          <p class="text-sm text-[var(--gray-400)] mt-1">Selecione um produto e SKU para adicionar itens</p>
        </div>
      } @else {
        <div class="border border-[var(--gray-200)] rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[var(--gray-50)] border-b border-[var(--gray-200)]">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    SKU
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    Descrição
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    Qtd.
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    Preço Unit.
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    Desconto
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    Total
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-[var(--gray-600)] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--gray-100)]">
                @for (item of items; track item.sku; let i = $index) {
                  <tr class="hover:bg-[var(--gray-50)] transition-colors">
                    <!-- SKU -->
                    <td class="px-4 py-3">
                      <span class="font-mono text-sm font-medium text-[var(--gray-900)]">
                        {{ item.sku }}
                      </span>
                    </td>
                    
                    <!-- Descrição -->
                    <td class="px-4 py-3">
                      <div>
                        <p class="text-sm font-medium text-[var(--gray-900)]">{{ item.descricao }}</p>
                        <p class="text-xs text-[var(--gray-500)] mt-0.5">
                          {{ formatarAtributos(item.snapshot.atributos) }}
                        </p>
                      </div>
                    </td>
                    
                    <!-- Quantidade -->
                    <td class="px-4 py-3 text-center">
                      <span class="inline-flex items-center justify-center px-3 py-1 rounded-full bg-[var(--gray-100)] text-[var(--gray-700)] font-medium text-sm">
                        {{ item.quantidade }}
                      </span>
                    </td>
                    
                    <!-- Preço Unitário -->
                    <td class="px-4 py-3 text-right">
                      <span class="text-sm text-[var(--gray-700)]">
                        R$ {{ item.precoUnitario | number:'1.2-2' }}
                      </span>
                    </td>
                    
                    <!-- Desconto -->
                    <td class="px-4 py-3 text-right">
                      @if (item.desconto > 0) {
                        <span class="text-sm text-red-600 font-medium">
                          - R$ {{ item.desconto | number:'1.2-2' }}
                        </span>
                      } @else {
                        <span class="text-sm text-[var(--gray-400)]">
                          -
                        </span>
                      }
                    </td>
                    
                    <!-- Total -->
                    <td class="px-4 py-3 text-right">
                      <span class="text-sm font-bold text-[var(--success-700)]">
                        R$ {{ item.total | number:'1.2-2' }}
                      </span>
                    </td>
                    
                    <!-- Ações -->
                    <td class="px-4 py-3 text-center">
                      <button
                        type="button"
                        (click)="removeItem(i)"
                        class="p-2 text-[var(--gray-400)] hover:text-[var(--error-500)] hover:bg-[var(--error-50)] rounded-lg transition-all"
                        title="Remover item"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          
          <!-- Resumo da tabela -->
          <div class="bg-[var(--gray-50)] px-4 py-3 border-t border-[var(--gray-200)]">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-[var(--gray-700)]">
                Subtotal dos Itens
              </span>
              <span class="text-lg font-bold text-[var(--gray-900)]">
                R$ {{ calcularSubtotal() | number:'1.2-2' }}
              </span>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class ItemsTableComponent {
  @Input() items: OrcamentoItem[] = [];
  @Output() itemRemoved = new EventEmitter<number>();

  removeItem(index: number): void {
    this.itemRemoved.emit(index);
  }

  calcularSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }

  formatarAtributos(atributos: { [key: string]: string }): string {
    return Object.entries(atributos)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ');
  }
}
