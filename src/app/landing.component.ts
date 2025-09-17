import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataProductService } from './services/data-product.service';
import { AiChatService } from './services/ai-chat.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.css']
})
export class LandingComponent {
    constructor(public products: DataProductService, public ai: AiChatService) {}

    totalProducts = computed(() => this.products.filtered().length || 0);
    totalDomains = computed(() => this.products.domains().length || 0);
    totalPsls = computed(() => this.products.psls().length || 0);
    topThree = computed(() => this.products.topRated());

    prompt = signal('');
    onEnter(ev: Event){
        const kev = ev as KeyboardEvent;
        if(kev.shiftKey) return; // allow newline with Shift+Enter
        ev.preventDefault();
        this.send();
    }
    onSubmit(ev: SubmitEvent){
        ev.preventDefault();
        this.send();
    }
    send(){
        const text = this.prompt().trim();
        if(!text) return;
        this.ai.send(text);
        this.prompt.set('');
    }
}
