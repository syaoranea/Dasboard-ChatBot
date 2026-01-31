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

export interface Orcamento {
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
