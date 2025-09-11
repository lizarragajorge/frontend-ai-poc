import { Injectable, signal } from '@angular/core';

export interface ChatMessage { role: 'user' | 'ai'; text: string; }

@Injectable({ providedIn: 'root' })
export class AiChatService {
  messages = signal<ChatMessage[]>([]);
  sending = signal(false);
  send(text: string){
    if(!text.trim()) return;
    this.messages.update(m => [...m, { role:'user', text }]);
    this.sending.set(true);
    // Simulate AI echo
    setTimeout(()=>{
      this.messages.update(m => [...m, { role:'ai', text: 'Echo: '+text }]);
      this.sending.set(false);
    }, 400);
  }
  reset(){ this.messages.set([]); }
}