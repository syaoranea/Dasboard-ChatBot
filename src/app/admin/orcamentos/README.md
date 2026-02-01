# Modal de Criação de Orçamento - Documentação Completa

## 📋 Visão Geral

Sistema completo de gerenciamento de orçamentos com suporte a SKUs, implementado em Angular 21 com Tailwind CSS e Firebase Firestore. O modal oferece uma interface intuitiva com stepper de 3 etapas para criação e edição de orçamentos.

## 🎯 Funcionalidades Implementadas

### ✅ Estrutura do Modal (Stepper/Abas)

#### **Etapa 1 - Dados Gerais**
- ✅ Campo de seleção de Cliente (select com lista de clientes do Firebase)
- ✅ Campo de Validade do orçamento (date picker)
- ✅ Campo de Condição de pagamento (opcional, texto livre)
- ✅ Campo de Observações (textarea)
- ✅ Status inicial: RASCUNHO

#### **Etapa 2 - Inclusão de Itens (SKUs)**
- ✅ Buscar produto com autocomplete e debounce (300ms)
- ✅ Lista de SKUs disponíveis após selecionar produto
- ✅ Visualização de atributos do SKU (cor, tamanho, etc.)
- ✅ Campo de quantidade (numérico, min=1, máx=estoque)
- ✅ Campo de desconto por item (valor em R$)
- ✅ Exibição de preço unitário (readonly, snapshot do SKU)
- ✅ Botão "Adicionar Item" com validações
- ✅ Tabela de itens adicionados com colunas:
  - SKU (código único)
  - Descrição (Produto + Atributos)
  - Quantidade
  - Preço Unitário
  - Desconto
  - Total
  - Ações (remover)
- ✅ Validações: SKU não duplicado, quantidade positiva

#### **Etapa 3 - Totais e Condições**
- ✅ Subtotal (calculado automaticamente)
- ✅ Desconto geral (opcional, valor em R$)
- ✅ Frete (input numérico)
- ✅ Total final (calculado em tempo real)
- ✅ Breakdown visual dos valores

#### **Ações do Modal**
- ✅ Botão "Salvar Rascunho" (status: RASCUNHO)
- ✅ Botão "Enviar Orçamento" (status: ENVIADO)
- ✅ Botão "Cancelar"
- ✅ Navegação entre etapas (Voltar/Próximo)
- ✅ Estrutura preparada para futuro botão "Converter em Pedido"

## 🏗️ Arquitetura de Componentes

### Componentes Criados

```
src/app/admin/orcamentos/
├── components/
│   ├── product-search/
│   │   └── product-search.component.ts          # Busca de produtos com autocomplete
│   ├── sku-selector/
│   │   └── sku-selector.component.ts            # Seleção de SKU específico
│   ├── items-table/
│   │   └── items-table.component.ts             # Tabela de itens do orçamento
│   ├── totals-calculator/
│   │   └── totals-calculator.component.ts       # Calculadora de totais
│   └── orcamento-modal/
│       └── orcamento-modal.component.ts         # Modal principal com stepper
├── orcamentos.component.ts                       # Componente principal (listagem)
├── orcamentos.component.html
├── orcamentos.component.scss
└── README.md                                     # Esta documentação
```

### Interfaces Atualizadas

```typescript
// src/app/core/models/interfaces.ts

// Orçamento principal
interface Orcamento {
  id?: string;
  status: 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'CONVERTIDO';
  clienteId: string;
  validade?: string;
  condicaoPagamento?: string;
  observacoes?: string;
  valores: OrcamentoValores;
  itens: OrcamentoItem[];
  criadoEm?: any;
  atualizadoEm?: any;
  userId?: string;
}

// Valores do orçamento
interface OrcamentoValores {
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
}

// Item do orçamento (com snapshot)
interface OrcamentoItem {
  sku: string;
  produtoId: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  total: number;
  snapshot: OrcamentoItemSnapshot;
}

// Snapshot congelado no momento da criação
interface OrcamentoItemSnapshot {
  atributos: { [key: string]: string };
  produtoNome: string;
  categoriaNome?: string;
}
```

## 🔧 Componentes Detalhados

### 1. ProductSearchComponent

**Responsabilidade:** Buscar produtos com autocomplete e debounce

**Features:**
- Busca em tempo real com debounce de 300ms
- Filtro por nome e descrição
- Exibição de status (Ativo/Inativo)
- Feedback visual de produto selecionado
- Botão para limpar seleção

