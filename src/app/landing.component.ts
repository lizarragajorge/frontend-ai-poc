import { Component } from '@angular/core';

@Component({
	selector: 'app-landing',
	standalone: true,
	template: `
	<div class="home-shell">
		<div class="hero hero-card">
			<div class="hero-inner">
				<h1 class="portal-title">Data Marketplace</h1>
				<p class="subtitle">Discover products • Explore models • Orchestrate agents • View BI insights</p>
				<div class="tag-row">
					<span class="mini-tag">Fabric Catalog</span>
					<span class="mini-tag">AI Foundry</span>
					<span class="mini-tag">Access Control</span>
				</div>
			</div>
		</div>

		<div class="action-row">
			<button class="portal-btn" routerLink="/browse"><span class="ico">▣</span> <span>Browse Data</span></button>
			<button class="portal-btn" disabled><span class="ico">⚙</span> <span>Models</span></button>
			<button class="portal-btn" disabled><span class="ico">⚑</span> <span>Agents</span></button>
			<button class="portal-btn" disabled><span class="ico">⋈</span> <span>Dashboards</span></button>
		</div>

		<div class="conversation card">
			<div class="section-head">Conversational Access</div>
			<div class="input-wrap">
				<textarea placeholder="Ask about a data product" disabled></textarea>
			</div>
		</div>

		<div class="lower-grid">
			<div class="metrics card">
				<div class="section-head">Key Metrics</div>
				<div class="kpi-grid">
					<div class="kpi-box" aria-label="84 data products available"><div class="kpi-value">84</div><div class="kpi-label">Data Products</div></div>
					<div class="kpi-box" aria-label="15 models registered"><div class="kpi-value">15</div><div class="kpi-label">Models</div></div>
					<div class="kpi-box" aria-label="26 active agents"><div class="kpi-value">26</div><div class="kpi-label">Agents</div></div>
					<div class="kpi-box" aria-label="75 business domains"><div class="kpi-value">75</div><div class="kpi-label">Domains</div></div>
				</div>
			</div>
			<div class="psl card">
				<div class="section-head">Product Service Line</div>
				<p>Browse products by Product Service Line categories (coming soon).</p>
			</div>
		</div>
	</div>
	`,
	styles:[`
	.home-shell { max-width:1440px; margin:34px auto 70px; padding:0 42px; display:flex; flex-direction:column; gap:38px; }
	.hero-card { padding:110px 70px 96px; position:relative; overflow:hidden; z-index:0; background:#fff; color:var(--gray-800); border:1px solid var(--gray-150); border-radius:20px; box-shadow: var(--shadow-sm); }
	.hero-card:after { content:''; position:absolute; left:0; right:0; bottom:0; height:4px; background:linear-gradient(90deg,var(--brand) 0%, var(--brand-dark) 60%, var(--brand-dark) 100%); }
	.hero-inner { max-width:880px; position:relative; z-index:1; }
	.portal-title { margin:0 0 28px; font-size:54px; line-height:1.05; letter-spacing:.4px; font-weight:600; color:var(--brand); }
	.subtitle { margin:0 0 28px; font-size:18px; line-height:1.55; color:var(--gray-700); max-width:760px; }
	.tag-row { display:flex; gap:10px; flex-wrap:wrap; }
	.mini-tag { background:var(--brand-light); color:var(--brand-dark); font-size:12px; padding:7px 13px 8px; font-weight:600; border-radius:30px; letter-spacing:.55px; text-transform:uppercase; }
	/* brand bar removed per request (using neutral header) */

	.action-row { display:flex; gap:14px; flex-wrap:wrap; }
	.portal-btn { background:var(--brand); color:#fff; border:none; border-radius:8px; padding:13px 24px 14px; font-size:14px; font-weight:600; letter-spacing:.5px; display:inline-flex; align-items:center; gap:10px; cursor:pointer; box-shadow:0 1px 2px rgba(0,0,0,.16); line-height:1.3; }
	.portal-btn[disabled] { background:var(--gray-300); color:var(--gray-600); cursor:not-allowed; box-shadow:none; }
	.portal-btn:not([disabled]):hover { background:var(--brand-dark); }
	.portal-btn .ico { font-size:14px; line-height:1; }

	/* Conversational Access & shared section heading */
	.conversation { padding:28px 30px 34px; }
	.section-head { font-size:13px; letter-spacing:1.1px; font-weight:800; text-transform:uppercase; color:var(--gray-700); margin:0 0 18px; display:inline-block; }
	.section-head:after { content:''; display:block; width:100%; height:3px; background:var(--brand); border-radius:3px; margin:10px 0 0; }
	.input-wrap textarea { width:100%; border:1px solid var(--gray-200); border-radius:10px; min-height:90px; resize:vertical; padding:16px 18px; font-size:16px; line-height:1.45; background:var(--surface); font-family:inherit; }
	.input-wrap textarea:focus { outline:none; box-shadow: var(--focus-ring); border-color:var(--brand); }

	.lower-grid { display:grid; grid-template-columns: 1fr 320px; gap:26px; align-items:start; }
	@media (max-width:1180px){ .lower-grid { grid-template-columns: 1fr; } }
	.metrics { padding:30px 30px 36px; }
	.kpi-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-top:10px; }
	.kpi-box { background:#fff; border:1px solid var(--gray-200); border-radius:14px; padding:16px 18px 16px 20px; display:flex; flex-direction:column; gap:10px; min-height:118px; position:relative; box-shadow:0 2px 4px rgba(0,0,0,.05); }
	.kpi-box:after { content:''; position:absolute; left:20px; right:20px; bottom:14px; height:8px; background:linear-gradient(90deg,var(--brand) 0 30%, var(--gray-500) 30% 55%, var(--gray-700) 55% 78%, var(--gray-900) 78% 100%); border-radius:5px; opacity:.75; }
	.kpi-grid .kpi-box:nth-child(1){ border-left:4px solid var(--brand); }
	.kpi-grid .kpi-box:nth-child(2){ border-left:4px solid var(--gray-700); }
	.kpi-grid .kpi-box:nth-child(3){ border-left:4px solid var(--gray-500); }
	.kpi-grid .kpi-box:nth-child(4){ border-left:4px solid var(--gray-900); }
	.kpi-value { font-size:28px; font-weight:700; color:var(--brand-dark); letter-spacing:.3px; }
	.kpi-label { font-size:11px; letter-spacing:1px; text-transform:uppercase; font-weight:700; color:var(--gray-600); }
	.psl { padding:30px 28px 36px; border-left:5px solid var(--brand); }
	.psl p { margin:8px 0 0; font-size:14px; line-height:1.5; color:var(--gray-700); font-weight:500; }

	.card { background:#fff; border:1px solid var(--gray-150); border-radius:18px; box-shadow: var(--shadow-sm); }
	@media (max-width:820px){ .hero-card { padding:90px 48px 86px; } .portal-title { font-size:44px; } }
	@media (max-width:600px){ .hero-card { padding:78px 34px 78px; } .portal-title { font-size:36px; } .lower-grid { grid-template-columns: 1fr; } }
	`]
})
export class LandingComponent {}
