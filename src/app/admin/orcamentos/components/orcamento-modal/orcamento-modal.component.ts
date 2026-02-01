import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FirebaseService } from '../../../../shared/services/firebase.service';
import { ProdutoSkuService } from '../../../../shared/services/produto-sku.service';
import {
  Orcamento,
  OrcamentoItem,
  OrcamentoValores,
  Cliente,
  Produto
} from '../../../../core/models/interfaces';
import { ProductSearchComponent } from '../product-search/product-search.component';
import { SkuSelectorComponent } from '../sku-selector/sku-selector.component';
import { ItemsTableComponent } from '../items-table/items-table.component';
import { TotalsCalculatorComponent } from '../totals-calculator/totals-calculator.component';

/**
 * Modal completo para criação/edição de orçamentos
 * Implementa stepper de 3 etapas: Dados Gerais, Itens, Totais
 */
@Component({
  selector: 'app-orcamento-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductSearchComponent,
    SkuSelectorComponent,
    ItemsTableComponent,
    TotalsCalculatorComponent
  ],
  template: `
    @if (isOpen) {
      <!-- Overlay -->
      <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <!-- Modal Container -->
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-[var(--gray-200)] flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-[var(--gray-900)]">
                {{ editingId() ? 'Editar Orçamento' : 'Novo Orçamento' }}
              </h2>
              <p class="text-sm text-[var(--gray-500)] mt-1">
                {{ getStepDescription() }}
              </p>
            </div>
            <button
              type="button"
              (click)="closeModal()"
              class="p-2 text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:bg-[var(--gray-100)] rounded-lg transition-all"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <!-- Stepper -->
          <div class="px-6 py-4 border-b border-[var(--gray-200)]">
            <div class="flex items-center justify-between">
              @for (step of steps; track step.id; let i = $index) {
                <div class="flex items-center flex-1">
                  <!-- Step Circle -->
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all"
                      [ngClass]="{
                        'step-active': currentStep() >= step.id,
                        'step-inactive': currentStep() < step.id
                      }"
                    >
                      @if (currentStep() > step.id) {
                        <i class="fas fa-check"></i>
                      } @else {
                        {{ step.id }}
                      }
                    </div>
                    <div class="ml-3">
                      <p
                        class="text-sm font-semibold"
                        [ngClass]="{
                          'step-title-current': currentStep() === step.id,
                          'step-title-completed': currentStep() > step.id,
                          'step-title-pending': currentStep() < step.id
                        }"
                      >
                        {{ step.title }}
                      </p>
                      <p class="text-xs text-[var(--gray-500)]">{{ step.subtitle }}</p>
                    </div>
                  </div>

                  <!-- Line Connector -->
                  @if (i < steps.length - 1) {
                    <div
                      class="flex-1 h-1 mx-4 rounded transition-all"
                      [ngClass]="{
                        'step-line-active': currentStep() > step.id,
                        'step-line-inactive': currentStep() <= step.id
                      }"
                    ></div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <!-- Etapa 1: Dados Gerais -->
            @if (currentStep() === 1) {
              <div class="space-y-5 max-w-3xl">
                <!-- Cliente -->
                <div>
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Cliente <span class="text-red-500">*</span>
                  </label>
                  <select
                    [(ngModel)]="formData.clienteId"
                    class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)]"
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    @for (cliente of clientes(); track cliente.id) {
                      <option [value]="cliente.id">{{ cliente.nome }}</option>
                    }
                  </select>
                </div>

                <!-- Validade -->
                <div>
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Validade do Orçamento
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="formData.validade"
                    class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)]"
                  />
                </div>

                <!-- Condição de Pagamento -->
                <div>
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Condição de Pagamento
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="formData.condicaoPagamento"
                    placeholder="Ex: 30 dias, À vista, 3x sem juros..."
                    class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)] placeholder-[var(--gray-400)]"
                  />
                </div>

                <!-- Observações -->
                <div>
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Observações
                  </label>
                  <textarea
                    [(ngModel)]="formData.observacoes"
                    rows="4"
                    placeholder="Informações adicionais, termos, condições..."
                    class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)] placeholder-[var(--gray-400)] resize-none"
                  ></textarea>
                </div>
              </div>
            }

            <!-- Etapa 2: Inclusão de Itens -->
            @if (currentStep() === 2) {
              <div class="space-y-6">
                <!-- Buscar Produto e Selecionar SKU -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <app-product-search
                      (produtoSelected)="onProdutoSelected($event)"
                    ></app-product-search>
                  </div>
                  <div>
                    <app-sku-selector
                      [produto]="selectedProduto()"
                      [existingSkus]="getExistingSkus()"
                      (itemAdded)="onItemAdded($event)"
                    ></app-sku-selector>
                  </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-[var(--gray-300)] my-6"></div>

                <!-- Tabela de Itens -->
                <app-items-table
                  [items]="formData.itens"
                  (itemRemoved)="onItemRemoved($event)"
                ></app-items-table>
              </div>
            }

            <!-- Etapa 3: Totais e Condições -->
            @if (currentStep() === 3) {
              <div class="max-w-3xl">
                <!-- Tabela de Itens (visualização) -->
                <div class="mb-6">
                  <app-items-table
                    [items]="formData.itens"
                    (itemRemoved)="onItemRemoved($event)"
                  ></app-items-table>
                </div>

                <!-- Divider -->
                <div class="border-t-2 border-[var(--gray-300)] my-6"></div>

                <!-- Calculadora de Totais -->
                <app-totals-calculator
                  [subtotal]="calcularSubtotal()"
                  [valores]="formData.valores"
                  (valoresChange)="onValoresChange($event)"
                ></app-totals-calculator>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-[var(--gray-200)] bg-[var(--gray-50)]">
            <div class="flex items-center justify-between">
              <!-- Botões de Navegação -->
              <div class="flex items-center gap-3">
                @if (currentStep() > 1) {
                  <button
                    type="button"
                    (click)="previousStep()"
                    class="btn-secondary"
                  >
                    <i class="fas fa-arrow-left mr-2"></i>
                    Voltar
                  </button>
                }
              </div>

              <!-- Botões de Ação -->
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="btn-secondary"
                >
                  Cancelar
                </button>

                @if (currentStep() < 3) {
                  <button
                    type="button"
                    (click)="nextStep()"
                    [disabled]="!canProceedToNextStep()"
                    class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                    <i class="fas fa-arrow-right ml-2"></i>
                  </button>
                } @else {
                  <button
                    type="button"
                    (click)="salvarRascunho()"
                    [disabled]="isSaving() || !isFormValid()"
                    class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @if (isSaving()) {
                      <i class="fas fa-spinner fa-spin mr-2"></i>
                    } @else {
                      <i class="fas fa-save mr-2"></i>
                    }
                    Salvar Rascunho
                  </button>

                  <button
                    type="button"
                    (click)="enviarOrcamento()"
                    [disabled]="isSaving() || !isFormValid()"
                    class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @if (isSaving()) {
                      <i class="fas fa-spinner fa-spin mr-2"></i>
                    } @else {
                      <i class="fas fa-paper-plane mr-2"></i>
                    }
                    Enviar Orçamento
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Estilos para o stepper */
    .step-active {
      background-color: var(--primary-600);
      color: white;
    }

    .step-inactive {
      background-color: var(--gray-200);
      color: var(--gray-500);
    }

    .step-title-current {
      color: var(--primary-600);
    }

    .step-title-completed {
      color: var(--gray-900);
    }

    .step-title-pending {
      color: var(--gray-400);
    }

    .step-line-active {
      background-color: var(--primary-600);
    }

    .step-line-inactive {
      background-color: var(--gray-200);
    }
  `]
})
export class OrcamentoModalComponent implements OnChanges {
  private firebaseService = inject(FirebaseService);
  private produtoSkuService = inject(ProdutoSkuService);
  private destroyRef = inject(DestroyRef);

