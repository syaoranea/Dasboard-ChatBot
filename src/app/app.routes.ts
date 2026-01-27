import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./admin/usuarios/usuarios.component').then(m => m.UsuariosComponent)
      },
      {
        path: 'produtos',
        loadComponent: () => import('./admin/produtos/produtos.component').then(m => m.ProdutosComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./admin/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'orcamentos',
        loadComponent: () => import('./admin/orcamentos/orcamentos.component').then(m => m.OrcamentosComponent)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./admin/categorias/categorias.component').then(m => m.CategoriasComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
