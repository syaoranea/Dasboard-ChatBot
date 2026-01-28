import { Injectable, inject } from '@angular/core';
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
  Firestore,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

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
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private currentUserUid: string | null = null;
  private authInitialized = false;
  private authInitPromise: Promise<void>;

  constructor() {
    // Criar uma promise que resolve quando a autenticação é inicializada
    this.authInitPromise = new Promise<void>((resolve) => {
      onAuthStateChanged(this.auth, (user) => {
        this.currentUserSubject.next(user);
        this.currentUserUid = user?.uid || null;
        if (!this.authInitialized) {
          this.authInitialized = true;
          resolve();
        }
      });
    });
  }

  // Aguardar a inicialização da autenticação
  private async waitForAuth(): Promise<void> {
    if (!this.authInitialized) {
      await this.authInitPromise;
    }
  }

  get userId(): string | null {
    return this.currentUserUid;
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  private async getTenantCollection(collectionName: string): Promise<CollectionReference<DocumentData>> {
    await this.waitForAuth();
    if (!this.currentUserUid) {
      throw new Error('User not authenticated');
    }
    return collection(this.db, 'usuarios', this.currentUserUid, collectionName);
  }

  async subscribeToCollection<T>(collectionName: string, callback: (data: (T & { id: string })[]) => void): Promise<() => void> {
    const tenantCollection = await this.getTenantCollection(collectionName);
    return onSnapshot(tenantCollection, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (T & { id: string })[];
      callback(data);
    });
  }

  async addDocument<T extends object>(collectionName: string, data: T): Promise<string> {
    const tenantCollection = await this.getTenantCollection(collectionName);
    const docRef = await addDoc(tenantCollection, {
      ...data,
      criadoEm: serverTimestamp(),
      userId: this.currentUserUid
    });
    return docRef.id;
  }

  async updateDocument<T extends object>(collectionName: string, docId: string, data: T): Promise<void> {
    const tenantCollection = await this.getTenantCollection(collectionName);
    const docRef = doc(tenantCollection, docId);
    await updateDoc(docRef, {
      ...data,
      userId: this.currentUserUid
    });
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const tenantCollection = await this.getTenantCollection(collectionName);
    const docRef = doc(tenantCollection, docId);
    await deleteDoc(docRef);
  }

  async getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
    const tenantCollection = await this.getTenantCollection(collectionName);
    const docRef = doc(tenantCollection, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  }
}
