import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { OrcamentoModalComponent } from './components/orcamento-modal/orcamento-modal.component';
import { Orcamento, Cliente } from '../../core/models/interfaces';

/**
 * Componente principal de gerenciamento de orçamentos
 * Lista orçamentos e permite criar/editar/excluir usando o modal completo
 */
@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmModalComponent,
    SuccessModalComponent,
    LoadingComponent,
    OrcamentoModalComponent
  ],
  templateUrl: './orcamentos.component.html',
  styleUrl: './orcamentos.component.scss'
})
export class OrcamentosComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  orcamentos: (Orcamento & { id: string })[] = [];
  clientes: (Cliente & { id: string })[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = true;
  isSaving = false;

  editingOrcamento: (Orcamento & { id: string }) | null = null;
  deleteId: string | null = null;
  deleteName = '';

  constructor(
    private readonly cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Carregar orçamentos
    this.firebaseService.getCollection$<Orcamento>('orcamentos')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orcamentos) => {
          this.orcamentos = orcamentos;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar orçamentos:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });

    // Carregar clientes para exibição
    this.firebaseService.getCollection$<Cliente>('clientes')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clientes) => {
          this.clientes = clientes;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao carregar clientes:', error);
        }
      });
  }

  getClienteNome(clienteId: string): string {
    const cliente = this.clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  }

  openModal(orcamento?: Orcamento & { id: string }): void {
    this.editingOrcamento = orcamento || null;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingOrcamento = null;
  }

  onOrcamentoSaved(): void {
    this.showSuccess(
      this.editingOrcamento
        ? 'Orçamento atualizado com sucesso!'
        : 'Orçamento criado com sucesso!'
    );
  }

  openDeleteModal(orcamento: Orcamento & { id: string }): void {
    this.deleteId = orcamento.id;
    const cliente = this.clientes.find(c => c.id === orcamento.clienteId);
    this.deleteName = cliente?.nome || 'Cliente desconhecido';
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();

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
          this.showSuccess('Orçamento excluído com sucesso!');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir orçamento');
          this.cdr.detectChanges();
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
      case 'ENVIADO': return 'bg-blue-100 text-blue-800';
      case 'APROVADO': return 'bg-green-100 text-green-800';
      case 'REJEITADO': return 'bg-red-100 text-red-800';
      case 'CONVERTIDO': return 'bg-purple-100 text-purple-800';
      case 'RASCUNHO':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  getStatusLabel(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  formatarData(data: any): string {
    if (!data) return '-';

    // Se for um Timestamp do Firebase
    if (data.toDate) {
      return data.toDate().toLocaleDateString('pt-BR');
    }

    // Se for uma string ISO
    if (typeof data === 'string') {
      return new Date(data).toLocaleDateString('pt-BR');
    }

    return '-';
  }
}
