import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { Categoria } from '../../core/models/interfaces';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent, LoadingComponent],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  // Signals para estado reativo
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

  formData: Categoria = {
    nome: '',
    descricao: ''
  };

  ngOnInit(): void {
    this.loadCategorias();
  }

  private loadCategorias(): void {
    this.firebaseService.getCollection$<Categoria>('categorias').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.isLoading.set(false);
      }
    });
  }

  openModal(categoria?: Categoria & { id: string }): void {
    if (categoria) {
      this.editingId.set(categoria.id);
      this.formData = { ...categoria };
    } else {
      this.editingId.set(null);
      this.formData = { nome: '', descricao: '' };
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingId.set(null);
    this.formData = { nome: '', descricao: '' };
  }

  saveCategoria(): void {
    this.isSaving.set(true);
    const isEditing = !!this.editingId();
    const message = isEditing
      ? `Categoria "${this.formData.nome}" atualizada com sucesso!`
      : `"${this.formData.nome}" cadastrada com sucesso!`;

    const handleSuccess = () => {
      this.isSaving.set(false);
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving.set(false);
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar categoria');
    };

    const currentEditingId = this.editingId();
    if (isEditing && currentEditingId) {
      this.firebaseService.updateDocument$('categorias', currentEditingId, this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.firebaseService.addDocument$('categorias', this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }

  openDeleteModal(categoria: Categoria & { id: string }): void {
    this.deleteId.set(categoria.id);
    this.deleteName.set(categoria.nome);
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
      this.firebaseService.deleteDocument$('categorias', currentDeleteId).pipe(
        finalize(() => this.isSaving.set(false))
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.showSuccess('Registro excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir categoria');
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
