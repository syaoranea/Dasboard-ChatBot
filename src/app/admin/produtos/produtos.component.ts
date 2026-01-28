import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class ProdutosComponent implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private unsubscribes: (() => void)[] = [];

  produtos: (Produto & { id: string })[] = [];
  categorias: (Categoria & { id: string })[] = [];

  isModalOpen = false;
  isDeleteModalOpen = false;
  isSuccessModalOpen = false;
  successMessage = '';

  isLoading = false;
  isSaving = false;

  editingId: string | null = null;
  deleteId: string | null = null;
  deleteName = '';
  variacaoAtiva = false;

  formData: Produto = {
    nome: '',
    categoriaId: '',
    preco: 0,
    estoque: 0,
    ativo: true
  };
  produtosLoaded = false;
categoriasLoaded = false;

  checkLoading() {
  this.isLoading = !(this.produtosLoaded && this.categoriasLoaded);
}

async ngOnInit(): Promise<void> {
  this.isLoading = true;

  const unsubProdutos = await this.firebaseService.subscribeToCollection<Produto>(
    'produtos',
    (data) => {
      this.produtos = data;
      this.produtosLoaded = true;
      this.checkLoading();
    }
  );

  const unsubCategorias = await this.firebaseService.subscribeToCollection<Categoria>(
    'categorias',
    (data) => {
      this.categorias = data;
      this.categoriasLoaded = true;
      this.checkLoading();
    }
  );

  this.unsubscribes.push(unsubProdutos, unsubCategorias);
}


  ngOnDestroy(): void {
    this.unsubscribes.forEach(unsub => unsub());
  }

  getCategoriaNome(categoriaId: string): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nome : '-';
  }

  openModal(produto?: Produto & { id: string }): void {
    this.variacaoAtiva = false;
    if (produto) {
      this.editingId = produto.id;
      this.formData = { ...produto };
      if (produto.tipoVariacao) {
        this.variacaoAtiva = true;
      }
    } else {
      this.editingId = null;
      this.formData = { nome: '', categoriaId: '', preco: 0, estoque: 0, ativo: true };
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingId = null;
    this.variacaoAtiva = false;
    this.formData = { nome: '', categoriaId: '', preco: 0, estoque: 0, ativo: true };
  }

  toggleVariacao(): void {
    this.variacaoAtiva = !this.variacaoAtiva;
  }

  async saveProduto(): Promise<void> {
    try {
      this.isSaving = true;
      if (this.editingId) {
        await this.firebaseService.updateDocument('produtos', this.editingId, this.formData);
        this.showSuccess(`Produto "${this.formData.nome}" atualizado com sucesso!`);
      } else {
        await this.firebaseService.addDocument('produtos', this.formData);
        this.showSuccess(`"${this.formData.nome}" cadastrado com sucesso!`);
      }
      this.closeModal();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar produto');
    } finally {
      this.isSaving = false;
    }
  }

  openDeleteModal(produto: Produto & { id: string }): void {
    this.deleteId = produto.id;
    this.deleteName = produto.nome;
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
        await this.firebaseService.deleteDocument('produtos', this.deleteId);
        this.closeDeleteModal();
        this.showSuccess('Registro excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir produto');
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
