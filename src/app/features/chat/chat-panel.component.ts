import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService } from '../../services/ai-chat.service';

@Component({
	selector: 'app-chat-panel',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './chat-panel.component.html',
	styleUrls: ['./chat-panel.component.css']
})
	export class ChatPanelComponent {
		draft='';
		constructor(public svc: AiChatService){}
		send(){ const t=this.draft.trim(); if(!t) return; this.svc.send(t); this.draft=''; }
	}
