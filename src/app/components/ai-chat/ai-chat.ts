import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';

import { Chat } from '../../services/chat';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-ai-chat',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.css'
})
export class AiChat implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  newMessage = '';
  isLoading = false;
  
  private subscriptions: Subscription[] = [];

  constructor(private chatService: Chat) {}

  ngOnInit(): void {
    // Subscribe to chat messages
    this.subscriptions.push(
      this.chatService.messages$.subscribe(messages => {
        this.messages = messages;
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.chatService.isLoading$.subscribe(loading => {
        this.isLoading = loading;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || this.isLoading) {
      return;
    }

    const message = this.newMessage.trim();
    this.newMessage = '';
    
    await this.chatService.sendMessage(message);
  }

  clearChat(): void {
    this.chatService.clearChat();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
