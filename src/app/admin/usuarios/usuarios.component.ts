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
import { Usuario } from '../../core/models/interfaces';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent, LoadingComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  usuarios: (Usuario & { id: string })[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = true;
  isSaving = false;

  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';

  formData: Usuario = {
    nome: '',
    email: '',
    nivel: 'operador'
  };


  constructor(
    private readonly cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    this.firebaseService.getCollection$<Usuario>('usuarios').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(usuario?: Usuario & { id: string }): void {
    if (usuario) {
      this.editingId = usuario.id;
      this.formData = { ...usuario };
    } else {
      this.editingId = null;
      this.formData = { nome: '', email: '', nivel: 'operador' };
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.formData = { nome: '', email: '', nivel: 'operador' };
  }

  saveUsuario(): void {
    this.isSaving = true;
    const isEditing = !!this.editingId;
    const message = isEditing
      ? `Usuário "${this.formData.nome}" atualizado com sucesso!`
      : `"${this.formData.nome}" cadastrado com sucesso!`;

    const handleSuccess = () => {
      this.isSaving = false;
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving = false;
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar usuário');
    };

    if (isEditing && this.editingId) {
      this.firebaseService.updateDocument$('usuarios', this.editingId, this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.firebaseService.addDocument$('usuarios', this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }

  openDeleteModal(usuario: Usuario & { id: string }): void {
    this.deleteId = usuario.id;
    this.deleteName = usuario.nome;
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
      this.firebaseService.deleteDocument$('usuarios', this.deleteId).pipe(
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
          alert('Erro ao excluir usuário');
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
