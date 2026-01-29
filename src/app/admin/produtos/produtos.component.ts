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
import { Produto, Categoria } from '../../core/models/interfaces';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent, LoadingComponent],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.scss'
})
export class ProdutosComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  produtos: (Produto & { id: string })[] = [];
  categorias: (Categoria & { id: string })[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = true;
  isSaving = false;

  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';
  variacaoAtiva = false;

  formData: Produto = {
    nome: '',
    categoriaId: '',
    preco: 0,
    estoque: 0,
    ativo: true
  };

  constructor(
    private readonly cdr: ChangeDetectorRef
  ){}
  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    combineLatest({
      produtos: this.firebaseService.getCollection$<Produto>('produtos'),
      categorias: this.firebaseService.getCollection$<Categoria>('categorias')
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.produtos = data.produtos;
        this.categorias = data.categorias;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.isLoading = false;
      }
    });
  }

  getCategoriaNome(categoriaId: string): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : '-';
  }

  openModal(produto?: Produto & { id: string }): void {
    this.variacaoAtiva = false;
    if (produto) {
      this.editingId = produto.id;
      this.formData = { ...produto };
      if (produto.tipoVariacao) {
        this.variacaoAtiva = true;
      }
    } else {
      this.editingId = null;
      this.formData = { nome: '', categoriaId: '', preco: 0, estoque: 0, ativo: true };
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.variacaoAtiva = false;
    this.formData = { nome: '', categoriaId: '', preco: 0, estoque: 0, ativo: true };
  }

  toggleVariacao(): void {
    this.variacaoAtiva = !this.variacaoAtiva;
  }

  saveProduto(): void {
    this.isSaving = true;
    const isEditing = !!this.editingId;
    const message = isEditing
      ? `Produto "${this.formData.nome}" atualizado com sucesso!`
      : `"${this.formData.nome}" cadastrado com sucesso!`;

    const handleSuccess = () => {
      this.isSaving = false;
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving = false;
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar produto');
    };

    if (isEditing && this.editingId) {
      this.firebaseService.updateDocument$('produtos', this.editingId, this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.firebaseService.addDocument$('produtos', this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }

  openDeleteModal(produto: Produto & { id: string }): void {
    this.deleteId = produto.id;
    this.deleteName = produto.nome;
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
      this.firebaseService.deleteDocument$('produtos', this.deleteId).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.showSuccess('Registro excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir produto');
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
}
