import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, finalize } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { Orcamento, Produto } from '../../core/models/interfaces';

interface ProdutoItem {
  produtoId: string;
  quantidade: number;
}

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent, LoadingComponent],
  templateUrl: './orcamentos.component.html',
  styleUrl: './orcamentos.component.scss'
})
export class OrcamentosComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  orcamentos: (Orcamento & { id: string })[] = [];
  produtos: (Produto & { id: string })[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = true;
  isSaving = false;

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


  constructor(
    private readonly cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    combineLatest({
      orcamentos: this.firebaseService.getCollection$<Orcamento>('orcamentos'),
      produtos: this.firebaseService.getCollection$<Produto>('produtos')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.orcamentos = data.orcamentos;
        this.produtos = data.produtos;
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

  getProdutoNome(produtoId: string): string {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? produto.nome : '-';
  }

  getProdutoPreco(produtoId: string): number {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? (produto.preco || 0) : 0;
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

  saveOrcamento(): void {
    this.isSaving = true;
    const dataToSave = {
      ...this.formData,
      produtos: this.produtosItems.filter(p => p.produtoId)
    };
    const isEditing = !!this.editingId;
    const message = isEditing
      ? 'Orçamento atualizado com sucesso!'
      : 'Orçamento cadastrado com sucesso!';

    const handleSuccess = () => {
      this.isSaving = false;
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving = false;
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar orçamento');
    };

    if (isEditing && this.editingId) {
      this.firebaseService.updateDocument$('orcamentos', this.editingId, dataToSave).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.firebaseService.addDocument$('orcamentos', dataToSave).subscribe({
        next: handleSuccess,
        error: handleError
      });
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

  confirmDelete(): void {
    if (this.deleteId) {
      this.isSaving = true;
      this.firebaseService.deleteDocument$('orcamentos', this.deleteId).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.showSuccess('Registro excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir orçamento');
        }
      });
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
