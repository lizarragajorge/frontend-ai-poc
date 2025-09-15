import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn:'root' })
export class AuthService {
  private _authenticated = signal(false);
  authenticated = this._authenticated.asReadonly();
  login(){ /* MSAL / Entra ID hook here */ this._authenticated.set(true); }
  logout(){ this._authenticated.set(false); }
}
