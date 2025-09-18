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
	private _agentId: string | null = null;
	private _threadId: string | null = null;

	messages = computed(() => this._messages());
	sending = computed(() => this._sending());

	constructor(private http: HttpClient) {}

	reset(){
		this._messages.set([]);
		this._agentId = null;
		this._threadId = null;
	}

	private async ensureSession(): Promise<void> {
		if (this._agentId && this._threadId) return;
		const url = `${environment.apiBaseUrl}/ai/agent/start`;
		// No body needed: backend uses AZURE_AI_AGENT_ID or creates a new agent
		const resp = await firstValueFrom(this.http.post<{ agentId: string, threadId: string }>(url, {}));
		this._agentId = resp.agentId;
		this._threadId = resp.threadId;
	}

	async send(text: string){
		const trimmed = text.trim();
		if(!trimmed || this._sending()) return;
		this._messages.update(list => [...list, { role: 'user', text: trimmed }]);
		this._sending.set(true);
		try {
			await this.ensureSession();
			const url = `${environment.apiBaseUrl}/ai/agent/send`;
			const payload = {
				agentId: this._agentId,
				threadId: this._threadId,
				text: trimmed
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
