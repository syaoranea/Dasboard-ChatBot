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

  // Signals para estado reativo
  readonly usuarios = signal<(Usuario & { id: string })[]>([]);
  readonly isModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSuccessModalOpen = signal(false);
  readonly successMessage = signal('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly deleteId = signal<string | null>(null);
  readonly deleteName = signal('');

  formData: Usuario = {
    nome: '',
    email: '',
    nivel: 'operador'
  };

  ngOnInit(): void {
    this.loadUsuarios();
  }

  private loadUsuarios(): void {
    this.firebaseService.getCollection$<Usuario>('usuarios').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        this.isLoading.set(false);
      }
    });
  }

  openModal(usuario?: Usuario & { id: string }): void {
    if (usuario) {
      this.editingId.set(usuario.id);
      this.formData = { ...usuario };
    } else {
      this.editingId.set(null);
      this.formData = { nome: '', email: '', nivel: 'operador' };
    }
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingId.set(null);
    this.formData = { nome: '', email: '', nivel: 'operador' };
  }

  saveUsuario(): void {
    this.isSaving.set(true);
    const isEditing = !!this.editingId();
    const message = isEditing
      ? `Usuário "${this.formData.nome}" atualizado com sucesso!`
      : `"${this.formData.nome}" cadastrado com sucesso!`;

    const handleSuccess = () => {
      this.isSaving.set(false);
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving.set(false);
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar usuário');
    };

    const currentEditingId = this.editingId();
    if (isEditing && currentEditingId) {
      this.firebaseService.updateDocument$('usuarios', currentEditingId, this.formData).subscribe({
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
    this.deleteId.set(usuario.id);
    this.deleteName.set(usuario.nome);
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
      this.firebaseService.deleteDocument$('usuarios', currentDeleteId).pipe(
        finalize(() => this.isSaving.set(false))
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.showSuccess('Registro excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir usuário');
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
