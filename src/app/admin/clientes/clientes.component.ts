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
import { Cliente } from '../../core/models/interfaces';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ConfirmModalComponent, SuccessModalComponent, LoadingComponent],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  clientes: (Cliente & { id: string })[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = true;
  isSaving = false;

  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';

  estados = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];

  formData: Cliente = {
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    rua: '',
    cep: '',
    cidade: '',
    estado: ''
  };


  constructor(
    private readonly cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadClientes();
  }

  private loadClientes(): void {
    this.firebaseService.getCollection$<Cliente>('clientes').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.clientes = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(cliente?: Cliente & { id: string }): void {
    if (cliente) {
      this.editingId = cliente.id;
      this.formData = { ...cliente };
    } else {
      this.editingId = null;
      this.formData = { nome: '', documento: '', telefone: '', email: '', rua: '', cep: '', cidade: '', estado: '' };
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.formData = { nome: '', documento: '', telefone: '', email: '', rua: '', cep: '', cidade: '', estado: '' };
  }

  saveCliente(): void {
    this.isSaving = true;
    const isEditing = !!this.editingId;
    const message = isEditing
      ? `Cliente "${this.formData.nome}" atualizado com sucesso!`
      : `"${this.formData.nome}" cadastrado com sucesso!`;

    const handleSuccess = () => {
      this.isSaving = false;
      this.showSuccess(message);
      this.closeModal();
    };

    const handleError = (error: Error) => {
      this.isSaving = false;
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar cliente');
    };

    if (isEditing && this.editingId) {
      this.firebaseService.updateDocument$('clientes', this.editingId, this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.firebaseService.addDocument$('clientes', this.formData).subscribe({
        next: handleSuccess,
        error: handleError
      });
    }
  }

  openDeleteModal(cliente: Cliente & { id: string }): void {
    this.deleteId = cliente.id;
    this.deleteName = cliente.nome;
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
      this.firebaseService.deleteDocument$('clientes', this.deleteId).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.showSuccess('Registro excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir cliente');
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
