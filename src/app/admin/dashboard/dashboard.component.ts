import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../shared/services/firebase.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private unsubscribes: (() => void)[] = [];

  isLoading = false;

  counts = {
    usuarios: 0,
    produtos: 0,
    clientes: 0,
    orcamentos: 0,
    categorias: 0
  };

  cards = [
    { id: 'usuarios', label: 'Usuários', icon: 'fa-users', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { id: 'produtos', label: 'Produtos', icon: 'fa-box', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { id: 'clientes', label: 'Clientes', icon: 'fa-user-tie', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'fa-calculator', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
    { id: 'categorias', label: 'Categorias', icon: 'fa-tags', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' }
  ];

  ngOnInit(): void {
    this.subscribeToCollections();
  }

  ngOnDestroy(): void {
    this.unsubscribes.forEach(unsub => unsub());
  }

  private async subscribeToCollections(): Promise<void> {
  this.isLoading = true;

  const collections = ['usuarios', 'produtos', 'clientes', 'orcamentos', 'categorias'] as const;
  let loadedCollections = 0;

  try {
    for (const collectionName of collections) {
      const unsub = await this.firebaseService.subscribeToCollection(
        collectionName,
        (data) => {
          this.counts[collectionName] = data.length;

          loadedCollections++;

          if (loadedCollections === collections.length) {
            this.isLoading = false;
          }
        }
      );

      this.unsubscribes.push(unsub);
    }
  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
    this.isLoading = false;
  }
}


  getCount(id: string): number {
    return this.counts[id as keyof typeof this.counts] || 0;
  }
}
