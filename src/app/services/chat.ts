import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessage, ChatSession } from '../models/chat.model';
import { AiFoundry } from './ai-foundry';

@Injectable({
  providedIn: 'root'
})
export class Chat {
  private currentSession: ChatSession = {
    id: this.generateId(),
    messages: [],
    title: 'New Chat',
    createdAt: new Date()
  };

  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private aiFoundry: AiFoundry) { }

  /**
   * Send a message and get AI response
   * @param content - The user's message content
   */
  async sendMessage(content: string): Promise<void> {
    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    this.currentSession.messages.push(userMessage);
    this.messagesSubject.next([...this.currentSession.messages]);
    this.isLoadingSubject.next(true);

    try {
      // Get AI response
      const aiResponse = await this.aiFoundry.sendMessage(content).toPromise();
      if (aiResponse) {
        this.currentSession.messages.push(aiResponse);
        this.messagesSubject.next([...this.currentSession.messages]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      this.currentSession.messages.push(errorMessage);
      this.messagesSubject.next([...this.currentSession.messages]);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  /**
   * Clear the current chat session
   */
  clearChat(): void {
    this.currentSession = {
      id: this.generateId(),
      messages: [],
      title: 'New Chat',
      createdAt: new Date()
    };
    this.messagesSubject.next([]);
  }

  /**
   * Get the current chat session
   */
  getCurrentSession(): ChatSession {
    return { ...this.currentSession };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
