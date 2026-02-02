import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProdutoSkuService } from '../../../../shared/services/produto-sku.service';
import { Produto, SKU, OrcamentoItem } from '../../../../core/models/interfaces';

/**
 * Componente para seleção de SKU específico após escolher um produto
 * Exibe lista de SKUs disponíveis com seus atributos, preço e estoque
 */
@Component({
  selector: 'app-sku-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (produto) {
      <div class="mt-4">
        <label class="block text-sm font-medium text-[var(--gray-700)] mb-2">
          Selecionar SKU de "{{ produto.nome }}"
        </label>

        @if (isLoading()) {
          <div class="text-center py-8 text-[var(--gray-500)]">
            <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
            <p>Carregando SKUs disponíveis...
          </div>
        } @else if (skus().length === 0) {
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl mb-2"></i>
            <p class="text-yellow-800 font-medium">Nenhum SKU disponível</p>
            <p class="text-sm text-yellow-600 mt-1">Este produto não possui SKUs cadastrados</p>
          </div>
        } @else {
          <!-- Grid de SKUs -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            @for (sku of skus(); track sku.id) {
              <div
                class="border rounded-lg p-4 cursor-pointer transition-all"
                [ngClass]="{
                  'border-gray-200 bg-white': selectedSku()?.id !== sku.id,
                  'border-primary-500 bg-primary-50': selectedSku()?.id === sku.id,
                  'opacity-50 cursor-not-allowed': !sku.ativo || (sku.estoque || 0) <= 0
                }"
                (click)="selectSku(sku)"
              >
                <!-- Cabeçalho do SKU -->
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <p class="font-mono font-bold text-[var(--gray-900)] text-sm">{{ sku.sku }}</p>
                    <p class="text-xs text-[var(--gray-500)] mt-0.5">
                      {{ formatarAtributos(sku.atributos) }}
                    </p>
                  </div>
                  @if (selectedSku()?.id === sku.id) {
                    <i class="fas fa-check-circle text-[var(--primary-600)] text-xl"></i>
                  }
                </div>

                <!-- Preço -->
                <div class="mb-2">
                  <span class="text-lg font-bold text-[var(--success-700)]">
                    R$ {{ sku.preco | number:'1.2-2' }}
                  </span>
                </div>

                <!-- Estoque e Status -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    @if (sku.ativo && (sku.estoque || 0) > 0) {
                      <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        <i class="fas fa-box mr-1"></i>
                        Estoque: {{ sku.estoque }}
                      </span>
                    } @else if (sku.ativo && (sku.estoque || 0) <= 0) {
                      <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        <i class="fas fa-box-open mr-1"></i>
                        Sem estoque
                      </span>
                    } @else {
                      <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        Inativo
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Quantidade -->
          @if (selectedSku()) {
            <div class="mt-4 p-4 bg-[var(--primary-50)] border border-[var(--primary-200)] rounded-lg">
              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    [ngModel]="quantidade()"
                    (ngModelChange)="onQuantidadeChange($event)"
                    min="1"
                    [max]="selectedSku()!.estoque"
                    class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)]"
                    placeholder="Digite a quantidade"
                  />
                  @if (quantidade() > (selectedSku()!.estoque || 0)) {
                    <p class="text-xs text-red-600 mt-1">
                      <i class="fas fa-exclamation-triangle mr-1"></i>
                      Quantidade maior que estoque disponível ({{ selectedSku()!.estoque }})
                    </p>
                  }
                </div>

                <div class="flex-1">
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    [ngModel]="desconto()"
                    (ngModelChange)="onDescontoChange($event)"
                    min="0"
                    step="0.01"
                    [max]="selectedSku()!.preco * quantidade()"
                    class="w-full border border-[var(--gray-300)] px-4 py-2.5 rounded-lg text-[var(--gray-900)]"
                    placeholder="0.00"
                  />
                </div>

                <div class="flex-1">
                  <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
                    Total do Item
                  </label>
                  <p class="text-2xl font-bold text-[var(--success-700)]">
                    R$ {{ calcularTotal() | number:'1.2-2' }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                (click)="adicionarItem()"
                [disabled]="!isValid()"
                class="mt-4 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i class="fas fa-plus mr-2"></i>
                Adicionar Item ao Orçamento
              </button>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    .border-gray-200 { border-color: var(--gray-200); }
    .border-primary-500 { border-color: var(--primary-500); }
    .bg-primary-50 { background-color: var(--primary-50); }
  `]
})
export class SkuSelectorComponent implements OnChanges {
  private produtoSkuService = inject(ProdutoSkuService);
  private destroyRef = inject(DestroyRef);

  @Input() produto: (Produto & { id: string }) | null = null;
  @Input() existingSkus: string[] = []; // SKUs já adicionados ao orçamento
  @Output() itemAdded = new EventEmitter<OrcamentoItem>();

  // Signals para estado reativo
  readonly skus = signal<(SKU & { id: string })[]>([]);
  readonly selectedSku = signal<(SKU & { id: string }) | null>(null);
  readonly quantidade = signal(1);
  readonly desconto = signal(0);
  readonly isLoading = signal(true);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produto'] && this.produto) {
      this.loadSkus();
    }
  }

  private loadSkus(): void {
    if (!this.produto?.id) return;

    this.isLoading.set(true);
    this.produtoSkuService.getSKUsByProduto$(this.produto.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (skus) => {
          // Filtrar SKUs ativos e remover os já adicionados
          this.skus.set(skus.filter(sku =>
            sku.ativo && !this.existingSkus.includes(sku.sku)
          ));
          console.log(this.skus());
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar SKUs:', error);
          this.isLoading.set(false);
        }
      });
  }

  selectSku(sku: SKU & { id: string }): void {
    if (!sku.ativo || (sku.estoque || 0) <= 0) {
      return;
    }

    this.selectedSku.set(sku);
    this.quantidade.set(1);
    this.desconto.set(0);
  }

  formatarAtributos(atributos: { [key: string]: string }): string {
    return this.produtoSkuService.formatarAtributosSKU(atributos);
  }

  onQuantidadeChange(value: number): void {
    // Validar quantidade
    if (value < 1) {
      this.quantidade.set(1);
    } else {
      this.quantidade.set(value);
    }
  }

  onDescontoChange(value: number): void {
    this.desconto.set(value);
  }

  calcularTotal(): number {
    const sku = this.selectedSku();
    if (!sku) return 0;
    return (sku.preco * this.quantidade()) - this.desconto();
  }

  isValid(): boolean {
    const sku = this.selectedSku();
    if (!sku) return false;
    if (this.quantidade() < 1) return false;
    if (this.quantidade() > (sku.estoque || 0)) return false;
    if (this.desconto() < 0) return false;
    if (this.desconto() > (sku.preco * this.quantidade())) return false;
    return true;
  }

  adicionarItem(): void {
    const sku = this.selectedSku();
    if (!this.isValid() || !sku || !this.produto) return;

    // Criar descrição completa
    const atributosFormatados = this.formatarAtributos(sku.atributos);
    const descricao = `${this.produto.nome} - ${atributosFormatados}`;

    // Criar item do orçamento com snapshot
    const item: OrcamentoItem = {
      sku: sku.sku,
      produtoId: this.produto.id!,
      descricao,
      quantidade: this.quantidade(),
      precoUnitario: sku.preco,
      desconto: this.desconto(),
      total: this.calcularTotal(),
      snapshot: {
        atributos: { ...sku.atributos },
        produtoNome: this.produto.nome
      }
    };

    this.itemAdded.emit(item);

    // Reset
    this.selectedSku.set(null);
    this.quantidade.set(1);
    this.desconto.set(0);
  }
}