  @Input() isOpen = false;
  @Input() editingOrcamento: (Orcamento & { id: string }) | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Signals para estado reativo
  readonly currentStep = signal(1);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly clientes = signal<(Cliente & { id: string })[]>([]);
  readonly selectedProduto = signal<(Produto & { id: string }) | null>(null);

  steps = [
    { id: 1, title: 'Dados Gerais', subtitle: 'Cliente e condições' },
    { id: 2, title: 'Itens', subtitle: 'Produtos e SKUs' },
    { id: 3, title: 'Totais', subtitle: 'Valores finais' }
  ];

  formData: Orcamento = {
    status: 'RASCUNHO',
    clienteId: '',
    valores: {
      subtotal: 0,
      desconto: 0,
      frete: 0,
      total: 0
    },
    itens: []
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.loadClientes();

      if (this.editingOrcamento) {
        this.editingId.set(this.editingOrcamento.id!);
        this.formData = { ...this.editingOrcamento };
      } else {
        this.resetForm();
      }
    }
  }

  private loadClientes(): void {
    this.firebaseService.getCollection$<Cliente>('clientes')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(clientes => {
        this.clientes.set(clientes);
      });
  }

  getStepDescription(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Informe os dados básicos do orçamento';
      case 2:
        return 'Adicione produtos e SKUs ao orçamento';
      case 3:
        return 'Revise os totais e finalize';
      default:
        return '';
    }
  }

  nextStep(): void {
    if (this.canProceedToNextStep() && this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  canProceedToNextStep(): boolean {
    switch (this.currentStep()) {
      case 1:
        return this.formData.clienteId !== '';
      case 2:
        return this.formData.itens.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }

  onProdutoSelected(produto: Produto & { id: string }): void {
    this.selectedProduto.set(produto);
  }

  onItemAdded(item: OrcamentoItem): void {
    // Verificar se o SKU já existe
    const exists = this.formData.itens.some(i => i.sku === item.sku);
    if (exists) {
      alert('Este SKU já foi adicionado ao orçamento!');
      return;
    }

    this.formData.itens.push(item);
    this.recalcularTotais();

    // Limpar seleção de produto
    this.selectedProduto.set(null);
  }

  onItemRemoved(index: number): void {
    this.formData.itens.splice(index, 1);
    this.recalcularTotais();
  }

  getExistingSkus(): string[] {
    return this.formData.itens.map(item => item.sku);
  }

  calcularSubtotal(): number {
    return this.formData.itens.reduce((sum, item) => sum + item.total, 0);
  }

  onValoresChange(valores: OrcamentoValores): void {
    this.formData.valores = valores;
  }

  private recalcularTotais(): void {
    const subtotal = this.calcularSubtotal();
    this.formData.valores.subtotal = subtotal;
    this.formData.valores.total = subtotal - this.formData.valores.desconto + this.formData.valores.frete;
  }

  isFormValid(): boolean {
    if (!this.formData.clienteId) return false;
    if (this.formData.itens.length === 0) return false;
    if (this.formData.valores.total < 0) return false;
    return true;
  }

  salvarRascunho(): void {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);
    this.formData.status = 'RASCUNHO';
    this.saveOrcamento();
  }

  enviarOrcamento(): void {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);
    this.formData.status = 'ENVIADO';
    this.saveOrcamento();
  }

  private saveOrcamento(): void {
    const dataToSave = { ...this.formData };
    const currentEditingId = this.editingId();

    if (currentEditingId) {
      this.firebaseService.updateDocument$('orcamentos', currentEditingId, dataToSave)
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.saved.emit();
            this.closeModal();
          },
          error: (error) => {
            console.error('Erro ao atualizar orçamento:', error);
            alert('Erro ao salvar orçamento');
            this.isSaving.set(false);
          }
        });
    } else {
      this.firebaseService.addDocument$('orcamentos', dataToSave)
        .subscribe({
          next: () => {
            this.isSaving.set(false);
            this.saved.emit();
            this.closeModal();
          },
          error: (error) => {
            console.error('Erro ao criar orçamento:', error);
            alert('Erro ao salvar orçamento');
            this.isSaving.set(false);
          }
        });
    }
  }

  closeModal(): void {
    this.close.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.currentStep.set(1);
    this.editingId.set(null);
    this.selectedProduto.set(null);
    this.formData = {
      status: 'RASCUNHO',
      clienteId: '',
      valores: {
        subtotal: 0,
        desconto: 0,
        frete: 0,
        total: 0
      },
      itens: []
    };
  }
}
