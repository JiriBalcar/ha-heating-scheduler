import{D as p,M as f,a as c,b as t,c as r,d as h,u as l,v as d,w as a,y as u}from"./chunks/chunk-C2YFDFWI.js";var m=class extends h{constructor(){super();this.unsubscribe=null;this.messageTimer=null;this.snapshot=null,this.message="",this.addEventListener("hs-toast",s=>{this.message=s.detail,this.messageTimer&&clearTimeout(this.messageTimer),this.messageTimer=setTimeout(()=>this.message="",6e3)})}static{this.properties={hass:{attribute:!1},config:{state:!0},snapshot:{state:!0},message:{state:!0}}}static{this.styles=[u,c`
      :host {
        display: block;
      }
      .stack {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .status {
        padding: 16px;
        font-size: 17px;
      }
      .message {
        padding: 12px 16px;
        border-radius: 12px;
        background: #323232;
        color: #fff;
        font-size: 16px;
      }
    `]}setConfig(s){if(!s||typeof s!="object")throw new Error("Invalid configuration");if(s.room!==void 0&&typeof s.room!="string")throw new Error("room must be a room id");this.config={...s}}getCardSize(){let s=this.config?.room?1:this.snapshot?.rooms.length??2;return(this.config?.show_house?3:0)+s*(this.config?.compact?3:5)}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}static getConfigElement(){return document.createElement("heating-scheduler-card-editor")}static getStubConfig(){return{show_house:!0}}connectedCallback(){super.connectedCallback(),this.hass&&!this.unsubscribe&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}willUpdate(s){s.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe()}subscribe(){this.unsubscribe=p(this.hass).subscribe(s=>this.snapshot=s)}render(){if(!this.hass||!this.config)return r;let s=a(d(this.hass)),e=this.snapshot;if(!e)return t`<div class="card status">${s("common.loading")}</div>`;let i=this.config.room?e.rooms.filter(o=>o.id===this.config.room):e.rooms;return t`
      <div class="stack">
        ${this.config.show_house?t`<hs-house-strip .hass=${this.hass} .snapshot=${e}></hs-house-strip>`:r}
        ${f(i,o=>o.id,o=>t`<hs-room-tile
              .hass=${this.hass}
              .room=${o}
              .snapshot=${e}
              ?compact=${this.config.compact??!1}
            ></hs-room-tile>`)}
        ${this.message?t`<div class="message" role="alert">${this.message}</div>`:r}
      </div>
    `}},g=class extends h{constructor(){super();this.unsubscribe=null;this.snapshot=null}static{this.properties={hass:{attribute:!1},config:{state:!0},snapshot:{state:!0}}}static{this.styles=[u,c`
      .form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 48px;
        font-size: 16px;
      }
      .check input {
        width: 24px;
        height: 24px;
      }
    `]}setConfig(s){this.config={...s}}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}willUpdate(s){s.has("hass")&&this.hass&&!this.unsubscribe&&(this.unsubscribe=p(this.hass).subscribe(e=>this.snapshot=e))}update_(s){let e={...this.config,...s};for(let i of Object.keys(e))(e[i]===void 0||e[i]===""||e[i]===!1)&&delete e[i];this.config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){if(!this.hass||!this.config)return r;let s=a(d(this.hass));return t`
      <div class="form">
        <label class="field">
          <span>${s("card.room")}</span>
          <select
            class="input"
            @change=${e=>this.update_({room:e.target.value||void 0})}
          >
            <option value="" ?selected=${!this.config.room}>${s("card.all_rooms")}</option>
            ${(this.snapshot?.rooms??[]).map(e=>t`<option value=${e.id} ?selected=${e.id===this.config.room}>${e.name}</option>`)}
          </select>
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${this.config.show_house??!1}
            @change=${e=>this.update_({show_house:e.target.checked})}
          />
          ${s("card.show_house")}
        </label>
        <label class="check">
          <input
            type="checkbox"
            .checked=${this.config.compact??!1}
            @change=${e=>this.update_({compact:e.target.checked})}
          />
          ${s("card.compact")}
        </label>
      </div>
    `}};l("heating-scheduler-card",m);l("heating-scheduler-card-editor",g);var C=(document.documentElement.lang||navigator.language||"cs").startsWith("en")?"en":"cs",b=a(C);window.customCards=window.customCards??[];window.customCards.some(n=>n.type==="heating-scheduler-card")||window.customCards.push({type:"heating-scheduler-card",name:b("card.name"),description:b("card.description"),preview:!0});export{m as HeatingSchedulerCard,g as HeatingSchedulerCardEditor};
