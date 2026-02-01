import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';
import { SuccessModalComponent } from '../../shared/components/success-modal/success-modal.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { Empresa } from '../../core/models/interfaces';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessModalComponent, LoadingComponent],
  templateUrl: './empresa.component.html',
  styleUrl: './empresa.component.scss'
})
export class EmpresaComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  empresa: (Empresa & { id: string }) | null = null;
  
  isLoading = true;
  isSaving = false;
  isSuccessModalOpen = false;
  successMessage = '';

  estados = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapa' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceara' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espirito Santo' },
    { sigla: 'GO', nome: 'Goias' },
    { sigla: 'MA', nome: 'Maranhao' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Para' },
    { sigla: 'PB', nome: 'Paraiba' },
    { sigla: 'PR', nome: 'Parana' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piaui' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondonia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'Sao Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];

  formData: Empresa = {
    nome: '',
    cnpj: '',
    telefone: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  };

  ngOnInit(): void {
    this.loadEmpresa();
  }

  private loadEmpresa(): void {
    this.firebaseService.getCollection$<Empresa>('Empresas').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.empresa = data[0];
          this.formData = { ...data[0] };
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar empresa:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveEmpresa(): void {
    this.isSaving = true;
    const isEditing = !!this.empresa?.id;
    const message = isEditing
      ? 'Dados da empresa atualizados com sucesso!'
      : 'Empresa cadastrada com sucesso!';

    const handleSuccess = () => {
      this.isSaving = false;
      this.showSuccess(message);
      this.cdr.detectChanges();
    };

    const handleError = (error: Error) => {
      this.isSaving = false;
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar dados da empresa');
      this.cdr.detectChanges();
    };

    if (isEditing && this.empresa?.id) {
      this.firebaseService.updateDocument$('Empresas', this.empresa.id, this.formData).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: handleSuccess,
        error: handleError
      });
    } else {
      this.firebaseService.addDocument$('Empresas', this.formData).pipe(
        finalize(() => this.isSaving = false)
      ).subscribe({
        next: handleSuccess,
        error: handleError
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

  formatCNPJ(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 14) {
      value = value.slice(0, 14);
    }
    
    if (value.length > 12) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (value.length > 8) {
      value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, '$1.$2.$3/$4');
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{3})(\d+)$/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d+)$/, '$1.$2');
    }
    
    this.formData.cnpj = value;
  }

  formatTelefone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d+)$/, '($1) $2');
    }
    
    this.formData.telefone = value;
  }

  formatCEP(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 8) {
      value = value.slice(0, 8);
    }
    
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d+)$/, '$1-$2');
    }
    
    this.formData.cep = value;
  }
}
