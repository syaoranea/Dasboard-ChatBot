import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';
import { ProdutoSkuService } from '../../shared/services/produto-sku.service';
import { ProdutoModalComponent } from './produto-modal/produto-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { Produto, SKU, Categoria } from '../../core/models/interfaces';

/**
 * Componente de listagem de produtos com arquitetura Produto Pai + SKUs
 * Versão 2.0 - Totalmente redesenhada com Signals
 */
@Component({
  selector: 'app-produtos-v2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProdutoModalComponent,
    ConfirmModalComponent,
    SuccessModalComponent,
    LoadingComponent
  ],
  templateUrl: './produtos-v2.component.html',
  styleUrl: './produtos.component.scss'
})
export class ProdutosV2Component implements OnInit {
  private firebaseService = inject(FirebaseService);
  private produtoSkuService = inject(ProdutoSkuService);
  private destroyRef = inject(DestroyRef);

  // Signals para estado base
  private readonly _produtos = signal<(Produto & { id: string })[]>([]);
  private readonly _skus = signal<(SKU & { id: string })[]>([]);
  readonly categorias = signal<(Categoria & { id: string })[]>([]);

  // Signals para UI
  readonly isModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSuccessModalOpen = signal(false);
  readonly successMessage = signal('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingProdutoId = signal<string | null>(null);
  readonly deleteId = signal<string | null>(null);
  readonly deleteName = signal('');

  // Filtros e busca
  readonly searchTerm = signal('');
  readonly filtroCategoria = signal('');

  // Computed signal para produtos com dados agregados e filtros aplicados
  readonly produtosComDados = computed(() => {
    const produtos = this._produtos();
    const skus = this._skus();
    const search = this.searchTerm().toLowerCase();
    const categoriaFiltro = this.filtroCategoria();

    let resultados = produtos.map(produto => {
      const skusDoProduto = skus.filter(sku => sku.produtoId === produto.id);
      const estoqueTotal = skusDoProduto.reduce((sum, sku) => sum + (sku.estoque || 0), 0);
      const precos = skusDoProduto.map(sku => sku.preco);
      const precoMin = precos.length > 0 ? Math.min(...precos) : 0;
      const precoMax = precos.length > 0 ? Math.max(...precos) : 0;

      return {
        ...produto,
        quantidadeSKUs: skusDoProduto.length,
        estoqueTotal,
        precoMin,
        precoMax,
        skus: skusDoProduto
      };
    });

    // Aplicar filtros
    if (search) {
      resultados = resultados.filter(p =>
        p.nome.toLowerCase().includes(search) ||
        p.descricao?.toLowerCase().includes(search) ||
        p.marca?.toLowerCase().includes(search)
      );
    }

    if (categoriaFiltro) {
      resultados = resultados.filter(p => p.categoriaId === categoriaFiltro);
    }

    return resultados;
  });

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Carrega todos os dados necessários
   */
  private loadData(): void {
    combineLatest({
      produtos: this.produtoSkuService.getProdutos$(),
      skus: this.produtoSkuService.getSKUs$(),
      categorias: this.firebaseService.getCollection$<Categoria>('categorias')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this._produtos.set(data.produtos);
        this._skus.set(data.skus);
        this.categorias.set(data.categorias);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Obtém nome da categoria
   */
  getCategoriaNome(categoriaId: string): string {
    const categoria = this.categorias().find(c => c.id === categoriaId);
    return categoria ? categoria.nome : '-';
  }

  /**
   * Formata a faixa de preço para exibição
   */
  formatarFaixaPreco(min: number, max: number): string {
    if (min === max) {
      return `R$ ${min.toFixed(2)}`;
    }
    return `R$ ${min.toFixed(2)} - R$ ${max.toFixed(2)}`;
  }

  /**
   * Abre modal para novo produto
   */
  openModal(produtoId?: string): void {
    this.editingProdutoId.set(produtoId || null);
    this.isModalOpen.set(true);
  }

  /**
   * Fecha o modal
   */
  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingProdutoId.set(null);
  }

  /**
   * Handler de sucesso do modal
   */
  onModalSuccess(message: string): void {
    this.showSuccess(message);
  }

  /**
   * Abre modal de confirmação de exclusão
   */
  openDeleteModal(produto: Produto & { id: string }): void {
    this.deleteId.set(produto.id);
    this.deleteName.set(produto.nome);
    this.isDeleteModalOpen.set(true);
  }

  /**
   * Fecha modal de exclusão
   */
  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deleteId.set(null);
    this.deleteName.set('');
  }

  /**
   * Confirma e executa a exclusão
   */
  confirmDelete(): void {
    const currentDeleteId = this.deleteId();
    if (!currentDeleteId) return;

    this.isSaving.set(true);
    this.produtoSkuService.deletarProduto$(currentDeleteId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeDeleteModal();
        this.showSuccess('Produto e seus SKUs excluídos com sucesso!');
      },
      error: (error) => {
        this.isSaving.set(false);
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir produto');
      }
    });
  }

  /**
   * Mostra modal de sucesso
   */
  showSuccess(message: string): void {
    this.successMessage.set(message);
    this.isSuccessModalOpen.set(true);
  }

  /**
   * Fecha modal de sucesso
   */
  closeSuccessModal(): void {
    this.isSuccessModalOpen.set(false);
    this.successMessage.set('');
  }

  /**
   * Handler de mudança na busca
   */
  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  /**
   * Handler de mudança no filtro de categoria
   */
  onCategoriaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroCategoria.set(target.value);
  }

  /**
   * Limpa todos os filtros
   */
  limparFiltros(): void {
    this.searchTerm.set('');
    this.filtroCategoria.set('');
  }
}
