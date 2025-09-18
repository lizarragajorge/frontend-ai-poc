import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

type Role = 'user' | 'ai';
interface Msg { role: Role; text: string }

@Injectable({ providedIn: 'root' })
export class AiChatService {
	private _messages = signal<Msg[]>([]);
	private _sending = signal(false);

	messages = computed(() => this._messages());
	sending = computed(() => this._sending());

	constructor(private http: HttpClient) {}

	reset(){
		this._messages.set([]);
	}

	async send(text: string){
		const trimmed = text.trim();
		if(!trimmed || this._sending()) return;
		this._messages.update(list => [...list, { role: 'user', text: trimmed }]);
		this._sending.set(true);
		try {
			const url = `${environment.apiBaseUrl}/ai/chat`;
			const payload = {
				messages: [
					{ role: 'system', content: 'You are a helpful assistant for a data marketplace.' },
					...this._messages().map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
				]
			};
			const resp = await firstValueFrom(this.http.post<{ text: string }>(url, payload));
			const aiText = resp?.text ?? '';
			this._messages.update(list => [...list, { role: 'ai', text: aiText }]);
		} catch (err: any) {
			const msg = err?.error?.error || err?.message || 'Request failed';
			this._messages.update(list => [...list, { role: 'ai', text: `Error: ${msg}` }]);
		} finally {
			this._sending.set(false);
		}
	}
}
