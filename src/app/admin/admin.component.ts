import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FirebaseService } from '../shared/services/firebase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  currentTab = 'dashboard';
  mobileMenuOpen = false;

  navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', route: '/admin/dashboard' },
    { id: 'usuarios', label: 'Usuários', icon: 'fa-users', route: '/admin/usuarios' },
    { id: 'produtos', label: 'Produtos', icon: 'fa-box', route: '/admin/produtos' },
    { id: 'clientes', label: 'Clientes', icon: 'fa-user-tie', route: '/admin/clientes' },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'fa-calculator', route: '/admin/orcamentos' },
    { id: 'categorias', label: 'Categorias', icon: 'fa-tags', route: '/admin/categorias' }
  ];

  switchTab(tabId: string): void {
    this.currentTab = tabId;
    this.mobileMenuOpen = false;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  async logout(): Promise<void> {
    try {
      await this.firebaseService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      this.router.navigate(['/login']);
    }
  }
}
