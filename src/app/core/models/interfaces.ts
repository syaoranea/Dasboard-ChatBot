export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  nivel: 'admin' | 'operador';
  criadoEm?: any;
  userId?: string;
}

// ===== PRODUTO PAI (Catálogo) =====
export interface Produto {
  id?: string;
  nome: string;
  descricao?: string;
  categoriaId: string;
  marca?: string;
  ativo: boolean;
  atributos?: string[]; // Array com nomes dos atributos de variação (ex: ["Cor", "Tamanho"])
  criadoEm?: any;
  userId?: string;
  
  // Campos legados para compatibilidade (serão removidos gradualmente)
  preco?: number;
  estoque?: number;
  tipoVariacao?: string;
  valorVariacao?: string;
  estoqueVariacao?: number;
}

// ===== SKU (Variação Vendável) =====
export interface SKU {
  id?: string;
  sku: string; // Código SKU único (ex: "CAM-PRE-M")
  produtoId: string; // Referência ao produto pai
  preco: number;
  estoque: number;
  custo?: number;
  ativo: boolean;
  atributos: { [key: string]: string }; // Ex: { "Cor": "Preto", "Tamanho": "M" }
  criadoEm?: any;
  userId?: string;
}

// ===== ATRIBUTO DE VARIAÇÃO =====
export interface AtributoVariacao {
  nome: string; // Ex: "Cor", "Tamanho"
  valores: string[]; // Ex: ["Preto", "Branco", "Azul"]
}

// ===== PRODUTO LEGACY (Manter compatibilidade) =====
export interface ProdutoLegacy {
  id?: string;
  nome: string;
  categoriaId: string;
  preco: number;
  estoque: number;
  ativo?: boolean;
  tipoVariacao?: string;
  valorVariacao?: string;
  estoqueVariacao?: number;
  criadoEm?: any;
  userId?: string;
}

export interface Cliente {
  id?: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  rua?: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  criadoEm?: any;
  userId?: string;
}

// ===== ORÇAMENTO (Nova Estrutura com SKUs) =====
export interface Orcamento {
  id?: string;
  status: 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'CONVERTIDO';
  clienteId: string; // Referência ao ID do cliente
  validade?: string; // Data de validade (formato ISO)
  condicaoPagamento?: string;
  observacoes?: string;
  valores: OrcamentoValores;
  itens: OrcamentoItem[];
  criadoEm?: any;
  atualizadoEm?: any;
  userId?: string;
}

export interface OrcamentoValores {
  subtotal: number;
  desconto: number; // Desconto geral em valor
  frete: number;
  total: number;
}

export interface OrcamentoItem {
  sku: string; // Código SKU único
  produtoId: string; // Referência ao produto pai
  descricao: string; // Descrição completa do item (ex: "Camiseta Básica - Preto - M")
  quantidade: number;
  precoUnitario: number; // Preço no momento da criação (snapshot)
  desconto: number; // Desconto por item em valor
  total: number; // Total do item (quantidade * precoUnitario - desconto)
  snapshot: OrcamentoItemSnapshot; // Dados congelados do momento da criação
}

export interface OrcamentoItemSnapshot {
  atributos: { [key: string]: string }; // Ex: { "Cor": "Preto", "Tamanho": "M" }
  produtoNome: string; // Nome do produto no momento da criação
  categoriaNome?: string; // Nome da categoria (opcional)
}

// ===== ORÇAMENTO LEGACY (Manter compatibilidade temporária) =====
export interface OrcamentoLegacy {
  id?: string;
  cliente: string;
  produtos?: OrcamentoProduto[];
  frete?: number;
  valor: number;
  status: 'aberto' | 'aprovado' | 'rejeitado';
  criadoEm?: any;
  userId?: string;
}

export interface OrcamentoProduto {
  produtoId: string;
  quantidade: number;
}

export interface Categoria {
  id?: string;
  nome: string;
  descricao?: string;
  criadoEm?: any;
  userId?: string;
}

export interface Empresa {
  id?: string;
  nome: string;
  cnpj: string;
  telefone: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  criadoEm?: any;
  userId?: string;
}
