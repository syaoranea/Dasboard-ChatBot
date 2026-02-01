import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
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
 * Versão 2.0 - Totalmente redesenhada
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

  produtos: (Produto & { id: string })[] = [];
  skus: (SKU & { id: string })[] = [];
  categorias: (Categoria & { id: string })[] = [];

  // Dados agregados para exibição
  produtosComDados: any[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = true;
  isSaving = false;

  editingProdutoId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';

  // Filtros e busca
  searchTerm = '';
  filtroCategoria = '';

    constructor(
    private readonly cdr: ChangeDetectorRef
  ){}

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
        this.produtos = data.produtos;
        this.skus = data.skus;
        this.categorias = data.categorias;
        this.processarDados();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Processa dados para exibição na listagem
   * Agrega informações de SKUs aos produtos
   */
  private processarDados(): void {
    this.produtosComDados = this.produtos.map(produto => {
      const skusDoProduto = this.skus.filter(sku => sku.produtoId === produto.id);

      // Calcula totais e faixas
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

    // Aplica filtros
    this.aplicarFiltros();
  }

  /**
   * Aplica filtros de busca e categoria
   */
  private aplicarFiltros(): void {
    let resultados = [...this.produtosComDados];

    // Filtro de busca
    if (this.searchTerm) {
      const termo = this.searchTerm.toLowerCase();
      resultados = resultados.filter(p =>
        p.nome.toLowerCase().includes(termo) ||
        p.descricao?.toLowerCase().includes(termo) ||
        p.marca?.toLowerCase().includes(termo)
      );
    }

    // Filtro de categoria
    if (this.filtroCategoria) {
      resultados = resultados.filter(p => p.categoriaId === this.filtroCategoria);
    }

    this.produtosComDados = resultados;
  }

  /**
   * Obtém nome da categoria
   */
  getCategoriaNome(categoriaId: string): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
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
    this.editingProdutoId = produtoId || null;
    this.isModalOpen = true;
  }

  /**
   * Fecha o modal
   */
  closeModal(): void {
    this.isModalOpen = false;
    this.editingProdutoId = null;
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
    this.deleteId = produto.id;
    this.deleteName = produto.nome;
    this.isDeleteModalOpen = true;

  }

  /**
   * Fecha modal de exclusão
   */
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deleteId = null;
    this.deleteName = '';
  }

  /**
   * Confirma e executa a exclusão
   */
  confirmDelete(): void {
    if (!this.deleteId) return;

    this.isSaving = true;
    this.produtoSkuService.deletarProduto$(this.deleteId).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeDeleteModal();
        this.cdr.detectChanges();
        this.showSuccess('Produto e seus SKUs excluídos com sucesso!');
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir produto');
      }
    });
  }

  /**
   * Mostra modal de sucesso
   */
  showSuccess(message: string): void {
    this.successMessage = message;
    this.isSuccessModalOpen = true;
    this.cdr.detectChanges();

  }

  /**
   * Fecha modal de sucesso
   */
  closeSuccessModal(): void {
    this.isSuccessModalOpen = false;
    this.successMessage = '';
  }

  /**
   * Handler de mudança na busca
   */
  onSearchChange(): void {
    this.processarDados();
  }

  /**
   * Handler de mudança no filtro de categoria
   */
  onCategoriaChange(): void {
    this.processarDados();
  }

  /**
   * Limpa todos os filtros
   */
  limparFiltros(): void {
    this.searchTerm = '';
    this.filtroCategoria = '';
    this.processarDados();
  }
}
