import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, switchMap, forkJoin, of } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { Produto, SKU, AtributoVariacao } from '../../core/models/interfaces';

/**
 * Service para gerenciamento de Produtos e SKUs
 * Implementa a arquitetura Produto Pai + SKUs separados
 */
@Injectable({
  providedIn: 'root'
})
export class ProdutoSkuService {
  private firebaseService = inject(FirebaseService);

  /**
   * Obtém todos os produtos (Produto Pai)
   */
  getProdutos$(): Observable<(Produto & { id: string })[]> {
    return this.firebaseService.getCollection$<Produto>('produtos');
  }

  /**
   * Obtém todos os SKUs
   */
  getSKUs$(): Observable<(SKU & { id: string })[]> {
    return this.firebaseService.getCollection$<SKU>('skus');
  }

  /**
   * Obtém SKUs de um produto específico
   */
  getSKUsByProduto$(produtoId: string): Observable<(SKU & { id: string })[]> {
    return this.getSKUs$().pipe(
      map(skus => skus.filter(sku => sku.produtoId === produtoId))
    );
  }

  /**
   * Obtém um produto com seus SKUs
   */
  getProdutoComSKUs$(produtoId: string): Observable<{
    produto: (Produto & { id: string }) | null;
    skus: (SKU & { id: string })[];
  }> {
    return combineLatest({
      produto: this.firebaseService.getDocument$<Produto & { id: string }>('produtos', produtoId),
      skus: this.getSKUsByProduto$(produtoId)
    });
  }

  /**
   * Cria um novo produto (Produto Pai)
   */
  criarProduto$(produto: Produto): Observable<string> {
    return this.firebaseService.addDocument$<Produto>('produtos', produto);
  }

  /**
   * Atualiza um produto existente
   */
  atualizarProduto$(produtoId: string, produto: Partial<Produto>): Observable<void> {
    return this.firebaseService.updateDocument$<Partial<Produto>>('produtos', produtoId, produto);
  }

  /**
   * Deleta um produto e todos os seus SKUs
   */
  deletarProduto$(produtoId: string): Observable<void> {
    return this.getSKUsByProduto$(produtoId).pipe(
      switchMap(skus => {
        // Deleta todos os SKUs primeiro
        const deleteOperations = skus.map(sku => 
          this.firebaseService.deleteDocument$('skus', sku.id!)
        );
        
        // Se não houver SKUs, retorna um observable vazio
        if (deleteOperations.length === 0) {
          return of(void 0);
        }
        
        // Aguarda todas as deleções de SKUs
        return forkJoin(deleteOperations).pipe(map(() => void 0));
      }),
      switchMap(() => {
        // Depois deleta o produto
        return this.firebaseService.deleteDocument$('produtos', produtoId);
      })
    );
  }

  /**
   * Cria um novo SKU
   */
  criarSKU$(sku: SKU): Observable<string> {
    return this.firebaseService.addDocument$<SKU>('skus', sku);
  }

  /**
   * Cria múltiplos SKUs de uma vez (operação em lote)
   */
  criarSKUsEmLote$(skus: SKU[]): Observable<string[]> {
    const operations = skus.map(sku => this.criarSKU$(sku));
    return forkJoin(operations);
  }

  /**
   * Atualiza um SKU existente
   */
  atualizarSKU$(skuId: string, sku: Partial<SKU>): Observable<void> {
    return this.firebaseService.updateDocument$<Partial<SKU>>('skus', skuId, sku);
  }

  /**
   * Deleta um SKU
   */
  deletarSKU$(skuId: string): Observable<void> {
    return this.firebaseService.deleteDocument$('skus', skuId);
  }

  /**
   * Gera todas as combinações possíveis de atributos
   * Exemplo: [Cor: [Preto, Branco], Tamanho: [P, M, G]] 
   * Retorna: [
   *   {Cor: "Preto", Tamanho: "P"},
   *   {Cor: "Preto", Tamanho: "M"},
   *   ...
   * ]
   */
  gerarCombinacoes(atributos: AtributoVariacao[]): { [key: string]: string }[] {
    if (atributos.length === 0) {
      return [{}];
    }

    const [primeiro, ...resto] = atributos;
    const combinacoesResto = this.gerarCombinacoes(resto);
    const resultado: { [key: string]: string }[] = [];

    for (const valor of primeiro.valores) {
      for (const combinacao of combinacoesResto) {
        resultado.push({
          [primeiro.nome]: valor,
          ...combinacao
        });
      }
    }

    return resultado;
  }

  /**
   * Gera código SKU único baseado nas combinações de atributos
   * Exemplo: produto "Camiseta", atributos {Cor: "Preto", Tamanho: "M"}
   * Retorna: "CAM-PRE-M"
   */
  gerarCodigoSKU(nomeProduto: string, atributos: { [key: string]: string }): string {
    // Pega as 3 primeiras letras do nome do produto
    const prefixo = nomeProduto
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    // Gera códigos baseados nos valores dos atributos
    const sufixos = Object.values(atributos)
      .map(valor => valor.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, ''))
      .join('-');

    return `${prefixo}-${sufixos}`;
  }

  /**
   * Gera SKUs baseados nos atributos de variação
   * Retorna um array de SKUs prontos para serem salvos (sem ID)
   */
  gerarSKUs(
    produtoId: string,
    nomeProduto: string,
    atributos: AtributoVariacao[],
    precoBase: number = 0,
    custoBase: number = 0
  ): Omit<SKU, 'id' | 'criadoEm' | 'userId'>[] {
    const combinacoes = this.gerarCombinacoes(atributos);
    
    return combinacoes.map(combinacao => ({
      sku: this.gerarCodigoSKU(nomeProduto, combinacao),
      produtoId,
      preco: precoBase,
      estoque: 0,
      custo: custoBase,
      ativo: true,
      atributos: combinacao
    }));
  }

  /**
   * Valida se há SKUs duplicados baseado no código SKU
   */
  validarSKUsDuplicados(skus: SKU[]): { valido: boolean; duplicados: string[] } {
    const codigos = skus.map(sku => sku.sku);
    const duplicados = codigos.filter((codigo, index) => codigos.indexOf(codigo) !== index);
    const duplicadosUnicos = [...new Set(duplicados)];

    return {
      valido: duplicadosUnicos.length === 0,
      duplicados: duplicadosUnicos
    };
  }

  /**
   * Formata os atributos de um SKU para exibição
   * Exemplo: {Cor: "Preto", Tamanho: "M"} → "Preto / M"
   */
  formatarAtributosSKU(atributos: { [key: string]: string }): string {
    return Object.values(atributos).join(' / ');
  }

  /**
   * Calcula o total de estoque de todos os SKUs de um produto
   */
  calcularEstoqueTotalProduto$(produtoId: string): Observable<number> {
    return this.getSKUsByProduto$(produtoId).pipe(
      map(skus => skus.reduce((total, sku) => total + (sku.estoque || 0), 0))
    );
  }

  /**
   * Obtém o preço mínimo e máximo dos SKUs de um produto
   */
  obterFaixaPreco$(produtoId: string): Observable<{ min: number; max: number } | null> {
    return this.getSKUsByProduto$(produtoId).pipe(
      map(skus => {
        if (skus.length === 0) return null;
        
        const precos = skus.map(sku => sku.preco);
        return {
          min: Math.min(...precos),
          max: Math.max(...precos)
        };
      })
    );
  }
}
