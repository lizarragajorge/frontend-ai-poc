export interface DataProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  owner: string;
  accessLevel: 'public' | 'restricted' | 'private';
  lastUpdated: Date;
  source: 'ai-foundry' | 'azure-fabric';
}

export interface AccessRequest {
  id: string;
  productId: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Date;
  reason?: string;
}