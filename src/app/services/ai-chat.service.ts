import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface ChatMessage { role: 'user' | 'ai'; text: string; }

@Injectable({ providedIn: 'root' })
export class AiChatService {
  messages = signal<ChatMessage[]>([]);
  sending = signal(false);
  constructor(private http: HttpClient) {}
  send(text: string){
    if(!text.trim()) return;
    this.messages.update(m => [...m, { role:'user', text }]);
    this.sending.set(true);
    const payload = { messages: [{ role: 'user', content: text }] };
  this.http.post<any>(`${environment.apiBaseUrl}/fabric/chat-sdk`, payload)
      .subscribe({
        next: (res) => {
          const aiText = this.extractText(res);
          this.messages.update(m => [...m, { role:'ai', text: aiText }]);
          this.sending.set(false);
        },
        error: (err) => {
          const backend = err?.error;
          const detail = typeof backend === 'string'
            ? backend
            : (backend?.error || backend?.message || err?.message || 'fabric call failed');
          this.messages.update(m => [...m, { role:'ai', text: `Error: ${detail}` }]);
          this.sending.set(false);
        }
      });
  }
  reset(){ this.messages.set([]); }

  private extractText(res: any): string {
    // Error passthrough
    if (res?.success === false && res?.error) return `Error: ${res.error}`;
    const d = res?.data ?? res;

    // OpenAI-style chat completions
    const choice = d?.choices?.[0];
    let choiceText = choice?.message?.content || choice?.text;
    if (typeof choiceText === 'string' && choiceText.trim()) return choiceText;
    if (Array.isArray(choice?.message?.content)) {
      const parts = choice.message.content
        .map((p: any) => (typeof p?.text === 'string' ? p.text : (typeof p === 'string' ? p : '')))
        .filter((s: string) => !!s?.trim());
      if (parts.length) return parts.join('\n');
    }

    // Messages array: find last assistant content
    const msgs = d?.messages;
    if (Array.isArray(msgs) && msgs.length) {
      for (let i = msgs.length - 1; i >= 0; i--) {
        const m = msgs[i];
        if (m?.role === 'assistant' || m?.role === 'ai' || i === msgs.length - 1) {
          if (typeof m?.content === 'string' && m.content.trim()) return m.content;
          // content parts e.g., [{type:'text', text:'...'}]
          if (Array.isArray(m?.content)) {
            const parts = m.content
              .map((p: any) => (typeof p?.text === 'string' ? p.text : (typeof p === 'string' ? p : '')))
              .filter((s: string) => !!s?.trim());
            if (parts.length) return parts.join('\n');
          }
        }
      }
    }

    // Generic fields
    const direct = d?.output?.message || d?.output?.content || d?.message || d?.reply || d?.content || d?.output_text;
    if (typeof direct === 'string' && direct.trim()) return direct;

    if (typeof d === 'string' && d.trim()) return d;
    if (res?.raw && typeof res.raw === 'string') return res.raw;

    // Fallback: compact JSON preview
    try {
      const text = JSON.stringify(d ?? res);
      return text.length > 2000 ? text.slice(0, 2000) + '…' : text;
    } catch {
      return 'AI responded.';
    }
  }
}