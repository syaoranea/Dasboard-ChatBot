import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../shared/services/firebase.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { Categoria } from '../../core/models/interfaces';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss'
})
export class CategoriasComponent implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private unsubscribe: (() => void) | null = null;

  categorias: (Categoria & { id: string })[] = [];
  
  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';
  
  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';

  formData: Categoria = {
    nome: '',
    descricao: ''
  };

  ngOnInit(): void {
    this.unsubscribe = this.firebaseService.subscribeToCollection<Categoria>('categorias', (data) => {
      this.categorias = data;
    });
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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

  async saveCategoria(): Promise<void> {
    try {
      if (this.editingId) {
        await this.firebaseService.updateDocument('categorias', this.editingId, this.formData);
        this.showSuccess(`Categoria "${this.formData.nome}" atualizada com sucesso!`);
      } else {
        await this.firebaseService.addDocument('categorias', this.formData);
        this.showSuccess(`"${this.formData.nome}" cadastrada com sucesso!`);
      }
      this.closeModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar categoria');
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

  async confirmDelete(): Promise<void> {
    if (this.deleteId) {
      try {
        await this.firebaseService.deleteDocument('categorias', this.deleteId);
        this.closeDeleteModal();
        this.showSuccess('Registro excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir categoria');
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
