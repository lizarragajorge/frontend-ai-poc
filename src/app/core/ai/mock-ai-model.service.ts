import { Injectable } from '@angular/core';
import { AiModelService, GenerateOptions } from './ai-model.service';

@Injectable({ providedIn: 'root' })
export class MockAiModelService implements AiModelService {
  async generateText(prompt: string, _options?: GenerateOptions): Promise<string> {
    return Promise.resolve(`(mock) Response for: ${prompt}`);
  }
  async listModels(): Promise<string[]> { return Promise.resolve(['mock-gpt', 'mock-embedding']); }
}
