import{a as d,b as e,c as s,d as a,e as f,f as g,g as x,h as y,i as w,j as r,k as i,l as n,m as p,n as $}from"./chunks/chunk-WF3H7QYY.js";var m=class extends a{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},section:{attribute:!1}}}static{this.styles=[i]}render(){return s??e``}};r("hs-advanced-view",m);var u=class extends a{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1}}}static{this.styles=[i,d`
      :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .rooms {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
        gap: 16px;
      }
      .dry {
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--warning-color, #e65100);
        color: #fff;
        font-weight: 600;
        font-size: 17px;
      }
      .empty {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
        font-size: 18px;
      }
    `]}addRooms(){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/advanced/rooms",bubbles:!0,composed:!0}))}render(){if(!this.snapshot)return s;let h=p(n(this.hass));return e`
      ${this.snapshot.settings.dry_run?e`<div class="dry" role="status">${h("adv.dry_run_banner")}</div>`:s}
      <hs-house-strip .hass=${this.hass} .snapshot=${this.snapshot}></hs-house-strip>
      ${this.snapshot.rooms.length===0?e`<div class="card empty">
            <span>${h("adv.rooms.empty")}</span>
            <button class="btn primary" @click=${this.addRooms}>
              <hs-icon .path=${x}></hs-icon>${h("adv.rooms.add")}
            </button>
          </div>`:e`<div class="rooms">
            ${this.snapshot.rooms.map(t=>e`<hs-room-tile
                  .hass=${this.hass}
                  .room=${t}
                  .snapshot=${this.snapshot}
                ></hs-room-tile>`)}
          </div>`}
    `}};r("hs-home-view",u);var v=class extends a{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},planId:{attribute:!1}}}static{this.styles=[i]}render(){return s??e``}};r("hs-plans-view",v);var k=[{tab:"home",path:"",icon:w,label:"nav.home"},{tab:"plans",path:"/plans",icon:f,label:"nav.plans"},{tab:"advanced",path:"/advanced",icon:y,label:"nav.advanced"}],b=class extends a{constructor(){super();this.unsubscribe=null;this.timers=[];this.clock=null;this.messageTimer=null;this.snapshot=null,this.waitedTooLong=!1,this.message="",this.tick=0,this.addEventListener("hs-toast",t=>this.showMessage(t.detail)),this.addEventListener("hs-navigate",t=>this.navigate(t.detail))}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1},snapshot:{state:!0},waitedTooLong:{state:!0},message:{state:!0},tick:{state:!0}}}static{this.styles=[i,d`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--primary-background-color, #fafafa);
      }
      .toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 64px;
        padding: 0 12px;
        background: var(--app-header-background-color, var(--primary-color, #1565c0));
        color: var(--app-header-text-color, var(--text-primary-color, #fff));
      }
      .toolbar h1 {
        margin: 0 0 0 8px;
        font-size: 24px;
        font-weight: 600;
      }
      .icon-button {
        width: 52px;
        height: 52px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: inherit;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      nav {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        background: var(--card-background-color, #fff);
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        position: sticky;
        top: 0;
        z-index: 2;
      }
      nav button {
        min-height: 60px;
        border: none;
        border-bottom: 4px solid transparent;
        background: transparent;
        font-size: 17px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: var(--secondary-text-color, #5f6368);
      }
      nav button[aria-current="page"] {
        color: var(--primary-text-color, #212121);
        font-weight: 700;
        border-bottom-color: var(--primary-color, #1565c0);
      }
      main {
        max-width: 1280px;
        margin: 0 auto;
        padding: 16px 16px calc(96px + env(safe-area-inset-bottom, 0px));
      }
      .status {
        padding: 32px 16px;
        text-align: center;
        font-size: 18px;
      }
      .toast {
        position: fixed;
        left: 50%;
        bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        transform: translateX(-50%);
        max-width: min(92vw, 560px);
        padding: 16px 20px;
        border-radius: 14px;
        background: #323232;
        color: #fff;
        font-size: 17px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.3);
        z-index: 10;
      }
      @media (max-width: 420px) {
        nav button {
          flex-direction: column;
          gap: 2px;
          font-size: 14px;
        }
      }
    `]}connectedCallback(){super.connectedCallback(),this.clock=setInterval(()=>this.tick+=1,3e4),this.hass&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null,this.clock&&clearInterval(this.clock);for(let t of this.timers)clearTimeout(t);this.timers=[]}willUpdate(t){t.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe()}subscribe(){this.unsubscribe=$(this.hass).subscribe(t=>{this.snapshot=t}),this.timers.push(setTimeout(()=>this.waitedTooLong=this.snapshot===null,8e3))}showMessage(t){this.message=t,this.messageTimer&&clearTimeout(this.messageTimer),this.messageTimer=setTimeout(()=>this.message="",6e3)}navigate(t){let o=this.route?.prefix??"/heating-scheduler";history.pushState(null,"",`${o}${t}`),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}toggleMenu(){this.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:!0,composed:!0}))}get path(){return this.route?.path??""}get tab(){return this.path.startsWith("/plans")?"plans":this.path.startsWith("/advanced")?"advanced":"home"}view(){let t=p(n(this.hass));if(!this.snapshot)return e`<div class="status">${this.waitedTooLong?t("common.not_loaded"):t("common.loading")}</div>`;let o=this.path.split("/").filter(Boolean);switch(this.tab){case"plans":return e`<hs-plans-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .planId=${o[1]??null}
        ></hs-plans-view>`;case"advanced":return e`<hs-advanced-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .section=${o[1]??"rooms"}
        ></hs-advanced-view>`;default:return e`<hs-home-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-home-view>`}}render(){if(!this.hass)return s;let t=p(n(this.hass)),o=this.tab;return e`
      <header class="toolbar">
        ${this.narrow?e`<button class="icon-button" @click=${this.toggleMenu} aria-label=${t("nav.menu")}>
              <hs-icon .path=${g}></hs-icon>
            </button>`:s}
        <h1>${t("app.title")}</h1>
      </header>
      <nav>
        ${k.map(l=>e`<button
            aria-current=${l.tab===o?"page":"false"}
            @click=${()=>this.navigate(l.path)}
          >
            <hs-icon .path=${l.icon}></hs-icon>${t(l.label)}
          </button>`)}
      </nav>
      <main data-tick=${this.tick}>${this.view()}</main>
      ${this.message?e`<div class="toast" role="alert">${this.message}</div>`:s}
    `}};r("heating-scheduler-panel",b);export{b as HeatingSchedulerPanel};
