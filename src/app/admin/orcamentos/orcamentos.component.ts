import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../shared/services/firebase.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { Orcamento, Produto } from '../../core/models/interfaces';

interface ProdutoItem {
  produtoId: string;
  quantidade: number;
}

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent],
  templateUrl: './orcamentos.component.html',
  styleUrl: './orcamentos.component.scss'
})
export class OrcamentosComponent implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private unsubscribes: (() => void)[] = [];

  orcamentos: (Orcamento & { id: string })[] = [];
  produtos: (Produto & { id: string })[] = [];
  
  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';
  
  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';

  produtosItems: ProdutoItem[] = [{ produtoId: '', quantidade: 1 }];

  formData: Orcamento = {
    cliente: '',
    frete: 0,
    valor: 0,
    status: 'aberto'
  };

  ngOnInit(): void {
    const unsubOrcamentos = this.firebaseService.subscribeToCollection<Orcamento>('orcamentos', (data) => {
      this.orcamentos = data;
    });
    this.unsubscribes.push(unsubOrcamentos);

    const unsubProdutos = this.firebaseService.subscribeToCollection<Produto>('produtos', (data) => {
      this.produtos = data;
    });
    this.unsubscribes.push(unsubProdutos);
  }

  ngOnDestroy(): void {
    this.unsubscribes.forEach(unsub => unsub());
  }

  getProdutoNome(produtoId: string): string {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : '-';
  }

  getProdutoPreco(produtoId: string): number {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? produto.preco : 0;
  }

  openModal(orcamento?: Orcamento & { id: string }): void {
    if (orcamento) {
      this.editingId = orcamento.id;
      this.formData = { ...orcamento };
      this.produtosItems = orcamento.produtos?.length 
        ? [...orcamento.produtos] 
        : [{ produtoId: '', quantidade: 1 }];
    } else {
      this.editingId = null;
      this.formData = { cliente: '', frete: 0, valor: 0, status: 'aberto' };
      this.produtosItems = [{ produtoId: '', quantidade: 1 }];
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.formData = { cliente: '', frete: 0, valor: 0, status: 'aberto' };
    this.produtosItems = [{ produtoId: '', quantidade: 1 }];
  }

  adicionarProduto(): void {
    this.produtosItems.push({ produtoId: '', quantidade: 1 });
  }

  removerProduto(index: number): void {
    if (this.produtosItems.length > 1) {
      this.produtosItems.splice(index, 1);
      this.calcularTotal();
    }
  }

  calcularTotal(): void {
    let total = 0;
    this.produtosItems.forEach(item => {
      if (item.produtoId) {
        const preco = this.getProdutoPreco(item.produtoId);
        total += preco * item.quantidade;
      }
    });
    total += this.formData.frete || 0;
    this.formData.valor = total;
  }

  async saveOrcamento(): Promise<void> {
    try {
      const dataToSave = {
        ...this.formData,
        produtos: this.produtosItems.filter(p => p.produtoId)
      };

      if (this.editingId) {
        await this.firebaseService.updateDocument('orcamentos', this.editingId, dataToSave);
        this.showSuccess(`Orçamento atualizado com sucesso!`);
      } else {
        await this.firebaseService.addDocument('orcamentos', dataToSave);
        this.showSuccess(`Orçamento cadastrado com sucesso!`);
      }
      this.closeModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar orçamento');
    }
  }

  openDeleteModal(orcamento: Orcamento & { id: string }): void {
    this.deleteId = orcamento.id;
    this.deleteName = orcamento.cliente;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.deleteId = null;
    this.deleteName = '';
  }

  async confirmDelete(): Promise<void> {
    if (this.deleteId) {
      try {
        await this.firebaseService.deleteDocument('orcamentos', this.deleteId);
        this.closeDeleteModal();
        this.showSuccess('Registro excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir orçamento');
      }
    }
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.isSuccessModalOpen = true;
  }

  closeSuccessModal(): void {
    this.isSuccessModalOpen = false;
    this.successMessage = '';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  }
}
