import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
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

  // Signals para estado reativo
  readonly orcamentos = signal<(Orcamento & { id: string })[]>([]);
  readonly clientes = signal<(Cliente & { id: string })[]>([]);
  readonly isModalOpen = signal(false);
  readonly isDeleteModalOpen = signal(false);
  readonly isSuccessModalOpen = signal(false);
  readonly successMessage = signal('');
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingOrcamento = signal<(Orcamento & { id: string }) | null>(null);
  readonly deleteId = signal<string | null>(null);
  readonly deleteName = signal('');

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Carregar orçamentos
    this.firebaseService.getCollection$<Orcamento>('orcamentos')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orcamentos) => {
          this.orcamentos.set(orcamentos);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erro ao carregar orçamentos:', error);
          this.isLoading.set(false);
        }
      });

    // Carregar clientes para exibição
    this.firebaseService.getCollection$<Cliente>('clientes')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (clientes) => {
          this.clientes.set(clientes);
        },
        error: (error) => {
          console.error('Erro ao carregar clientes:', error);
        }
      });
  }

  getClienteNome(clienteId: string): string {
    const cliente = this.clientes().find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  }

  openModal(orcamento?: Orcamento & { id: string }): void {
    this.editingOrcamento.set(orcamento || null);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingOrcamento.set(null);
  }

  onOrcamentoSaved(): void {
    this.showSuccess(
      this.editingOrcamento()
        ? 'Orçamento atualizado com sucesso!'
        : 'Orçamento criado com sucesso!'
    );
  }

  openDeleteModal(orcamento: Orcamento & { id: string }): void {
    this.deleteId.set(orcamento.id);
    const cliente = this.clientes().find(c => c.id === orcamento.clienteId);
    this.deleteName.set(cliente?.nome || 'Cliente desconhecido');
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
      this.firebaseService.deleteDocument$('orcamentos', currentDeleteId).pipe(
        finalize(() => this.isSaving.set(false))
      ).subscribe({
        next: () => {
          this.closeDeleteModal();
          this.showSuccess('Orçamento excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          alert('Erro ao excluir orçamento');
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