**Uso:**
```html
<app-product-search
  (produtoSelected)="onProdutoSelected($event)"
></app-product-search>
```

### 2. SkuSelectorComponent

**Responsabilidade:** Selecionar SKU específico após escolher produto

**Features:**
- Lista todos os SKUs do produto selecionado
- Exibe atributos, preço e estoque
- Não exibe SKUs já adicionados ao orçamento
- Campo de quantidade (validado contra estoque)
- Campo de desconto por item
- Cálculo de total do item em tempo real
- Validações completas antes de adicionar

**Uso:**
```html
<app-sku-selector
  [produto]="selectedProduto"
  [existingSkus]="getExistingSkus()"
  (itemAdded)="onItemAdded($event)"
></app-sku-selector>
```

### 3. ItemsTableComponent

**Responsabilidade:** Exibir tabela de itens do orçamento

**Features:**
- Tabela responsiva com todas as colunas necessárias
- Exibição de atributos formatados
- Cálculo de subtotal
- Botão de remover item
- Estado vazio personalizado

**Uso:**
```html
<app-items-table
  [items]="formData.itens"
  (itemRemoved)="onItemRemoved($event)"
></app-items-table>
```

### 4. TotalsCalculatorComponent

**Responsabilidade:** Calcular e exibir totais do orçamento

**Features:**
- Exibição de subtotal (readonly)
- Campo de desconto geral
- Campo de frete
- Cálculo de total final em tempo real
- Breakdown visual dos valores
- Validações (desconto não pode ser maior que subtotal)
- Indicador de percentual de desconto

**Uso:**
```html
<app-totals-calculator
  [subtotal]="calcularSubtotal()"
  [valores]="formData.valores"
  (valoresChange)="onValoresChange($event)"
></app-totals-calculator>
```

### 5. OrcamentoModalComponent

**Responsabilidade:** Modal principal com stepper de 3 etapas

**Features:**
- Stepper visual com indicadores
- Navegação entre etapas com validações
- Integração com todos os componentes filhos
- Salvamento como rascunho ou envio
- Suporte a edição de orçamentos existentes
- Loading states e feedback visual

**Uso:**
```html
<app-orcamento-modal
  [isOpen]="isModalOpen"
  [editingOrcamento]="editingOrcamento"
  (close)="closeModal()"
  (saved)="onOrcamentoSaved()"
></app-orcamento-modal>
```

## 🔐 Regras de Negócio Implementadas

### ✅ Snapshot de Dados
- Ao adicionar um SKU ao orçamento, o sistema congela:
  - Preço unitário
  - Descrição do produto
  - Atributos do SKU
- Isso garante que alterações futuras no cadastro não afetem orçamentos existentes

### ✅ Validações
- Cliente obrigatório
- Pelo menos 1 item no orçamento
- Quantidade deve ser positiva e não pode exceder estoque
- SKU não pode ser duplicado no mesmo orçamento
- Desconto não pode ser negativo
- Desconto por item não pode exceder o valor do item
- Desconto geral não pode exceder o subtotal

### ✅ Cálculos Automáticos
- Subtotal = Soma de todos os itens (quantidade × preço - desconto)
- Total = Subtotal - Desconto Geral + Frete
- Todos os cálculos são reativos e atualizados em tempo real

### ✅ Status do Orçamento
- **RASCUNHO**: Orçamento em elaboração
- **ENVIADO**: Orçamento enviado ao cliente
- **APROVADO**: Cliente aprovou o orçamento
- **REJEITADO**: Cliente rejeitou o orçamento
- **CONVERTIDO**: Orçamento convertido em pedido (futuro)

## 🎨 Estilização

- **Tailwind CSS** para todos os estilos
- Design responsivo (mobile-first)
- Paleta de cores consistente usando variáveis CSS
- Feedback visual claro para estados:
  - Hover effects
  - Estados de loading
  - Validações e erros
  - Itens selecionados
- Ícones Font Awesome

## 📊 Estrutura de Dados no Firestore

### Collection: orcamentos

