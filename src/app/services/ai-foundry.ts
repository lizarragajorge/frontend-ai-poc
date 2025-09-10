import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AIFoundryConfig } from '../models/config.model';
import { ChatMessage } from '../models/chat.model';
import { DataProduct } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class AiFoundry {
  private config: AIFoundryConfig = {
    endpoint: 'https://your-ai-foundry-endpoint.com/api',
    apiKey: 'your-api-key-here',
    modelId: 'gpt-4'
  };

  constructor() { }

  /**
   * Configure the AI Foundry connection
   * @param config - AI Foundry configuration
   */
  setConfig(config: AIFoundryConfig): void {
    this.config = { ...config };
  }

  /**
   * Send a message to the AI Foundry LLM
   * @param message - The user's message
   * @returns Observable with AI response
   */
  sendMessage(message: string): Observable<ChatMessage> {
    // Placeholder implementation - replace with actual AI Foundry API call
    const response: ChatMessage = {
      id: this.generateId(),
      content: `This is a placeholder response from AI Foundry for: "${message}". In a real implementation, this would connect to your AI Foundry endpoint and return actual LLM responses about available data products.`,
      role: 'assistant',
      timestamp: new Date()
    };

    return of(response).pipe(delay(1000)); // Simulate API delay
  }

  /**
   * Get available data products from AI Foundry
   * @returns Observable with list of data products
   */
  getDataProducts(): Observable<DataProduct[]> {
    // Placeholder implementation - replace with actual AI Foundry API call
    const products: DataProduct[] = [
      {
        id: 'ai-foundry-1',
        name: 'Customer Analytics Dataset',
        description: 'Comprehensive customer behavior and analytics data from AI Foundry',
        category: 'Analytics',
        tags: ['customer', 'behavior', 'ml-ready'],
        owner: 'AI Foundry Team',
        accessLevel: 'restricted',
        lastUpdated: new Date('2024-01-15'),
        source: 'ai-foundry'
      },
      {
        id: 'ai-foundry-2',
        name: 'ML Model Registry',
        description: 'Pre-trained machine learning models for various use cases',
        category: 'Models',
        tags: ['ml', 'pretrained', 'inference'],
        owner: 'AI Foundry Team',
        accessLevel: 'public',
        lastUpdated: new Date('2024-01-20'),
        source: 'ai-foundry'
      }
    ];

    return of(products).pipe(delay(800));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
