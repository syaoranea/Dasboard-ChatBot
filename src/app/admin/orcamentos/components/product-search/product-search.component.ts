import { Component, EventEmitter, Output, inject, OnInit, DestroyRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProdutoSkuService } from '../../../../shared/services/produto-sku.service';
import { Produto } from '../../../../core/models/interfaces';

/**
 * Componente de busca de produtos com autocomplete e debounce
 * Permite buscar produtos por nome para selecionar antes de escolher o SKU
 */
@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <label class="block text-sm font-medium text-[var(--gray-700)] mb-1.5">
        Buscar Produto
      </label>

      <!-- Input de busca -->
      <div class="relative">
        <input
          type="text"
          [ngModel]="searchTerm()"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Digite o nome do produto..."
          class="w-full border border-[var(--gray-300)] px-4 py-2.5 pl-10 rounded-lg text-[var(--gray-900)] placeholder-[var(--gray-400)] focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
          [class.border-green-500]="selectedProduto()"
        />
        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--gray-400)]"></i>

        @if (selectedProduto()) {
          <button
            type="button"
            (click)="clearSelection()"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--error-500)]"
          >
            <i class="fas fa-times"></i>
          </button>
        }
      </div>

      <!-- Dropdown de resultados -->
      @if (showDropdown() && filteredProdutos().length > 0) {
        <div class="absolute z-10 w-full mt-1 bg-white border border-[var(--gray-200)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          @for (produto of filteredProdutos(); track produto.id) {
            <button
              type="button"
              (click)="selectProduto(produto)"
              class="w-full px-4 py-3 text-left hover:bg-[var(--gray-50)] transition-colors border-b border-[var(--gray-100)] last:border-b-0"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="font-medium text-[var(--gray-900)]">{{ produto.nome }}</p>
                  @if (produto.descricao) {
                    <p class="text-sm text-[var(--gray-500)] mt-0.5">{{ produto.descricao }}</p>
                  }
                </div>
                @if (produto.ativo) {
                  <span class="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Ativo
                  </span>
                } @else {
                  <span class="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                    Inativo
                  </span>
                }
              </div>
            </button>
          }
        </div>
      }

      <!-- Mensagem quando não há resultados -->
      @if (showDropdown() && searchTerm() && filteredProdutos().length === 0 && !isLoading()) {
        <div class="absolute z-10 w-full mt-1 bg-white border border-[var(--gray-200)] rounded-lg shadow-lg p-4 text-center text-[var(--gray-500)]">
          <i class="fas fa-search text-2xl mb-2"></i>
          <p>Nenhum produto encontrado</p>
        </div>
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="absolute z-10 w-full mt-1 bg-white border border-[var(--gray-200)] rounded-lg shadow-lg p-4 text-center text-[var(--gray-500)]">
          <i class="fas fa-spinner fa-spin mr-2"></i>
          Buscando produtos...
        </div>
      }

      <!-- Produto selecionado -->
      @if (selectedProduto()) {
        <div class="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-green-800">
                <i class="fas fa-check-circle mr-2"></i>
                {{ selectedProduto()!.nome }}
              </p>
              @if (selectedProduto()!.descricao) {
                <p class="text-sm text-green-600 mt-1">{{ selectedProduto()!.descricao }}</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [``]
})
export class ProductSearchComponent implements OnInit {
  private produtoSkuService = inject(ProdutoSkuService);
  private destroyRef = inject(DestroyRef);

  @Output() produtoSelected = new EventEmitter<Produto & { id: string }>();

  // Signals para estado reativo
  readonly searchTerm = signal('');
  readonly showDropdown = signal(false);
  readonly isLoading = signal(false);
  readonly allProdutos = signal<(Produto & { id: string })[]>([]);
  readonly selectedProduto = signal<(Produto & { id: string }) | null>(null);
  
  // Signal interno para termo de busca com debounce
  private readonly debouncedSearchTerm = signal('');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Computed signal para filtrar produtos
  readonly filteredProdutos = computed(() => {
    const term = this.debouncedSearchTerm().toLowerCase().trim();
    if (!term) {
      return [];
    }
    return this.allProdutos().filter(produto =>
      produto.nome.toLowerCase().includes(term) ||
      produto.descricao?.toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    // Carregar todos os produtos
    this.produtoSkuService.getProdutos$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(produtos => {
        this.allProdutos.set(produtos.filter(p => p.ativo));
      });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.showDropdown.set(true);

    if (!term) {
      this.clearSelection();
      return;
    }

    // Implementar debounce manualmente
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debouncedSearchTerm.set(term);
    }, 300);
  }

  selectProduto(produto: Produto & { id: string }): void {
    this.selectedProduto.set(produto);
    this.searchTerm.set(produto.nome);
    this.showDropdown.set(false);
    this.produtoSelected.emit(produto);
  }

  clearSelection(): void {
    this.selectedProduto.set(null);
    this.searchTerm.set('');
    this.debouncedSearchTerm.set('');
    this.showDropdown.set(false);
    this.produtoSelected.emit(null as any);
  }
}
