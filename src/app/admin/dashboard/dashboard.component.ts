import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, catchError, of } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private firebaseService = inject(FirebaseService);
  private destroyRef = inject(DestroyRef);

  // Signals para estado reativo
  readonly isLoading = signal(true);
  readonly counts = signal({
    usuarios: 0,
    produtos: 0,
    clientes: 0,
    orcamentos: 0,
    categorias: 0
  });

  cards = [
    { id: 'usuarios', label: 'Usuários', icon: 'fa-users', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    { id: 'produtos', label: 'Produtos', icon: 'fa-box', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    { id: 'clientes', label: 'Clientes', icon: 'fa-user-tie', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'fa-calculator', bgColor: 'bg-amber-100', textColor: 'text-amber-600' },
    { id: 'categorias', label: 'Categorias', icon: 'fa-tags', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' }
  ];

  ngOnInit(): void {
    this.loadCollections();
  }

  private loadCollections(): void {
    combineLatest({
      usuarios: this.firebaseService.getCollection$<unknown>('usuarios').pipe(catchError(() => of([]))),
      produtos: this.firebaseService.getCollection$<unknown>('produtos').pipe(catchError(() => of([]))),
      clientes: this.firebaseService.getCollection$<unknown>('clientes').pipe(catchError(() => of([]))),
      orcamentos: this.firebaseService.getCollection$<unknown>('orcamentos').pipe(catchError(() => of([]))),
      categorias: this.firebaseService.getCollection$<unknown>('categorias').pipe(catchError(() => of([])))
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.counts.set({
          usuarios: data.usuarios.length,
          produtos: data.produtos.length,
          clientes: data.clientes.length,
          orcamentos: data.orcamentos.length,
          categorias: data.categorias.length
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.isLoading.set(false);
      }
    });
  }

  getCount(id: string): number {
    return this.counts()[id as keyof ReturnType<typeof this.counts>] || 0;
  }
}
