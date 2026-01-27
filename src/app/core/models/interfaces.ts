export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  nivel: 'admin' | 'operador';
  criadoEm?: any;
  userId?: string;
}

export interface Produto {
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
