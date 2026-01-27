import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  async login(): Promise<void> {
    this.erro = '';
    this.loading = true;
    
    try {
      await this.firebaseService.login(this.email, this.senha);
      this.router.navigate(['/admin']);
    } catch (e) {
      this.erro = 'Email ou senha inválidos';
    } finally {
      this.loading = false;
    }
  }

  async cadastrar(): Promise<void> {
    this.erro = '';
    this.loading = true;

    if (this.senha.length < 6) {
      this.erro = 'A senha precisa ter no mínimo 6 caracteres';
      this.loading = false;
      return;
    }

    try {
      await this.firebaseService.register(this.email, this.senha);
      this.router.navigate(['/admin']);
    } catch (e) {
      this.erro = 'Erro ao criar conta. Email já existe?';
    } finally {
      this.loading = false;
    }
  }

  async recuperarSenha(): Promise<void> {
    this.erro = '';
    this.sucesso = '';
    this.loading = true;

    try {
      await this.firebaseService.resetPassword(this.email);
      this.sucesso = 'Email de recuperação enviado!';
    } catch (e) {
      this.erro = 'Erro ao enviar email';
    } finally {
      this.loading = false;
    }
  }
}
