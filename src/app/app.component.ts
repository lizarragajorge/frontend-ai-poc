import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterModule],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	constructor(private router: Router) {}
	goHome(){ if(this.router.url !== '/') { this.router.navigate(['/']); } }
}
