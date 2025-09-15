import { Injectable, signal } from '@angular/core';

export type FeatureFlag = 'models' | 'agents' | 'dashboards' | 'aiChat';

@Injectable({ providedIn:'root' })
export class FeatureFlagsService {
  private flags = signal<Record<string, boolean>>({ models:true, agents:false, dashboards:false, aiChat:true });
  isEnabled(flag: FeatureFlag){ return !!this.flags()[flag]; }
  setFlag(flag: FeatureFlag, value: boolean){ this.flags.update(f => ({ ...f, [flag]: value })); }
  all(){ return this.flags(); }
}
