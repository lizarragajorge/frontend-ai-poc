import { Injectable, inject } from '@angular/core';
import { AiModelService, GenerateOptions } from './ai-model.service';
import { AppConfigService } from '../config/app-config.service';

@Injectable({ providedIn: 'root' })
export class AzureOpenAiService implements AiModelService {
  private cfg = inject(AppConfigService).load();
  async generateText(prompt: string, _options?: GenerateOptions): Promise<string> {
    // Placeholder structure to integrate with Azure OpenAI / AI Foundry
    const body = { input: prompt, deployment: this.cfg.aiDeployment };
    const res = await fetch(`${this.cfg.aiApiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if(!res.ok) return `(error ${res.status})`;
    const json: any = await res.json();
    return json?.choices?.[0]?.message?.content || '[empty response]';
  }
  async listModels(): Promise<string[]> { return ['azure-gpt', 'azure-embedding']; }
}
