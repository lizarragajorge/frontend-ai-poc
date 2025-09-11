import { Injectable } from '@angular/core';

export interface AccessRequest {
  productId: string;
  requesterEmail: string;
  justification: string;
  created?: Date;
}

@Injectable({ providedIn: 'root' })
export class AccessRequestService {
  private store: AccessRequest[] = [];
  submit(req: Omit<AccessRequest,'created'>){
    this.store.push({ ...req, created:new Date() });
  }
  all(){ return [...this.store]; }
}