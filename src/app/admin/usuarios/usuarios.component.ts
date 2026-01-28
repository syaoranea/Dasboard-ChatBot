import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class UsuariosComponent implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private unsubscribe: (() => void) | null = null;

  usuarios: (Usuario & { id: string })[] = [];
  
  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';
  
  isLoading = false;
  isSaving = false;
  
  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';

  formData: Usuario = {
    nome: '',
    email: '',
    nivel: 'operador'
  };

  async ngOnInit(): Promise<void> {
    try {
      this.isLoading = true;
      this.unsubscribe = await this.firebaseService.subscribeToCollection<Usuario>('usuarios', (data) => {
        this.usuarios = data;
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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

  async saveUsuario(): Promise<void> {
    try {
      this.isSaving = true;
      if (this.editingId) {
        await this.firebaseService.updateDocument('usuarios', this.editingId, this.formData);
        this.showSuccess(`Usuário "${this.formData.nome}" atualizado com sucesso!`);
      } else {
        await this.firebaseService.addDocument('usuarios', this.formData);
        this.showSuccess(`"${this.formData.nome}" cadastrado com sucesso!`);
      }
      this.closeModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar usuário');
    } finally {
      this.isSaving = false;
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

  async confirmDelete(): Promise<void> {
    if (this.deleteId) {
      try {
        this.isSaving = true;
        await this.firebaseService.deleteDocument('usuarios', this.deleteId);
        this.closeDeleteModal();
        this.showSuccess('Registro excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir usuário');
      } finally {
        this.isSaving = false;
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
}
