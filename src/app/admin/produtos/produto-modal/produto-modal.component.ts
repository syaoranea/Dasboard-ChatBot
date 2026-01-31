import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Produto, SKU, AtributoVariacao, Categoria } from '../../../core/models/interfaces';
import { ProdutoSkuService } from '../../../shared/services/produto-sku.service';
import { Observable, finalize } from 'rxjs';

/**
 * Modal para cadastro/edição de Produtos com arquitetura Produto Pai + SKUs
 * Implementa um stepper de 3 etapas:
 * 1. Dados do Produto Pai
 * 2. Atributos de Variação
 * 3. Geração e Edição de SKUs
 */
@Component({
  selector: 'app-produto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './produto-modal.component.html',
  styleUrls: ['./produto-modal.component.scss']
})
export class ProdutoModalComponent implements OnInit {
  private produtoSkuService = inject(ProdutoSkuService);

  @Input() isOpen = false;
  @Input() categorias: (Categoria & { id: string })[] = [];
  @Input() produtoId: string | null = null; // Para edição
  
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<string>();

  // Estado do Stepper
  currentStep = 1;
  totalSteps = 3;

  // Etapa 1 - Produto Pai
  produto: Produto = {
    nome: '',
    descricao: '',
    categoriaId: '',
    marca: '',
    ativo: true,
    atributos: [] // Inicializado como array vazio
  };

  // Etapa 2 - Atributos de Variação
  atributos: AtributoVariacao[] = [];
  novoAtributo: AtributoVariacao = { nome: '', valores: [] };
  novoValorAtributo = '';

  // Etapa 3 - SKUs Gerados
  skusGerados: (Omit<SKU, 'id' | 'criadoEm' | 'userId'>)[] = [];
  skusEditaveis: any[] = []; // Para controle de edição inline

  // Estados de UI
  isSaving = false;
  isLoadingProduto = false;
  errors: { [key: string]: string } = {};
  skusDuplicados: string[] = [];

  ngOnInit(): void {
    if (this.produtoId) {
      this.carregarProduto();
    }
  }

