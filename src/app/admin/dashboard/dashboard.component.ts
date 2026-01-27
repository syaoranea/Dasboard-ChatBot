import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../shared/services/firebase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private firebaseService = inject(FirebaseService);
  private unsubscribes: (() => void)[] = [];

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

  private subscribeToCollections(): void {
    const collections = ['usuarios', 'produtos', 'clientes', 'orcamentos', 'categorias'] as const;
    
    collections.forEach(collectionName => {
      const unsub = this.firebaseService.subscribeToCollection(collectionName, (data) => {
        this.counts[collectionName] = data.length;
      });
      this.unsubscribes.push(unsub);
    });
  }

  getCount(id: string): number {
    return this.counts[id as keyof typeof this.counts] || 0;
  }
}
