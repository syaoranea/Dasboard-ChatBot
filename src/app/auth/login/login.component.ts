import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FirebaseService } from '../../shared/services/firebase.service';

type ViewMode = 'login' | 'cadastro' | 'recuperar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  viewMode: ViewMode = 'login';
  email = '';
  senha = '';
  erro = '';
  sucesso = '';
  loading = false;

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.erro = '';
    this.sucesso = '';
    this.email = '';
    this.senha = '';
  }

  login(): void {
    this.erro = '';
    this.loading = true;
    
    this.firebaseService.login(this.email, this.senha).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.erro = 'Email ou senha inválidos';
      }
    });
  }

  cadastrar(): void {
    this.erro = '';
    this.loading = true;

    if (this.senha.length < 6) {
      this.erro = 'A senha precisa ter no mínimo 6 caracteres';
      this.loading = false;
      return;
    }

    this.firebaseService.register(this.email, this.senha).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: () => {
        this.erro = 'Erro ao criar conta. Email já existe?';
      }
    });
  }

  recuperarSenha(): void {
    this.erro = '';
    this.sucesso = '';
    this.loading = true;

    this.firebaseService.resetPassword(this.email).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: () => {
        this.sucesso = 'Email de recuperação enviado!';
      },
      error: () => {
        this.erro = 'Erro ao enviar email';
      }
    });
  }
}