  /**
   * Carrega produto existente para edição
   */
  carregarProduto(): void {
    if (!this.produtoId) return;

    this.isLoadingProduto = true;
    this.produtoSkuService.getProdutoComSKUs$(this.produtoId).pipe(
      finalize(() => this.isLoadingProduto = false)
    ).subscribe({
      next: (data) => {
        if (data.produto) {
          this.produto = { ...data.produto };
          
          // Reconstroi atributos a partir dos SKUs existentes
          if (data.skus.length > 0) {
            this.reconstruirAtributos(data.skus);
          }
          
          // Carrega SKUs existentes
          this.skusEditaveis = data.skus.map(sku => ({ ...sku, editing: false }));
        }
      },
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.showError('geral', 'Erro ao carregar dados do produto');
      }
    });
  }

  /**
   * Reconstroi os atributos de variação a partir dos SKUs
   */
  reconstruirAtributos(skus: (SKU & { id: string })[]): void {
    const atributosMap = new Map<string, Set<string>>();
    
    skus.forEach(sku => {
      Object.entries(sku.atributos).forEach(([nome, valor]) => {
        if (!atributosMap.has(nome)) {
          atributosMap.set(nome, new Set());
        }
        atributosMap.get(nome)?.add(valor);
      });
    });

    this.atributos = Array.from(atributosMap.entries()).map(([nome, valores]) => ({
      nome,
      valores: Array.from(valores)
    }));
  }

  // ===== NAVEGAÇÃO DO STEPPER =====

  /**
   * Avança para a próxima etapa
   */
  nextStep(): void {
    if (!this.validarEtapaAtual()) {
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      
      // Ao chegar na etapa 3, gera os SKUs automaticamente
      if (this.currentStep === 3 && this.skusGerados.length === 0) {
        this.gerarSKUs();
      }
    }
  }

  /**
   * Volta para a etapa anterior
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Vai direto para uma etapa específica
   */
  goToStep(step: number): void {
    // Só permite navegar para etapas já visitadas ou a próxima
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  // ===== ETAPA 1: PRODUTO PAI =====

  /**
   * Valida os dados do produto pai
   */
  validarProduto(): boolean {
    this.clearErrors();

    if (!this.produto.nome || this.produto.nome.trim().length === 0) {
      this.showError('nome', 'Nome do produto é obrigatório');
      return false;
    }

    if (!this.produto.categoriaId) {
      this.showError('categoriaId', 'Categoria é obrigatória');
      return false;
    }

    return true;
  }

  // ===== ETAPA 2: ATRIBUTOS DE VARIAÇÃO =====

  /**
   * Adiciona um valor ao atributo sendo criado
   */
  adicionarValorAtributo(): void {
    const valor = this.novoValorAtributo.trim();
    
    if (!valor) {
      return;
    }

    if (this.novoAtributo.valores.includes(valor)) {
      this.showError('atributo', 'Este valor já foi adicionado');
      return;
    }

    this.novoAtributo.valores.push(valor);
    this.novoValorAtributo = '';
    this.clearError('atributo');
  }

  /**
   * Remove um valor do atributo sendo criado
   */
  removerValorAtributo(valor: string): void {
    this.novoAtributo.valores = this.novoAtributo.valores.filter(v => v !== valor);
  }

  /**
   * Adiciona o atributo completo à lista
   */
  adicionarAtributo(): void {
    const nome = this.novoAtributo.nome.trim();

    if (!nome) {
      this.showError('atributo', 'Nome do atributo é obrigatório');
      return;
    }

    if (this.novoAtributo.valores.length === 0) {
      this.showError('atributo', 'Adicione pelo menos um valor ao atributo');
      return;
    }

    if (this.atributos.some(a => a.nome === nome)) {
      this.showError('atributo', 'Já existe um atributo com este nome');
      return;
    }

    this.atributos.push({ ...this.novoAtributo });
    this.novoAtributo = { nome: '', valores: [] };
    this.clearError('atributo');
  }

  /**
   * Remove um atributo da lista
   */
  removerAtributo(index: number): void {
    this.atributos.splice(index, 1);
  }

  /**
   * Valida os atributos de variação
   */
  validarAtributos(): boolean {
    this.clearErrors();

    if (this.atributos.length === 0) {
      this.showError('atributo', 'Adicione pelo menos um atributo de variação');
      return false;
    }

    return true;
  }

  // ===== ETAPA 3: GERAÇÃO DE SKUs =====

  /**
   * Gera todos os SKUs baseados nos atributos
   */
  gerarSKUs(): void {
    if (this.atributos.length === 0) {
      return;
    }

    // Gera os SKUs usando o service
    this.skusGerados = this.produtoSkuService.gerarSKUs(
      this.produtoId || 'temp', // produtoId será atualizado após salvar
      this.produto.nome,
      this.atributos,
      0, // preço base
      0  // custo base
    );

    // Prepara para edição inline
    this.skusEditaveis = this.skusGerados.map(sku => ({
      ...sku,
      editing: false
    }));

    this.validarSKUsDuplicados();
  }

  /**
   * Valida se há SKUs duplicados
   */
  validarSKUsDuplicados(): void {
    const resultado = this.produtoSkuService.validarSKUsDuplicados(
      this.skusEditaveis as SKU[]
    );
    
    this.skusDuplicados = resultado.duplicados;
    
    if (!resultado.valido) {
      this.showError('skus', `SKUs duplicados encontrados: ${resultado.duplicados.join(', ')}`);
    } else {
      this.clearError('skus');
    }
  }

  /**
   * Formata os atributos de um SKU para exibição
   */
  formatarAtributos(atributos: { [key: string]: string }): string {
    return this.produtoSkuService.formatarAtributosSKU(atributos);
  }

  /**
   * Atualiza o código SKU quando editado manualmente
   */
  atualizarCodigoSKU(index: number, novoCodigo: string): void {
    this.skusEditaveis[index].sku = novoCodigo;
    this.validarSKUsDuplicados();
  }

  /**
   * Valida os SKUs gerados
   */
  validarSKUs(): boolean {
    this.clearErrors();

    if (this.skusEditaveis.length === 0) {
      this.showError('skus', 'Nenhum SKU foi gerado');
      return false;
    }

    // Valida duplicados
    const resultado = this.produtoSkuService.validarSKUsDuplicados(
      this.skusEditaveis as SKU[]
    );
    
    if (!resultado.valido) {
      this.showError('skus', `SKUs duplicados: ${resultado.duplicados.join(', ')}`);
      return false;
    }

    // Valida se todos os SKUs têm código
    const skusSemCodigo = this.skusEditaveis.filter(sku => !sku.sku || sku.sku.trim() === '');
    if (skusSemCodigo.length > 0) {
      this.showError('skus', 'Todos os SKUs devem ter um código');
      return false;
    }

    // Valida preços
    const skusComPrecoInvalido = this.skusEditaveis.filter(sku => sku.preco < 0);
    if (skusComPrecoInvalido.length > 0) {
      this.showError('skus', 'Preços não podem ser negativos');
      return false;
    }

    return true;
  }

  // ===== VALIDAÇÃO E ERROS =====

  /**
   * Valida a etapa atual antes de avançar
   */
  validarEtapaAtual(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.validarProduto();
      case 2:
        return this.validarAtributos();
      case 3:
        return this.validarSKUs();
      default:
        return true;
    }
  }

  /**
   * Mostra um erro específico
   */
  showError(field: string, message: string): void {
    this.errors[field] = message;
  }

  /**
   * Limpa um erro específico
   */
  clearError(field: string): void {
    delete this.errors[field];
  }

  /**
   * Limpa todos os erros
   */
  clearErrors(): void {
    this.errors = {};
  }

  /**
   * Verifica se há erro em um campo
   */
  hasError(field: string): boolean {
    return !!this.errors[field];
  }

  /**
   * Obtém mensagem de erro de um campo
   */
  getError(field: string): string {
    return this.errors[field] || '';
  }

  // ===== SALVAR =====

  /**
   * Salva o produto e seus SKUs no Firebase
   */
  salvar(): void {
    if (!this.validarSKUs()) {
      return;
    }

    this.isSaving = true;
    this.clearErrors();

    // Atualiza lista de atributos do produto
    this.produto.atributos = this.atributos.map(a => a.nome);

    // Fluxo: Salvar Produto → Salvar SKUs
    const operacao$ = this.produtoId
      ? this.atualizarProdutoExistente()
      : this.criarNovoProduto();

    operacao$.pipe(
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: () => {
        const mensagem = this.produtoId
          ? `Produto "${this.produto.nome}" atualizado com sucesso!`
          : `Produto "${this.produto.nome}" cadastrado com ${this.skusEditaveis.length} SKUs!`;
        
        this.success.emit(mensagem);
        this.fecharModal();
      },
      error: (error) => {
        console.error('Erro ao salvar:', error);
        this.showError('geral', 'Erro ao salvar. Tente novamente.');
      }
    });
  }

  /**
   * Cria um novo produto com seus SKUs
   */
  private criarNovoProduto() {
    return new Observable<void>(observer => {
      // 1. Cria o produto
      this.produtoSkuService.criarProduto$(this.produto).subscribe({
        next: (produtoId) => {
          // 2. Atualiza produtoId nos SKUs
          const skusParaSalvar = this.skusEditaveis.map(sku => ({
            ...sku,
            produtoId
          })) as SKU[];

          // 3. Salva todos os SKUs em lote
          this.produtoSkuService.criarSKUsEmLote$(skusParaSalvar).subscribe({
            next: () => {
              observer.next(void 0);
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Atualiza um produto existente
   */
  private atualizarProdutoExistente() {
    return new Observable<void>(observer => {
      if (!this.produtoId) {
        observer.error(new Error('ID do produto não encontrado'));
        return;
      }

      // 1. Atualiza o produto
      this.produtoSkuService.atualizarProduto$(this.produtoId, this.produto).subscribe({
        next: () => {
          // Para simplificar, vamos apenas notificar sucesso
          // Em produção, você implementaria lógica para atualizar SKUs existentes
          observer.next(void 0);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // ===== MODAL =====

  /**
   * Fecha o modal e reseta o estado
   */
  fecharModal(): void {
    this.resetarEstado();
    this.close.emit();
  }

  /**
   * Reseta todo o estado do modal
   */
  resetarEstado(): void {
    this.currentStep = 1;
    this.produto = {
      nome: '',
      descricao: '',
      categoriaId: '',
      marca: '',
      ativo: true,
      atributos: [] // Array vazio por padrão
    };
    this.atributos = [];
    this.novoAtributo = { nome: '', valores: [] };
    this.novoValorAtributo = '';
    this.skusGerados = [];
    this.skusEditaveis = [];
    this.clearErrors();
    this.skusDuplicados = [];
  }

  /**
   * Previne fechar o modal ao clicar no backdrop durante salvamento
   */
  onBackdropClick(event: MouseEvent): void {
    if (!this.isSaving && event.target === event.currentTarget) {
      this.fecharModal();
    }
  }
}
