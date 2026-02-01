import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from '../../shared/services/firebase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  canActivate(): boolean {
    // Wait for auth to be initialized
    if (!this.firebaseService.authInitialized()) {
      // If not initialized yet, we could redirect or wait
      // For simplicity, check if user exists
      return this.checkAuth();
    }
    return this.checkAuth();
  }

  private checkAuth(): boolean {
    if (this.firebaseService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
