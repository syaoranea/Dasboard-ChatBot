import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from '../../shared/services/firebase.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.firebaseService.currentUser$.pipe(
      take(1),
      map(user => {
        if (user) {
          return true;
        }
        this.router.navigate(['/login']);
        return false;
      })
    );
  }
}
