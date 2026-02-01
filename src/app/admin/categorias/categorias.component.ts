import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
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

  formData: Categoria = {
    nome: '',
    descricao: ''
  };


  constructor(
    private readonly cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadCategorias();
  }

  private loadCategorias(): void {
    this.firebaseService.getCollection$<Categoria>('categorias').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(categoria?: Categoria & { id: string }): void {
    if (categoria) {
      this.editingId = categoria.id;
      this.formData = { ...categoria };
    } else {
      this.editingId = null;
      this.formData = { nome: '', descricao: '' };
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.formData = { nome: '', descricao: '' };
  }

  saveCategoria(): void {
    this.isSaving = true;
    const isEditing = !!this.editingId;
    const message = isEditing
      ? `Categoria "${this.formData.nome}" atualizada com sucesso!`
      : `"${this.formData.nome}" cadastrada com sucesso!`;

    const handleSuccess = () => {
      this.isSaving = false;
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving = false;
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar categoria');
    };

    if (isEditing && this.editingId) {
      this.firebaseService.updateDocument$('categorias', this.editingId, this.formData).subscribe({
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
    this.deleteId = categoria.id;
    this.deleteName = categoria.nome;
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
      this.firebaseService.deleteDocument$('categorias', this.deleteId).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.cdr.detectChanges();
          this.showSuccess('Registro excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          this.cdr.detectChanges();
          alert('Erro ao excluir categoria');
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
