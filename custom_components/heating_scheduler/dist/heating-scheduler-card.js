import{a as c,b as t,c as o,d as h,q as l,r as d,s as u,t as a,x as p}from"./chunks/chunk-PK2CBGYI.js";var m=class extends h{constructor(){super();this.unsubscribe=null;this.messageTimer=null;this.snapshot=null,this.message="",this.addEventListener("hs-toast",s=>{this.message=s.detail,this.messageTimer&&clearTimeout(this.messageTimer),this.messageTimer=setTimeout(()=>this.message="",6e3)})}static{this.properties={hass:{attribute:!1},config:{state:!0},snapshot:{state:!0},message:{state:!0}}}static{this.styles=[d,c`
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
    `]}setConfig(s){if(!s||typeof s!="object")throw new Error("Invalid configuration");if(s.room!==void 0&&typeof s.room!="string")throw new Error("room must be a room id");this.config={...s}}getCardSize(){let s=this.config?.room?1:this.snapshot?.rooms.length??2;return(this.config?.show_house?3:0)+s*(this.config?.compact?3:5)}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}static getConfigElement(){return document.createElement("heating-scheduler-card-editor")}static getStubConfig(){return{show_house:!0}}connectedCallback(){super.connectedCallback(),this.hass&&!this.unsubscribe&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}willUpdate(s){s.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe()}subscribe(){this.unsubscribe=p(this.hass).subscribe(s=>this.snapshot=s)}render(){if(!this.hass||!this.config)return o;let s=a(u(this.hass)),e=this.snapshot;if(!e)return t`<div class="card status">${s("common.loading")}</div>`;let i=this.config.room?e.rooms.filter(n=>n.id===this.config.room):e.rooms;return t`
      <div class="stack">
        ${this.config.show_house?t`<hs-house-strip .hass=${this.hass} .snapshot=${e}></hs-house-strip>`:o}
        ${i.map(n=>t`<hs-room-tile
              .hass=${this.hass}
              .room=${n}
              .snapshot=${e}
              ?compact=${this.config.compact??!1}
            ></hs-room-tile>`)}
        ${this.message?t`<div class="message" role="alert">${this.message}</div>`:o}
      </div>
    `}},g=class extends h{constructor(){super();this.unsubscribe=null;this.snapshot=null}static{this.properties={hass:{attribute:!1},config:{state:!0},snapshot:{state:!0}}}static{this.styles=[d,c`
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
    `]}setConfig(s){this.config={...s}}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}willUpdate(s){s.has("hass")&&this.hass&&!this.unsubscribe&&(this.unsubscribe=p(this.hass).subscribe(e=>this.snapshot=e))}update_(s){let e={...this.config,...s};for(let i of Object.keys(e))(e[i]===void 0||e[i]===""||e[i]===!1)&&delete e[i];this.config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}render(){if(!this.hass||!this.config)return o;let s=a(u(this.hass));return t`
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
    `}};l("heating-scheduler-card",m);l("heating-scheduler-card-editor",g);var v=(document.documentElement.lang||navigator.language||"cs").startsWith("en")?"en":"cs",f=a(v);window.customCards=window.customCards??[];window.customCards.some(r=>r.type==="heating-scheduler-card")||window.customCards.push({type:"heating-scheduler-card",name:f("card.name"),description:f("card.description"),preview:!0});export{m as HeatingSchedulerCard,g as HeatingSchedulerCardEditor};
