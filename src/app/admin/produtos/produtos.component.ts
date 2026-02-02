import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
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

  // Signals para estado reativo
  readonly produtos = signal<(Produto & { id: string })[]>([]);
  readonly categorias = signal<(Categoria & { id: string })[]>([]);
  readonly isModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSuccessModalOpen = signal(false);
  readonly successMessage = signal('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly deleteId = signal<string | null>(null);
  readonly deleteName = signal('');
  readonly variacaoAtiva = signal(false);

  formData: Produto = {
    nome: '',
    categoriaId: '',
    preco: 0,
    estoque: 0,
    ativo: true
  };

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
        this.produtos.set(data.produtos);
        this.categorias.set(data.categorias);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar dados:', error);
        this.isLoading.set(false);
      }
    });
  }

  getCategoriaNome(categoriaId: string): string {
    const categoria = this.categorias().find(c => c.id === categoriaId);
    return categoria ? categoria.nome : '-';
  }

  openModal(produto?: Produto & { id: string }): void {
    this.variacaoAtiva.set(false);
    if (produto) {
      this.editingId.set(produto.id);
      this.formData = { ...produto };
      if (produto.tipoVariacao) {
        this.variacaoAtiva.set(true);
      }
    } else {
      this.editingId.set(null);
      this.formData = { nome: '', categoriaId: '', preco: 0, estoque: 0, ativo: true };
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingId.set(null);
    this.variacaoAtiva.set(false);
    this.formData = { nome: '', categoriaId: '', preco: 0, estoque: 0, ativo: true };
  }

  toggleVariacao(): void {
    this.variacaoAtiva.update(v => !v);
  }

  saveProduto(): void {
    this.isSaving.set(true);
    const isEditing = !!this.editingId();
    const message = isEditing
      ? `Produto "${this.formData.nome}" atualizado com sucesso!`
      : `"${this.formData.nome}" cadastrado com sucesso!`;

    const handleSuccess = () => {
      this.isSaving.set(false);
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving.set(false);
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar produto');
    };

    const currentEditingId = this.editingId();
    if (isEditing && currentEditingId) {
      this.firebaseService.updateDocument$('produtos', currentEditingId, this.formData).subscribe({
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
    this.deleteId.set(produto.id);
    this.deleteName.set(produto.nome);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deleteId.set(null);
    this.deleteName.set('');
  }

  confirmDelete(): void {
    const currentDeleteId = this.deleteId();
    if (currentDeleteId) {
      this.isSaving.set(true);
      this.firebaseService.deleteDocument$('produtos', currentDeleteId).pipe(
        finalize(() => this.isSaving.set(false))
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
    this.successMessage.set(message);
    this.isSuccessModalOpen.set(true);
  }

  closeSuccessModal(): void {
    this.isSuccessModalOpen.set(false);
    this.successMessage.set('');
  }
}
