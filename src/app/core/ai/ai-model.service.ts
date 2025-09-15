import { InjectionToken } from '@angular/core';

export interface GenerateOptions { temperature?: number; maxTokens?: number; }
export interface AiModelService {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  listModels(): Promise<string[]>;
}

export const AI_MODEL_SERVICE = new InjectionToken<AiModelService>('AI_MODEL_SERVICE');
