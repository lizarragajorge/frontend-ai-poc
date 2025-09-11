import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../services/ai-chat.service';

@Component({
	selector: 'app-chat-panel',
	standalone: true,
		imports: [CommonModule, FormsModule],
		template: `
			<div class="chat-shell card">
				<h3>Chat</h3>
				<div class="messages" *ngIf="svc.messages().length; else empty">
					<div class="msg" [class.user]="m.role==='user'" [class.ai]="m.role==='ai'" *ngFor="let m of svc.messages()">{{m.text}}</div>
				</div>
				<ng-template #empty><p class="text-xs empty">No messages yet.</p></ng-template>
				<form class="composer" (ngSubmit)="send()">
					<textarea [(ngModel)]="draft" name="draft" placeholder="Ask a question"></textarea>
					<button class="btn" type="submit" [disabled]="svc.sending()">Send</button>
				</form>
			</div>
		`,
		styles:[`
			.chat-shell { display:flex; flex-direction:column; gap:.75rem; }
			.messages { display:flex; flex-direction:column; gap:.4rem; max-height:300px; overflow:auto; }
			.msg { background:#f0f2f5; padding:.45rem .6rem; border-radius:8px; font-size:.7rem; }
			.msg.user { background:#d93030; color:#fff; align-self:flex-end; }
			.composer { display:flex; flex-direction:column; gap:.5rem; }
			textarea { resize:vertical; min-height:70px; padding:.55rem .6rem; font:inherit; border:1px solid #d0d7de; border-radius:6px; }
			.btn { align-self:flex-end; background:#d93030; color:#fff; border:none; padding:.5rem .9rem; border-radius:6px; font-size:.7rem; font-weight:600; cursor:pointer; }
			.btn[disabled]{ opacity:.5; cursor:not-allowed; }
			.empty { color:#666; }
		`]
})
	export class ChatPanelComponent {
		draft='';
		constructor(public svc: AiChatService){}
		send(){ const t=this.draft.trim(); if(!t) return; this.svc.send(t); this.draft=''; }
	}