```json
{
  "id": "orc_2026_000123",
  "status": "RASCUNHO",
  "clienteId": "cli_001",
  "validade": "2026-02-10",
  "condicaoPagamento": "30 dias",
  "observacoes": "Orçamento para campanha de verão",
  "valores": {
    "subtotal": 599.0,
    "desconto": 50.0,
    "frete": 30.0,
    "total": 579.0
  },
  "itens": [
    {
      "sku": "CAM-PRE-M",
      "produtoId": "prod_001",
      "descricao": "Camiseta Básica - Preto - M",
      "quantidade": 10,
      "precoUnitario": 59.9,
      "desconto": 0,
      "total": 599.0,
      "snapshot": {
        "atributos": {
          "Cor": "Preto",
          "Tamanho": "M"
        },
        "produtoNome": "Camiseta Básica"
      }
    }
  ],
  "criadoEm": "Timestamp",
  "atualizadoEm": "Timestamp",
  "userId": "user_001"
}
```

## 🚀 Como Usar

### Criar Novo Orçamento

1. Clique no botão "Novo Orçamento"
2. **Etapa 1 - Dados Gerais:**
   - Selecione o cliente
   - Defina validade (opcional)
   - Informe condição de pagamento (opcional)
   - Adicione observações (opcional)
   - Clique em "Próximo"

3. **Etapa 2 - Itens:**
   - Busque um produto
   - Selecione o SKU desejado
   - Defina quantidade
   - Adicione desconto se necessário
   - Clique em "Adicionar Item"
   - Repita para adicionar mais itens
   - Clique em "Próximo"

4. **Etapa 3 - Totais:**
   - Revise os itens
   - Adicione desconto geral (opcional)
   - Informe valor do frete (opcional)
   - Clique em "Salvar Rascunho" ou "Enviar Orçamento"

### Editar Orçamento Existente

1. Clique no ícone de edição (lápis) na tabela
2. O modal abrirá com os dados preenchidos
3. Navegue pelas etapas e faça as alterações
4. Salve as mudanças

### Excluir Orçamento

1. Clique no ícone de exclusão (lixeira) na tabela
2. Confirme a exclusão no modal
3. O orçamento será removido permanentemente

## 🔄 Fluxo de Trabalho Recomendado

```
1. RASCUNHO → 2. ENVIADO → 3. APROVADO → 4. CONVERTIDO (Pedido)
                    ↓
                REJEITADO
```

## 📝 Observações Importantes

### Performance
- Debounce de 300ms na busca de produtos evita requests excessivos
- Lista de SKUs é filtrada para mostrar apenas itens disponíveis
- Componentes utilizam `OnPush` change detection onde apropriado

### Segurança
- Todos os dados são salvos com o `userId` do usuário autenticado
- Firebase Rules devem ser configuradas para validar permissões
- Snapshots garantem integridade dos dados históricos

### Extensibilidade
- Estrutura preparada para conversão em Pedido
- Fácil adicionar novos campos ao formulário
- Componentes reutilizáveis podem ser usados em outros módulos

## 🐛 Troubleshooting

### SKUs não aparecem após selecionar produto
- Verifique se o produto possui SKUs cadastrados
- Verifique se os SKUs estão com `ativo: true`
- Verifique se os SKUs já foram adicionados ao orçamento

### Não consigo adicionar item
- Verifique se a quantidade está dentro do estoque disponível
- Verifique se o SKU já não foi adicionado anteriormente
- Verifique se o desconto não é maior que o valor do item

### Total não está calculando corretamente
- Verifique se todos os itens têm valores válidos
- Verifique se o desconto geral não está negativo
- Limpe o cache do navegador se necessário

## 🔮 Melhorias Futuras

### Planejadas
- [ ] Exportar orçamento para PDF
- [ ] Enviar orçamento por email
- [ ] Histórico de alterações
- [ ] Duplicar orçamento
- [ ] Conversão para Pedido (botão já preparado)
- [ ] Filtros e busca na listagem
- [ ] Paginação para grandes volumes
- [ ] Gráficos e relatórios

### Possíveis
- [ ] Templates de orçamento
- [ ] Sugestão de produtos relacionados
- [ ] Aplicar desconto percentual
- [ ] Múltiplas condições de pagamento
- [ ] Aprovação multinível
- [ ] Integração com sistema de estoque
- [ ] Notificações push

## 📚 Referências

- [Angular Documentation](https://angular.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [RxJS](https://rxjs.dev/)

## 👥 Contribuição

Para contribuir com melhorias:

1. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
2. Faça suas alterações
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto faz parte do Dashboard ChatBot e segue a mesma licença do projeto principal.

---

**Desenvolvido com ❤️ usando Angular, Tailwind CSS e Firebase**
