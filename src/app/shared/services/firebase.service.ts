import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { 
  BehaviorSubject, 
  Observable, 
  from, 
  of,
  throwError,
  switchMap,
  map,
  catchError,
  filter,
  take,
  shareReplay
} from 'rxjs';

const firebaseConfig = {
  apiKey: "AIzaSyD7lf9vlH-nL-m-8mUgD08SCbPqLTthftQ",
  authDomain: "flowchat-1a9ea.firebaseapp.com",
  projectId: "flowchat-1a9ea",
  storageBucket: "flowchat-1a9ea.firebasestorage.app",
  messagingSenderId: "640169787612",
  appId: "1:640169787612:web:fc1ad829473a61fd043419"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  private auth = getAuth(this.app);
  private db = getFirestore(this.app);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private authInitializedSubject = new BehaviorSubject<boolean>(false);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public authInitialized$ = this.authInitializedSubject.asObservable();
  
  private currentUserUid: string | null = null;

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSubject.next(user);
      this.currentUserUid = user?.uid || null;
      if (!this.authInitializedSubject.value) {
        this.authInitializedSubject.next(true);
      }
    });
  }

  private waitForAuth$(): Observable<string> {
    return this.authInitialized$.pipe(
      filter(initialized => initialized),
      take(1),
      switchMap(() => {
        if (!this.currentUserUid) {
          return throwError(() => new Error('User not authenticated'));
        }
        return of(this.currentUserUid);
      })
    );
  }

  get userId(): string | null {
    return this.currentUserUid;
  }

  get userId$(): Observable<string | null> {
    return this.currentUser$.pipe(
      map(user => user?.uid || null)
    );
  }

  login(email: string, password: string): Observable<void> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map(() => void 0),
      catchError(error => throwError(() => error))
    );
  }

  register(email: string, password: string): Observable<void> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      map(() => void 0),
      catchError(error => throwError(() => error))
    );
  }

  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      catchError(error => throwError(() => error))
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      catchError(error => throwError(() => error))
    );
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => user !== null)
    );
  }

  private getTenantCollection$(collectionName: string): Observable<CollectionReference<DocumentData>> {
    return this.waitForAuth$().pipe(
      map(uid => collection(this.db, 'usuarios', uid, collectionName))
    );
  }

  getCollection$<T>(collectionName: string): Observable<(T & { id: string })[]> {
    return this.getTenantCollection$(collectionName).pipe(
      switchMap(tenantCollection => {
        return new Observable<(T & { id: string })[]>(observer => {
          const unsubscribe = onSnapshot(
            tenantCollection,
            (snapshot) => {
              const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as (T & { id: string })[];
              observer.next(data);
            },
            (error) => {
              observer.error(error);
            }
          );
          return () => unsubscribe();
        });
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  addDocument$<T extends object>(collectionName: string, data: T): Observable<string> {
    return this.getTenantCollection$(collectionName).pipe(
      switchMap(tenantCollection => {
        return from(addDoc(tenantCollection, {
          ...data,
          criadoEm: serverTimestamp(),
          userId: this.currentUserUid
        }));
      }),
      map(docRef => docRef.id),
      catchError(error => throwError(() => error))
    );
  }

  updateDocument$<T extends object>(collectionName: string, docId: string, data: T): Observable<void> {
    return this.getTenantCollection$(collectionName).pipe(
      switchMap(tenantCollection => {
        const docRef = doc(tenantCollection, docId);
        return from(updateDoc(docRef, {
          ...data,
          userId: this.currentUserUid
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  deleteDocument$(collectionName: string, docId: string): Observable<void> {
    return this.getTenantCollection$(collectionName).pipe(
      switchMap(tenantCollection => {
        const docRef = doc(tenantCollection, docId);
        return from(deleteDoc(docRef));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getDocument$<T>(collectionName: string, docId: string): Observable<T | null> {
    return this.getTenantCollection$(collectionName).pipe(
      switchMap(tenantCollection => {
        const docRef = doc(tenantCollection, docId);
        return from(getDoc(docRef));
      }),
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as T;
        }
        return null;
      }),
      catchError(error => throwError(() => error))
    );
  }
}
