import{A as T,B as kt,C as j,D as v,E as b,F as y,G as k,H as C,I as D,J as P,K as Dt,L as St,M as Et,a as p,b as n,c as l,d as c,e as ut,f as ft,g as vt,h as gt,i as bt,j as B,k as M,l as yt,m as xt,n as z,o as K,p as A,q as _,r as U,s as $t,t as wt,u as h,v as u,w as f,x as _t,y as m,z as L}from"./chunks/chunk-C2YFDFWI.js";var Ut={idle:"#2e7d32",writing:"#1565c0",waiting:"#616161",failed:"#c62828"},X=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .room {
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      h3 {
        font-size: 20px;
      }
      .valve {
        border-top: 1px solid var(--divider-color, #e0e0e0);
        padding-top: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 6px 16px;
        font-size: 16px;
      }
      .valve .name {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 17px;
      }
      .phase {
        color: #fff;
        border-radius: 999px;
        padding: 2px 10px;
        font-size: 14px;
      }
      .error {
        grid-column: 1 / -1;
        color: var(--error-color, #c62828);
      }
      dt {
        font-size: 14px;
      }
      dd {
        margin: 0;
        font-weight: 600;
      }
    `]}get t(){return f(u(this.hass))}async check(){this.busy=!0;try{await v(this.hass).call("reconcile")}catch(s){y(this,b(s,this.t))}finally{this.busy=!1}}render(){if(!this.snapshot||!this.hass)return l;let s=this.t,t=L(this.hass,u(this.hass),this.snapshot),e=this.snapshot.rooms.every(i=>i.issues.length===0),a=i=>{let r=this.hass.states[i]?.attributes.friendly_name;return typeof r=="string"?r:i};return n`
      <button class="btn primary" ?disabled=${this.busy} @click=${this.check}>
        <hs-icon .path=${U}></hs-icon>${s("adv.health.check_now")}
      </button>
      ${e?n`<p>${s("adv.health.all_ok")}</p>`:l}
      ${this.snapshot.rooms.map(i=>n`<section class="card room">
          <h3>${i.name}</h3>
          ${i.trv_status.length===0?n`<span class="muted">${s("adv.rooms.none_trvs")}</span>`:l}
          ${i.trv_status.map(r=>n`<dl class="valve">
              <div class="name">
                ${a(r.entity_id)}
                <span class="phase" style="background:${Ut[r.phase]}">
                  ${s(`adv.health.phase.${r.phase}`)}
                </span>
              </div>
              <div><dt class="muted">${s("adv.health.wanted")}</dt><dd>${T(r.desired,t)}</dd></div>
              <div><dt class="muted">${s("adv.health.valve")}</dt><dd>${T(r.setpoint,t)}</dd></div>
              <div><dt class="muted">${s("adv.health.mode")}</dt><dd>${r.hvac_mode??"\u2014"}</dd></div>
              <div>
                <dt class="muted">${s("adv.health.last_write")}</dt>
                <dd>${r.last_write?j(r.last_write,t):"\u2014"}</dd>
              </div>
              ${i.issues.filter(d=>d.entity_id===r.entity_id).map(d=>n`<div class="error">${s(`health.${d.kind}`,{name:a(r.entity_id)})}</div>`)}
              ${r.last_error?n`<div class="error">${s("adv.health.error")}: ${r.last_error}</div>`:l}
            </dl>`)}
        </section>`)}
    `}};h("hs-adv-health",X);var Y=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},roomId:{state:!0},entries:{state:!0},loading:{state:!0}}}constructor(){super(),this.roomId="",this.entries=[],this.loading=!1}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .top {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .top .field {
        flex: 1 1 220px;
      }
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }
      li {
        display: grid;
        grid-template-columns: minmax(130px, auto) 1fr;
        gap: 4px 14px;
        padding: 10px 14px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        font-size: 16px;
      }
      li:last-child {
        border-bottom: none;
      }
      .what {
        font-weight: 700;
      }
      .detail {
        grid-column: 2;
        font-size: 14px;
      }
      @media (max-width: 480px) {
        li {
          grid-template-columns: 1fr;
        }
        .detail {
          grid-column: 1;
        }
      }
    `]}get t(){return f(u(this.hass))}connectedCallback(){super.connectedCallback(),!this.roomId&&this.snapshot?.rooms.length&&(this.roomId=this.snapshot.rooms[0].id,this.load())}async load(){if(this.roomId){this.loading=!0;try{let s=await v(this.hass).call("log",{room_id:this.roomId});this.entries=s.entries}catch(s){y(this,b(s,this.t))}finally{this.loading=!1}}}label(s){let t=`log.${s}`;return _t.includes(t)?this.t(t):s}render(){if(!this.snapshot||!this.hass)return l;let s=this.t,t=L(this.hass,u(this.hass),this.snapshot),e=a=>{if(!a)return"";let i=this.hass.states[a]?.attributes.friendly_name;return typeof i=="string"?i:a};return n`
      <div class="top">
        <label class="field">
          <span>${s("adv.log.room")}</span>
          <select
            class="input"
            @change=${a=>{this.roomId=a.target.value,this.load()}}
          >
            ${this.snapshot.rooms.map(a=>n`<option value=${a.id} ?selected=${a.id===this.roomId}>${a.name}</option>`)}
          </select>
        </label>
        <button class="btn" ?disabled=${this.loading} @click=${this.load}>
          <hs-icon .path=${U}></hs-icon>${s("adv.log.refresh")}
        </button>
      </div>
      ${this.entries.length===0?n`<p class="muted">${s("adv.log.empty")}</p>`:n`<ol class="card">
            ${this.entries.map(a=>n`<li>
                <span class="muted">${j(a.at,t)}</span>
                <span>
                  <span class="what">${this.label(a.kind)}</span>
                  ${a.value!==null?n` · ${T(a.value,t)}`:l}
                  ${a.hvac_mode?n` · ${a.hvac_mode}`:l}
                  ${a.entity_id?n` · ${e(a.entity_id)}`:l}
                </span>
                ${a.mode||a.detail?n`<span class="detail muted">
                      ${a.mode?s(`mode.${a.mode}`):""}${a.mode&&a.detail?" \xB7 ":""}${a.detail??""}
                    </span>`:l}
              </li>`)}
          </ol>`}
    `}};h("hs-adv-log",Y);function I(o,s={}){let t={...o,...s};return{id:t.id,name:t.name,trvs:t.trvs,plan_id:t.plan_id,temp_set_id:t.temp_set_id,temperature_entity:t.temperature_entity,area_id:t.area_id}}function N(o,s){let t=new Set(s.map(e=>e.trim().toLowerCase()));if(!t.has(o.trim().toLowerCase()))return o;for(let e=2;;e+=1){let a=`${o} ${e}`;if(!t.has(a.toLowerCase()))return a}}var W=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},candidates:{attribute:!1},room:{attribute:!1},name:{state:!0},trvs:{state:!0},sensor:{state:!0},planId:{state:!0},setId:{state:!0},error:{state:!0},saving:{state:!0}}}static{this.styles=[m,p`
      .form {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .valves {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 320px;
        overflow-y: auto;
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 12px;
        padding: 6px;
      }
      .valve {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        padding: 0 8px;
        border-radius: 10px;
        font-size: 17px;
      }
      .valve.taken {
        opacity: 0.55;
      }
      .valve input {
        width: 26px;
        height: 26px;
        accent-color: var(--hs-accent, #1565c0);
        flex: none;
      }
      .valve small {
        display: block;
        font-size: 14px;
      }
      .hint {
        font-size: 14px;
      }
      .error {
        color: var(--error-color, #c62828);
        font-weight: 600;
        margin: 0;
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}prepare(){let s=this.room;this.name=s?.name??"",this.trvs=[...s?.trvs??[]],this.sensor=s?.temperature_entity??"",this.planId=s?.plan_id??"house",this.setId=s?.temp_set_id??"house",this.error="",this.saving=!1}toggle(s,t){this.trvs=t?[...this.trvs,s]:this.trvs.filter(e=>e!==s)}changedElsewhere(){if(!this.room)return null;let s=this.snapshot.rooms.find(a=>a.id===this.room.id);return s?["name","trvs","plan_id","temp_set_id","temperature_entity","area_id"].every(a=>JSON.stringify(s[a])===JSON.stringify(this.room[a]))?null:s:null}async save(){let s=f(u(this.hass)),t=this.changedElsewhere();if(t){if(!await C(this,s)){this.room=t,this.prepare();return}this.room=t}this.saving=!0,this.error="";let e=this.room??{id:"",name:"",trvs:[],plan_id:"house",temp_set_id:"house",temperature_entity:null,area_id:null,current_temperature:null,target:null,override:null,issues:[],trv_status:[]},a=I(e,{name:this.name.trim(),trvs:this.trvs,temperature_entity:this.sensor||null,plan_id:this.planId,temp_set_id:this.setId});try{await v(this.hass).call("room/save",{revision:this.snapshot.revision,room:{...a,id:this.room?a.id:null}}),this.dialog?.close()}catch(i){this.error=b(i,s)}finally{this.saving=!1}}render(){if(!this.hass||!this.snapshot||!this.candidates)return l;let s=f(u(this.hass)),t=e=>this.snapshot.rooms.find(a=>a.id===e)?.name??"";return n`
      <hs-dialog
        wide
        .heading=${this.room?s("adv.rooms.edit_title"):s("adv.rooms.new_title")}
        .closeLabel=${s("common.cancel")}
      >
        <div class="form">
          <label class="field">
            <span>${s("adv.rooms.name")}</span>
            <input
              class="input"
              maxlength="60"
              .value=${this.name}
              @input=${e=>this.name=e.target.value}
            />
          </label>
          <div class="field">
            <span>${s("adv.rooms.trvs")}</span>
            ${this.candidates.climates.length===0?n`<span class="muted">${s("adv.rooms.no_climates")}</span>`:n`<div class="valves">
                  ${this.candidates.climates.map(e=>{let a=e.room_id&&e.room_id!==this.room?.id?e.room_id:null;return n`<label class="valve ${a?"taken":""}">
                      <input
                        type="checkbox"
                        .checked=${this.trvs.includes(e.entity_id)}
                        ?disabled=${a!==null}
                        @change=${i=>this.toggle(e.entity_id,i.target.checked)}
                      />
                      <span>
                        ${e.name}
                        <small class="muted">
                          ${e.entity_id}${a?` \xB7 ${s("adv.rooms.in_room",{room:t(a)})}`:""}
                        </small>
                      </span>
                    </label>`})}
                </div>`}
          </div>
          <label class="field">
            <span>${s("adv.rooms.temperature_entity")}</span>
            <select class="input" @change=${e=>this.sensor=e.target.value}>
              <option value="" ?selected=${!this.sensor}>${s("adv.rooms.temperature_auto")}</option>
              ${this.candidates.temperature_entities.map(e=>n`<option value=${e.entity_id} ?selected=${e.entity_id===this.sensor}>
                  ${e.name}
                </option>`)}
              ${this.candidates.climates.map(e=>n`<option value=${e.entity_id} ?selected=${e.entity_id===this.sensor}>
                  ${e.name}
                </option>`)}
            </select>
            <span class="hint muted">${s("adv.rooms.sensor_hint")}</span>
          </label>
          <label class="field">
            <span>${s("adv.rooms.plan")}</span>
            <select class="input" @change=${e=>this.planId=e.target.value}>
              ${this.snapshot.plans.map(e=>n`<option value=${e.id} ?selected=${e.id===this.planId}>${e.name}</option>`)}
            </select>
          </label>
          <label class="field">
            <span>${s("adv.rooms.temp_set")}</span>
            <select class="input" @change=${e=>this.setId=e.target.value}>
              ${this.snapshot.temp_sets.map(e=>n`<option value=${e.id} ?selected=${e.id===this.setId}>${e.name}</option>`)}
            </select>
          </label>
          ${this.error?n`<p class="error" role="alert">${this.error}</p>`:l}
        </div>
        <button slot="actions" class="btn" @click=${()=>this.dialog?.close()}>${s("common.cancel")}</button>
        <button
          slot="actions"
          class="btn primary"
          ?disabled=${this.saving||!this.name.trim()}
          @click=${this.save}
        >
          ${s("common.save")}
        </button>
      </hs-dialog>
    `}};h("hs-room-dialog",W);async function Mt(o,s,t,e,a){let i=document.createElement("hs-room-dialog");i.hass=s,i.snapshot=t,i.candidates=e,i.room=a,i.prepare();let r=v(s).subscribe(g=>{g&&(i.snapshot=g)});(o.shadowRoot??o).appendChild(i),await i.updateComplete;let d=i.dialog;if(!d){r();return}d.addEventListener("hs-closed",()=>{r(),i.remove()},{once:!0}),await d.show()}var J=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},candidates:{state:!0},importChoice:{state:!0},busy:{state:!0}}}constructor(){super(),this.candidates=null,this.importChoice=new Set,this.busy=!1}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .top {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .top .btn {
        flex: 1 1 240px;
      }
      .room {
        padding: 14px 16px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        align-items: start;
      }
      .room h3 {
        font-size: 20px;
      }
      .details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 16px;
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }
      .icon {
        width: 52px;
        padding: 0;
      }
      .areas {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .area {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 52px;
        font-size: 18px;
      }
      .area input {
        width: 26px;
        height: 26px;
        accent-color: var(--hs-accent, #1565c0);
      }
      .area small {
        display: block;
        font-size: 14px;
      }
      @media (max-width: 520px) {
        .room {
          grid-template-columns: 1fr;
        }
        .buttons {
          justify-content: flex-start;
        }
      }
    `]}get t(){return f(u(this.hass))}async loadCandidates(){try{return this.candidates=await v(this.hass).call("candidates"),this.candidates}catch(s){return y(this,b(s,this.t)),null}}async edit(s){let t=await this.loadCandidates();t&&await Mt(this,this.hass,this.snapshot,t,s)}async move(s,t){let e=this.snapshot.rooms.map(r=>r.id),a=e.indexOf(s.id),i=a+t;i<0||i>=e.length||([e[a],e[i]]=[e[i],e[a]],await this.call("rooms/reorder",{revision:this.snapshot.revision,order:e}))}async deleteRoom(s){let t=this.t;await k(this,{heading:t("common.delete"),message:t("adv.rooms.delete_confirm",{name:s.name}),confirm:t("common.delete"),cancel:t("common.cancel"),danger:!0})&&await this.call("room/delete",{revision:this.snapshot.revision,room_id:s.id})}async call(s,t){this.busy=!0;try{await v(this.hass).call(s,t)}catch(e){y(this,b(e,this.t))}finally{this.busy=!1}}importDialog(){return this.renderRoot.querySelector("#import")}async openImport(){await this.loadCandidates()&&(this.importChoice=new Set(this.freeAreas().map(t=>t.area_id)),await this.importDialog()?.show())}freeAreas(){let s=new Set(this.snapshot.rooms.flatMap(t=>t.trvs));return(this.candidates?.areas??[]).map(t=>({...t,climates:t.climates.filter(e=>!s.has(e))})).filter(t=>t.climates.length>0)}async runImport(){let s=v(this.hass),t=this.snapshot.revision,e=this.snapshot.rooms.map(i=>i.name),a=new Set(this.snapshot.rooms.flatMap(i=>i.trvs));this.busy=!0;try{for(let i of this.freeAreas()){if(!this.importChoice.has(i.area_id))continue;let r=N(i.name,e);e.push(r);let d=i.climates.filter($=>!a.has($)),g=I({id:"",name:r,trvs:d,plan_id:"house",temp_set_id:"house",temperature_entity:i.temperature_entity,area_id:i.area_id},{});t=(await s.call("room/save",{revision:t,room:{...g,id:null}})).revision}this.importDialog()?.close()}catch(i){y(this,b(i,this.t))}finally{this.busy=!1}}valveNames(s){return s.trvs.length?s.trvs.map(t=>{let e=this.hass.states[t]?.attributes.friendly_name;return typeof e=="string"?e:t}).join(", "):this.t("adv.rooms.none_trvs")}render(){if(!this.snapshot||!this.hass)return l;let s=this.t,t=i=>this.snapshot.plans.find(r=>r.id===i)?.name??i,e=i=>this.snapshot.temp_sets.find(r=>r.id===i)?.name??i,a=this.snapshot.rooms;return n`
      <div class="top">
        <button class="btn primary" ?disabled=${this.busy} @click=${()=>this.edit(null)}>
          <hs-icon .path=${_}></hs-icon>${s("adv.rooms.add")}
        </button>
        <button class="btn" ?disabled=${this.busy} @click=${this.openImport}>
          <hs-icon .path=${yt}></hs-icon>${s("adv.rooms.import")}
        </button>
      </div>
      ${a.length===0?n`<p class="muted">${s("adv.rooms.empty")}</p>`:l}
      ${a.map((i,r)=>n`<article class="card room">
          <div class="details">
            <h3>${i.name}</h3>
            <span>${s("adv.rooms.trvs")}: ${this.valveNames(i)}</span>
            <span class="muted">${s("adv.rooms.plan")}: ${t(i.plan_id)}</span>
            <span class="muted">${s("adv.rooms.temp_set")}: ${e(i.temp_set_id)}</span>
          </div>
          <div class="buttons">
            <button class="btn icon" ?disabled=${this.busy||r===0} @click=${()=>this.move(i,-1)} aria-label=${s("adv.rooms.move_up")}>
              <hs-icon .path=${bt}></hs-icon>
            </button>
            <button
              class="btn icon"
              ?disabled=${this.busy||r===a.length-1}
              @click=${()=>this.move(i,1)}
              aria-label=${s("adv.rooms.move_down")}
            >
              <hs-icon .path=${vt}></hs-icon>
            </button>
            <button class="btn" ?disabled=${this.busy} @click=${()=>this.edit(i)}>
              <hs-icon .path=${K}></hs-icon>${s("common.edit")}
            </button>
            <button class="btn danger icon" ?disabled=${this.busy} @click=${()=>this.deleteRoom(i)} aria-label=${s("common.delete")}>
              <hs-icon .path=${M}></hs-icon>
            </button>
          </div>
        </article>`)}
      <hs-dialog id="import" .heading=${s("adv.rooms.import")} .closeLabel=${s("common.cancel")}>
        ${this.freeAreas().length?n`<p>${s("adv.rooms.import_hint")}</p>
              <div class="areas">
                ${this.freeAreas().map(i=>n`<label class="area">
                    <input
                      type="checkbox"
                      .checked=${this.importChoice.has(i.area_id)}
                      @change=${r=>{let d=new Set(this.importChoice);r.target.checked?d.add(i.area_id):d.delete(i.area_id),this.importChoice=d}}
                    />
                    <span>
                      ${i.name}
                      <small class="muted">${i.climates.join(", ")}</small>
                    </span>
                  </label>`)}
              </div>`:n`<p>${s("adv.rooms.import_none")}</p>`}
        <button slot="actions" class="btn" @click=${()=>this.importDialog()?.close()}>${s("common.cancel")}</button>
        <button
          slot="actions"
          class="btn primary"
          ?disabled=${this.busy||this.importChoice.size===0}
          @click=${this.runImport}
        >
          ${s("adv.rooms.import_button")}
        </button>
      </hs-dialog>
    `}};h("hs-adv-rooms",J);var jt=[1,2,3,4,6,8,12,24];function Z(o,s){return Object.keys(o).every(t=>o[t]===s[t])}var qt=[1,2,5,10,15,30,60],Vt=[10,20,30,60,120,240],G=class extends c{constructor(){super();this.revision=-1;this.base=null;this.busy=!1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},draft:{state:!0},busy:{state:!0}}}static{this.styles=[m,p`
      .card {
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .hint {
        font-size: 15px;
        font-weight: 400;
      }
      .choice {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .choice .btn[aria-pressed="true"] {
        background: var(--hs-accent, #1565c0);
        border-color: var(--hs-accent, #1565c0);
        color: #fff;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 52px;
        font-size: 18px;
      }
      .check input {
        width: 28px;
        height: 28px;
        accent-color: var(--hs-accent, #1565c0);
        flex: none;
      }
    `]}get t(){return f(u(this.hass))}willUpdate(t){t.has("snapshot")&&this.snapshot&&this.snapshot.revision!==this.revision&&(this.revision=this.snapshot.revision,(!this.base||!this.draft||Z(this.draft,this.base))&&(this.draft={...this.snapshot.settings},this.base={...this.snapshot.settings}))}set(t,e){this.draft={...this.draft,[t]:e}}get dirty(){return this.base!==null&&!Z(this.draft,this.base)}async save(){let t=this.snapshot.settings;if(this.base&&!Z(t,this.base)&&!await C(this,this.t)){this.draft={...t},this.base={...t};return}let e={...this.draft};this.busy=!0;try{await v(this.hass).call("settings/save",{revision:this.snapshot.revision,settings:e}),this.base=e,y(this,this.t("adv.settings.saved"))}catch(a){y(this,b(a,this.t))}finally{this.busy=!1}}select(t,e,a,i,r,d){let g=this.t,w=e.includes(a)?e:[...e,a].sort(($,F)=>$-F);return n`<label class="field">
      <span>${t}</span>
      <select class="input" @change=${$=>r(Number($.target.value))}>
        ${w.map($=>n`<option value=${$} ?selected=${$===a}>
            ${g(i==="hours"?"adv.settings.hours":"adv.settings.minutes",{n:$})}
          </option>`)}
      </select>
      ${d?n`<span class="hint muted">${d}</span>`:l}
    </label>`}render(){if(!this.snapshot||!this.hass||!this.draft)return l;let t=this.t,e=this.draft;return n`
      <div class="card">
        ${this.select(t("adv.settings.max_override"),jt,e.max_override_minutes/60,"hours",a=>this.set("max_override_minutes",Math.round(a*60)),t("adv.settings.max_override_hint"))}
        ${this.select(t("adv.settings.safety_interval"),qt,e.safety_interval_minutes,"minutes",a=>this.set("safety_interval_minutes",a))}
        ${this.select(t("adv.settings.mismatch_alert"),Vt,e.mismatch_alert_minutes,"minutes",a=>this.set("mismatch_alert_minutes",a))}
        <div class="field">
          <span>${t("adv.settings.vacation_mode")}</span>
          <div class="choice">
            <button
              class="btn"
              aria-pressed=${e.vacation_mode==="frost"?"true":"false"}
              @click=${()=>this.set("vacation_mode","frost")}
            >
              ${t("adv.settings.frost")}
            </button>
            <button
              class="btn"
              aria-pressed=${e.vacation_mode==="away"?"true":"false"}
              @click=${()=>this.set("vacation_mode","away")}
            >
              ${t("adv.settings.away")}
            </button>
          </div>
        </div>
        <label class="check">
          <input
            type="checkbox"
            .checked=${e.dry_run}
            @change=${a=>this.set("dry_run",a.target.checked)}
          />
          ${t("adv.settings.dry_run")}
        </label>
        <button class="btn primary" ?disabled=${this.busy||!this.dirty} @click=${this.save}>
          ${t("common.save")}
        </button>
      </div>
    `}};h("hs-adv-settings",G);function Q(o,s){let t=new Set([...Object.keys(o.temperatures),...Object.keys(s.temperatures)]);return o.name.trim()===s.name.trim()&&[...t].every(e=>o.temperatures[e]===s.temperatures[e])}function Ft(o){return Math.min(30,Math.max(5,Math.round(o*2)/2))}var tt=class extends c{constructor(){super();this.revision=-1;this.base={};this.drafts={},this.busy=!1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},drafts:{state:!0},busy:{state:!0}}}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .set {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h3 {
        font-size: 20px;
      }
      .mode {
        display: grid;
        grid-template-columns: minmax(140px, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-height: 60px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        padding: 4px 0;
      }
      .mode:last-of-type {
        border-bottom: none;
      }
      .label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
      }
      .stepper {
        display: grid;
        grid-template-columns: 52px 96px 52px;
        align-items: center;
        gap: 6px;
      }
      .stepper strong {
        text-align: center;
        font-size: 22px;
        font-variant-numeric: tabular-nums;
      }
      .stepper .btn {
        padding: 0;
      }
      .own {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
      }
      .own input {
        width: 24px;
        height: 24px;
        accent-color: var(--hs-accent, #1565c0);
      }
      .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .buttons .btn {
        flex: 1 1 160px;
      }
      @media (max-width: 480px) {
        .mode {
          grid-template-columns: 1fr;
        }
      }
    `]}get t(){return f(u(this.hass))}willUpdate(t){if(t.has("snapshot")&&this.snapshot&&this.snapshot.revision!==this.revision){this.revision=this.snapshot.revision;let e={},a={};for(let i of this.snapshot.temp_sets){let r={name:i.name,temperatures:{...i.temperatures}},d=this.drafts[i.id],g=this.base[i.id];d&&g&&!Q(d,g)?(e[i.id]=d,a[i.id]=g):(e[i.id]=r,a[i.id]=r)}this.drafts=e,this.base=a}}house(){return this.snapshot.temp_sets.find(t=>t.id==="house")?.temperatures??{}}dirty(t){let e=this.drafts[t.id],a=this.base[t.id];return!!(e&&a&&!Q(e,a))}patch(t,e){this.drafts={...this.drafts,[t]:e(this.drafts[t])}}setValue(t,e,a){this.patch(t,i=>{let r={...i.temperatures};return a===void 0?delete r[e]:r[e]=Ft(a),{...i,temperatures:r}})}async run(t,e){this.busy=!0;try{return await v(this.hass).call(t,{revision:this.snapshot.revision,...e}),!0}catch(a){return y(this,b(a,this.t)),!1}finally{this.busy=!1}}async save(t){let e=this.drafts[t.id],a=this.base[t.id],i={name:t.name,temperatures:t.temperatures};if(a&&!Q(i,a)&&!await C(this,this.t)){this.drafts={...this.drafts,[t.id]:i},this.base={...this.base,[t.id]:i};return}await this.run("temp_set/save",{temp_set:{id:t.id,name:e.name.trim(),temperatures:e.temperatures}})&&(this.base={...this.base,[t.id]:{...e,name:e.name.trim()}})}async deleteSet(t){let e=this.t,a=(t.used_by??[]).map(r=>this.snapshot.rooms.find(d=>d.id===r)?.name).filter(Boolean).join(", ");await k(this,{heading:e("common.delete"),message:a?e("adv.temps.delete_confirm_used",{name:t.name,rooms:a}):e("adv.temps.delete_confirm",{name:t.name}),confirm:e("common.delete"),cancel:e("common.cancel"),danger:!0})&&await this.run("temp_set/delete",{temp_set_id:t.id})}createSet(){let t=N(this.t("adv.temps.new"),this.snapshot.temp_sets.map(e=>e.name));this.run("temp_set/save",{temp_set:{name:t,temperatures:{}}})}stepper(t,e,a){let i=L(this.hass,u(this.hass),this.snapshot),r=this.t;return n`<div class="stepper">
      <button class="btn" @click=${()=>this.setValue(t,e,a-.5)} aria-label=${r("room.cooler")}>
        <hs-icon .path=${z}></hs-icon>
      </button>
      <strong>${T(a,i)}</strong>
      <button class="btn" @click=${()=>this.setValue(t,e,a+.5)} aria-label=${r("room.warmer")}>
        <hs-icon .path=${A}></hs-icon>
      </button>
    </div>`}renderSet(t){let e=this.t,a=this.drafts[t.id];if(!a)return l;let i=this.house(),r=t.id==="house",d=L(this.hass,u(this.hass),this.snapshot);return n`<section class="card set">
      ${r?n`<h3>${e("adv.temps.house")}</h3><span class="muted">${e("adv.temps.house_hint")}</span>`:n`<label class="field">
            <span>${e("plans.name")}</span>
            <input
              class="input"
              maxlength="60"
              .value=${a.name}
              @input=${g=>this.patch(t.id,w=>({...w,name:g.target.value}))}
            />
          </label>`}
      ${St.map(g=>{let w=a.temperatures[g],$=i[g]??20;return n`<div class="mode">
          <span class="label">
            <hs-icon .path=${P[g]} style="color:${D[g]}"></hs-icon>${e(`mode.${g}`)}
          </span>
          ${r?this.stepper(t.id,g,w??$):n`<div>
                <label class="own">
                  <input
                    type="checkbox"
                    .checked=${w!==void 0}
                    @change=${F=>this.setValue(t.id,g,F.target.checked?$:void 0)}
                  />
                  ${w===void 0?e("adv.temps.as_house",{temp:T($,d)}):e("adv.temps.own")}
                </label>
                ${w!==void 0?this.stepper(t.id,g,w):l}
              </div>`}
        </div>`})}
      <span class="muted">${e("adv.temps.save_hint")}</span>
      <div class="buttons">
        <button class="btn primary" ?disabled=${this.busy||!this.dirty(t)} @click=${()=>{this.save(t)}}>
          ${e("common.save")}
        </button>
        ${r?l:n`<button class="btn danger" ?disabled=${this.busy} @click=${()=>this.deleteSet(t)}>
              <hs-icon .path=${M}></hs-icon>${e("common.delete")}
            </button>`}
      </div>
    </section>`}render(){if(!this.snapshot||!this.hass)return l;let t=this.t,[e,...a]=[...this.snapshot.temp_sets.filter(i=>i.id==="house"),...this.snapshot.temp_sets.filter(i=>i.id!=="house")];return n`
      ${e?this.renderSet(e):l}
      <h3>${t("adv.temps.sets")}</h3>
      <span class="muted">${t("adv.temps.sets_hint")}</span>
      ${a.map(i=>this.renderSet(i))}
      <button class="btn" ?disabled=${this.busy} @click=${this.createSet}>
        <hs-icon .path=${_}></hs-icon>${t("adv.temps.new")}
      </button>
    `}};h("hs-adv-temps",tt);var Tt=[{id:"rooms",label:"adv.rooms"},{id:"temps",label:"adv.temps"},{id:"settings",label:"adv.settings"},{id:"health",label:"adv.health"},{id:"log",label:"adv.log"}],et=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},section:{attribute:!1}}}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .sections {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }
      .sections button {
        flex: none;
        min-height: 48px;
        padding: 0 18px;
        border-radius: 999px;
        border: 2px solid var(--divider-color, #c4c4c4);
        background: var(--card-background-color, #fff);
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      }
      .sections button[aria-current="page"] {
        background: var(--hs-accent, #1565c0);
        border-color: var(--hs-accent, #1565c0);
        color: #fff;
      }
      .dry {
        padding: 12px 16px;
        border-radius: 12px;
        background: var(--warning-color, #e65100);
        color: #fff;
        font-weight: 600;
      }
    `]}navigate(s){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:`/advanced/${s}`,bubbles:!0,composed:!0}))}content(){switch(this.section){case"temps":return n`<hs-adv-temps .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-temps>`;case"settings":return n`<hs-adv-settings .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-settings>`;case"health":return n`<hs-adv-health .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-health>`;case"log":return n`<hs-adv-log .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-log>`;default:return n`<hs-adv-rooms .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-rooms>`}}render(){if(!this.snapshot||!this.hass)return l;let s=f(u(this.hass)),t=Tt.some(e=>e.id===this.section)?this.section:"rooms";return n`
      <div class="sections" role="tablist">
        ${Tt.map(e=>n`<button
            role="tab"
            aria-current=${e.id===t?"page":"false"}
            @click=${()=>this.navigate(e.id)}
          >
            ${s(e.label)}
          </button>`)}
      </div>
      ${this.snapshot.settings.dry_run?n`<div class="dry" role="status">${s("adv.dry_run_banner")}</div>`:l}
      ${this.content()}
    `}};h("hs-advanced-view",et);var st=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1}}}static{this.styles=[m,p`
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
    `]}addRooms(){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/advanced/rooms",bubbles:!0,composed:!0}))}render(){if(!this.snapshot)return l;let s=f(u(this.hass));return n`
      ${this.snapshot.settings.dry_run?n`<div class="dry" role="status">${s("adv.dry_run_banner")}</div>`:l}
      <hs-house-strip .hass=${this.hass} .snapshot=${this.snapshot}></hs-house-strip>
      ${this.snapshot.rooms.length===0?n`<div class="card empty">
            <span>${s("adv.rooms.empty")}</span>
            <button class="btn primary" @click=${this.addRooms}>
              <hs-icon .path=${_}></hs-icon>${s("adv.rooms.add")}
            </button>
          </div>`:n`<div class="rooms">
            ${Et(this.snapshot.rooms,t=>t.id,t=>n`<hs-room-tile
                  .hass=${this.hass}
                  .room=${t}
                  .snapshot=${this.snapshot}
                ></hs-room-tile>`)}
          </div>`}
    `}};h("hs-home-view",st);function Xt(o){let[s,t]=o.split(":").map(Number);return(s??0)*60+(t??0)}function x(o){let s=Math.floor(o/60);return`${String(s).padStart(2,"0")}:${String(o%60).padStart(2,"0")}`}function Pt(o){return Math.round(o/15)*15}function S(o){let s=new Map;for(let a of o)s.set(a.start,a.mode);let t=[...s.entries()].sort((a,i)=>a[0]-i[0]),e=[];for(let[a,i]of t)e.length&&e[e.length-1].mode===i||e.push({start:a,mode:i});return e.length&&e[0].start!==0&&(e[0]={start:0,mode:e[0].mode}),e}function Yt(o){let s=o.map(a=>[...a].sort((i,r)=>i.start-r.start)),t=a=>{for(let i=1;i<=7;i+=1){let r=s[(a-i+7)%7];if(r.length)return r[r.length-1].mode}return null},e=s.map((a,i)=>t(i));return s.map((a,i)=>{if(a.length&&a[0].start===0)return Ct(a);let r=e[i]??a[0]?.mode??"comfort";return Ct([{start:0,mode:r},...a])})}function Ct(o){return S(o)}function H(o){return Yt(o.days.map(s=>s.map(t=>({start:Xt(t.start),mode:t.mode}))))}function Lt(o){return o.map(s=>s.map(t=>({start:x(t.start),mode:t.mode})))}function E(o){return o.map((s,t)=>({index:t,start:s.start,end:o[t+1]?.start??1440,mode:s.mode}))}function at(o,s){let t=E(o);return t.find(e=>s>=e.start&&s<e.end)??t[t.length-1]}function It(o,s,t){return S(o.map((e,a)=>a===s?{...e,mode:t}:e))}function O(o,s,t){if(s<=0||s>=o.length)return o;let e=o[s-1].start+15,a=(o[s+1]?.start??1440)-15,i=Math.min(a,Math.max(e,Pt(t)));return o.map((r,d)=>d===s?{...r,start:i}:r)}function it(o,s){return o.end-o.start<30?null:Math.min(o.end-15,Math.max(o.start+15,Pt(s)))}function Nt(o,s,t){let e=at(o,s),a=it(e,s);if(a===null)return{day:o,index:e.index};let i=[...o.slice(0,e.index+1),{start:a,mode:t},...o.slice(e.index+1)];if(t===e.mode)return{day:i,index:e.index+1};let r=S(i);return{day:r,index:r.findIndex(d=>d.start===a)}}function Rt(o,s){if(o.length<=1||s<0||s>=o.length)return o;if(s===0){let[,t,...e]=o;return S([{start:0,mode:t.mode},...e])}return S(o.filter((t,e)=>e!==s))}function zt(o,s,t){return o.map((e,a)=>t.includes(a)?o[s].map(i=>({...i})):e)}function q(o,s){return o.length===s.length&&o.every((t,e)=>t.start===s[e].start&&t.mode===s[e].mode)}function At(o){switch(o){case"comfort":return"eco";case"night":case"eco":case"away":case"frost":case"off":return"comfort"}}var Ht=[0,1,2,3,4],Ot=[5,6],nt=[0,1,2,3,4,5,6];function V(o){return o/1440*100}var ot=class extends c{constructor(){super();this.moved=!1;this.interactive=!1,this.labels=!1,this.dragIndex=null,this.handleLabel=(t,e)=>e}static{this.properties={day:{attribute:!1},interactive:{type:Boolean},labels:{type:Boolean},handleLabel:{attribute:!1},dragIndex:{state:!0}}}static{this.styles=[m,p`
      :host {
        display: block;
        --bar-height: 36px;
      }
      .bar {
        position: relative;
        height: var(--bar-height);
        border-radius: 10px;
        overflow: visible;
        background: var(--divider-color, #ccc);
      }
      .clip {
        position: absolute;
        inset: 0;
        border-radius: 10px;
        overflow: hidden;
      }
      .seg {
        position: absolute;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #fff;
        font-size: 14px;
        font-weight: 700;
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid rgba(255, 255, 255, 0.85);
        --hs-icon-size: 20px;
      }
      .seg:last-child {
        border-right: none;
      }
      :host([interactive]) .bar {
        cursor: pointer;
      }
      .handle {
        position: absolute;
        top: -10px;
        bottom: -10px;
        width: 48px;
        margin-left: -24px;
        border: none;
        background: transparent;
        padding: 0;
        cursor: ew-resize;
        touch-action: none;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1;
      }
      .grip {
        width: 12px;
        height: calc(100% - 12px);
        border-radius: 6px;
        background: #fff;
        border: 2px solid rgba(0, 0, 0, 0.55);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      }
      .handle:focus-visible .grip,
      .handle.active .grip {
        outline: 3px solid var(--primary-color, #1565c0);
      }
      .tip {
        position: absolute;
        bottom: calc(100% + 14px);
        transform: translateX(-50%);
        padding: 6px 12px;
        border-radius: 10px;
        background: #202124;
        color: #fff;
        font-size: 22px;
        font-weight: 700;
        pointer-events: none;
        white-space: nowrap;
        z-index: 2;
      }
    `]}updated(t){t.has("interactive")&&this.toggleAttribute("interactive",this.interactive)}get bar(){return this.renderRoot.querySelector(".bar")}minuteAt(t){let e=this.bar.getBoundingClientRect();return Math.min(1440,Math.max(0,(t-e.left)/e.width*1440))}emitMove(t,e,a){this.dispatchEvent(new CustomEvent("boundary-move",{detail:{index:t,minute:e,done:a}}))}onPointerDown(t,e){t.preventDefault(),t.stopPropagation(),t.currentTarget.setPointerCapture(t.pointerId),this.dragIndex=e,this.moved=!1}onPointerMove(t){this.dragIndex!==null&&(this.moved=!0,this.emitMove(this.dragIndex,this.minuteAt(t.clientX),!1))}onPointerUp(t){if(this.dragIndex===null)return;let e=this.dragIndex;this.dragIndex=null,this.moved&&this.emitMove(e,this.minuteAt(t.clientX),!0),t.stopPropagation()}onKey(t,e){let a=t.key==="ArrowLeft"?-15:t.key==="ArrowRight"?15:0;a&&(t.preventDefault(),this.emitMove(e,this.day[e].start+a,!0))}onBarClick(t){if(!this.interactive||this.moved){this.moved=!1;return}let e=this.minuteAt(t.clientX),a=E(this.day).find(i=>e>=i.start&&e<i.end);a&&this.dispatchEvent(new CustomEvent("segment-tap",{detail:{index:a.index,minute:e}}))}render(){if(!this.day)return l;let t=E(this.day),e=this.dragIndex!==null?this.day[this.dragIndex]:void 0;return n`
      <div class="bar" @click=${this.onBarClick}>
        <div class="clip">
          ${t.map(a=>{let i=V(a.end-a.start);return n`<div
              class="seg"
              style="left:${V(a.start)}%;width:${i}%;background:${D[a.mode]}"
            >
              ${this.labels&&i>=7?n`<hs-icon .path=${P[a.mode]}></hs-icon>`:l}
              ${this.labels&&i>=17?x(a.start):l}
            </div>`})}
        </div>
        ${this.interactive?t.slice(1).map(a=>n`<button
                class="handle ${this.dragIndex===a.index?"active":""}"
                style="left:${V(a.start)}%"
                aria-label=${this.handleLabel(a.index,x(a.start))}
                @pointerdown=${i=>this.onPointerDown(i,a.index)}
                @pointermove=${this.onPointerMove}
                @pointerup=${this.onPointerUp}
                @pointercancel=${this.onPointerUp}
                @click=${i=>i.stopPropagation()}
                @keydown=${i=>this.onKey(i,a.index)}
              >
                <span class="grip"></span>
              </button>`):l}
        ${e?n`<div class="tip" style="left:${V(e.start)}%">${x(e.start)}</div>`:l}
      </div>
    `}};h("hs-day-bar",ot);var lt=class extends c{static{this.properties={day:{attribute:!1},index:{type:Number},minute:{type:Number},dayName:{},t:{attribute:!1}}}static{this.styles=[m,p`
      .section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }
      .section > span {
        font-weight: 700;
      }
      .modes {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }
      .mode {
        min-height: 60px;
        justify-content: flex-start;
      }
      .mode[aria-pressed="true"] {
        color: #fff;
        border-color: transparent;
      }
      .time {
        display: grid;
        grid-template-columns: 56px 1fr 56px;
        align-items: center;
        gap: 10px;
      }
      .time strong {
        text-align: center;
        font-size: 28px;
        font-variant-numeric: tabular-nums;
      }
      .time .btn {
        padding: 0;
        --hs-icon-size: 28px;
      }
      .times {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}change(s,t=this.index){this.day=s,this.index=Math.max(0,Math.min(t,s.length-1)),this.dispatchEvent(new CustomEvent("day-change",{detail:s}))}setMode(s){let t=this.day[this.index].start,e=It(this.day,this.index,s);this.change(e,at(e,t).index)}moveStart(s){this.change(O(this.day,this.index,this.day[this.index].start+s))}moveEnd(s){let t=this.index+1;this.change(O(this.day,t,this.day[t].start+s))}addChange(s){let t=E(this.day)[this.index],e=Nt(this.day,s,At(t.mode));this.minute=null,this.change(e.day,e.index)}removePart(){this.change(Rt(this.day,this.index),Math.max(0,this.index-1)),this.dialog?.close()}render(){if(!this.day||!this.t)return l;let s=this.t,t=E(this.day)[this.index];if(!t)return l;let e=it(t,this.minute??(t.start+t.end)/2),a=t.index===0,i=t.index===this.day.length-1;return n`
      <hs-dialog
        .heading=${`${this.dayName} ${x(t.start)} \u2013 ${x(t.end)}`}
        .closeLabel=${s("common.close")}
      >
        <div class="section">
          <span>${s("editor.mode")}</span>
          <div class="modes">
            ${Dt.map(r=>n`<button
                class="btn mode"
                aria-pressed=${t.mode===r?"true":"false"}
                style=${t.mode===r?`background:${D[r]}`:""}
                @click=${()=>this.setMode(r)}
              >
                <hs-icon .path=${P[r]} style="color:${t.mode===r?"#fff":D[r]}"></hs-icon>
                ${s(`mode.${r}`)}
              </button>`)}
          </div>
        </div>
        ${a&&i?l:n`<div class="times section">
              ${a?l:n`<div class="section">
                    <span>${s("editor.starts")}</span>
                    <div class="time">
                      <button class="btn" @click=${()=>this.moveStart(-15)} aria-label=${s("editor.earlier")}>
                        <hs-icon .path=${z}></hs-icon>
                      </button>
                      <strong>${x(t.start)}</strong>
                      <button class="btn" @click=${()=>this.moveStart(15)} aria-label=${s("editor.later")}>
                        <hs-icon .path=${A}></hs-icon>
                      </button>
                    </div>
                  </div>`}
              ${i?l:n`<div class="section">
                    <span>${s("editor.ends")}</span>
                    <div class="time">
                      <button class="btn" @click=${()=>this.moveEnd(-15)} aria-label=${s("editor.earlier")}>
                        <hs-icon .path=${z}></hs-icon>
                      </button>
                      <strong>${x(t.end)}</strong>
                      <button class="btn" @click=${()=>this.moveEnd(15)} aria-label=${s("editor.later")}>
                        <hs-icon .path=${A}></hs-icon>
                      </button>
                    </div>
                  </div>`}
            </div>`}
        <div class="actions">
          ${e!==null?n`<button class="btn wide" @click=${()=>this.addChange(e)}>
                <hs-icon .path=${_}></hs-icon>${s("editor.add_change",{time:x(e)})}
              </button>`:l}
          ${this.day.length>1?n`<button class="btn wide danger" @click=${this.removePart}>
                <hs-icon .path=${M}></hs-icon>${s("editor.remove")}
              </button>`:l}
        </div>
        <button slot="actions" class="btn primary" @click=${()=>this.dialog?.close()}>
          ${s("common.close")}
        </button>
      </hs-dialog>
    `}};h("hs-block-sheet",lt);async function Bt(o,s){let t=document.createElement("hs-block-sheet");t.day=s.day,t.index=s.index,t.minute=s.minute,t.dayName=s.dayName,t.t=s.t,t.addEventListener("day-change",a=>s.onChange(a.detail)),(o.shadowRoot??o).appendChild(t),await t.updateComplete;let e=t.dialog;e&&(e.addEventListener("hs-closed",()=>t.remove(),{once:!0}),await e.show())}var dt=class extends c{constructor(){super();this.result=[];this.chosen=new Set}static{this.properties={source:{type:Number},t:{attribute:!1},chosen:{state:!0}}}static{this.styles=[m,p`
      .quick {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 8px;
        margin-bottom: 16px;
      }
      .days {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      label {
        display: flex;
        align-items: center;
        gap: 14px;
        min-height: 52px;
        font-size: 19px;
        padding: 0 6px;
        border-radius: 10px;
        cursor: pointer;
      }
      label.disabled {
        opacity: 0.5;
        cursor: default;
      }
      input {
        width: 28px;
        height: 28px;
        accent-color: var(--hs-accent, #1565c0);
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}pick(t){this.chosen=new Set(t.filter(e=>e!==this.source))}toggle(t,e){let a=new Set(this.chosen);e?a.add(t):a.delete(t),this.chosen=a}copy(){this.result=[...this.chosen].sort(),this.dialog?.close()}render(){if(!this.t)return l;let t=this.t;return n`
      <hs-dialog
        .heading=${t("editor.copy_title",{day:t(`day.${this.source}`)})}
        .closeLabel=${t("common.cancel")}
      >
        <div class="quick">
          <button class="btn small" @click=${()=>this.pick(Ht)}>${t("editor.workdays")}</button>
          <button class="btn small" @click=${()=>this.pick(Ot)}>${t("editor.weekend")}</button>
          <button class="btn small" @click=${()=>this.pick(nt)}>${t("editor.all_days")}</button>
        </div>
        <div class="days">
          ${nt.map(e=>n`<label class=${e===this.source?"disabled":""}>
              <input
                type="checkbox"
                .checked=${e===this.source||this.chosen.has(e)}
                ?disabled=${e===this.source}
                @change=${a=>this.toggle(e,a.target.checked)}
              />
              ${t(`day.${e}`)}
            </label>`)}
        </div>
        <button slot="actions" class="btn" @click=${()=>this.dialog?.close()}>${t("common.cancel")}</button>
        <button slot="actions" class="btn primary" ?disabled=${this.chosen.size===0} @click=${this.copy}>
          <hs-icon .path=${B}></hs-icon>${t("editor.copy")}
        </button>
      </hs-dialog>
    `}};h("hs-copy-dialog",dt);async function Kt(o,s,t){let e=document.createElement("hs-copy-dialog");e.source=s,e.t=t,(o.shadowRoot??o).appendChild(e),await e.updateComplete;let a=e.dialog;return a?new Promise(i=>{a.addEventListener("hs-closed",()=>{e.remove(),i(e.result)},{once:!0}),a.show()}):[]}var Wt=[0,6,12,18,24],pt=class extends c{static{this.properties={days:{attribute:!1},t:{attribute:!1},selected:{type:Number},changed:{attribute:!1},readonly:{type:Boolean},compact:{type:Boolean}}}constructor(){super(),this.selected=-1,this.changed=new Set,this.readonly=!1,this.compact=!1}static{this.styles=[m,p`
      :host {
        display: block;
      }
      .rows {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .day {
        display: grid;
        grid-template-columns: 44px 1fr;
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 48px;
        padding: 4px 6px;
        border: 2px solid transparent;
        border-radius: 12px;
        background: transparent;
        text-align: left;
        cursor: pointer;
      }
      .day[aria-pressed="true"] {
        border-color: var(--primary-color, #1565c0);
        background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
      }
      :host([readonly]) .day {
        cursor: default;
      }
      .label {
        font-size: 17px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--warning-color, #e65100);
      }
      hs-day-bar {
        --bar-height: 32px;
      }
      :host([compact]) .day {
        min-height: 26px;
        padding: 1px 4px;
      }
      :host([compact]) hs-day-bar {
        --bar-height: 16px;
      }
      :host([compact]) .label {
        font-size: 13px;
      }
      .axis {
        display: grid;
        grid-template-columns: 44px 1fr;
        gap: 8px;
        padding: 0 8px;
        font-size: 13px;
      }
      .ticks {
        position: relative;
        height: 18px;
      }
      .ticks span {
        position: absolute;
        transform: translateX(-50%);
      }
      .ticks span:first-child {
        transform: none;
      }
      .ticks span:last-child {
        transform: translateX(-100%);
      }
    `]}select(s){this.readonly||this.dispatchEvent(new CustomEvent("day-select",{detail:s}))}render(){return!this.days||!this.t?l:n`
      <div class="rows" role="group">
        ${this.days.map((s,t)=>n`<button
            class="day"
            aria-pressed=${t===this.selected?"true":"false"}
            aria-label=${this.t(`day.${t}`)}
            ?disabled=${this.readonly}
            @click=${()=>this.select(t)}
          >
            <span class="label">
              ${this.t(`day.short.${t}`)}
              ${this.changed.has(t)?n`<span class="dot" aria-hidden="true"></span>`:l}
            </span>
            <hs-day-bar .day=${s}></hs-day-bar>
          </button>`)}
      </div>
      ${this.compact?l:n`<div class="axis muted" aria-hidden="true">
            <span></span>
            <div class="ticks">
              ${Wt.map(s=>n`<span style="left:${s/24*100}%">${s}</span>`)}
            </div>
          </div>`}
    `}};h("hs-week-view",pt);var ct=class extends c{constructor(){super();this.loadedId=null;this.baseName="";this.original=[];this.days=[],this.name="",this.saving=!1,this.selected=-1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},plan:{attribute:!1},days:{state:!0},name:{state:!0},selected:{state:!0},saving:{state:!0}}}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
      }
      .name {
        flex: 1 1 220px;
      }
      .used {
        font-size: 17px;
      }
      section.card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      h3 {
        font-size: 21px;
      }
      .big {
        --bar-height: 64px;
        margin-top: 44px;
      }
      .axis {
        position: relative;
        height: 20px;
        font-size: 14px;
      }
      .axis span {
        position: absolute;
        transform: translateX(-50%);
      }
      .axis span:first-child {
        transform: none;
      }
      .axis span:last-child {
        transform: translateX(-100%);
      }
      .parts {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .part {
        width: 100%;
        min-height: 60px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border: 2px solid var(--divider-color, #c4c4c4);
        border-radius: 14px;
        background: transparent;
        cursor: pointer;
        font-size: 19px;
        text-align: left;
      }
      .part .time {
        flex: 1;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .footer {
        position: sticky;
        bottom: 0;
        display: flex;
        gap: 12px;
        padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px));
        background: var(--primary-background-color, #fafafa);
        border-top: 1px solid var(--divider-color, #e0e0e0);
        z-index: 3;
      }
      .footer .btn {
        flex: 1;
      }
      .unsaved {
        font-weight: 600;
        color: var(--warning-color, #e65100);
      }
    `]}get t(){return f(u(this.hass))}get dirty(){return this.name.trim()!==this.baseName||this.days.some((t,e)=>!q(S(t),this.original[e]??[]))}willUpdate(t){(this.plan&&this.plan.id!==this.loadedId||t.has("plan")&&this.plan&&!this.dirty)&&this.load()}load(){this.loadedId=this.plan.id,this.baseName=this.plan.name,this.original=H(this.plan),this.days=this.original.map(t=>t.map(e=>({...e}))),this.name=this.plan.name,this.selected<0&&(this.selected=kt(new Date,this.snapshot.time_zone).weekday)}setDay(t,e){this.days=this.days.map((a,i)=>i===t?e:a)}onMove(t){let{index:e,minute:a}=t.detail;this.setDay(this.selected,O(this.days[this.selected],e,a))}openSheet(t,e){let a=this.selected;Bt(this,{day:this.days[a],index:t,minute:e,dayName:this.t(`day.${a}`),t:this.t,onChange:i=>this.setDay(a,i)})}async copyDay(){let t=await Kt(this,this.selected,this.t);t.length&&(this.days=zt(this.days,this.selected,t))}changedDays(){return new Set(this.days.map((t,e)=>q(S(t),this.original[e]??[])?-1:e).filter(t=>t>=0))}roomNames(t){return t.map(e=>this.snapshot.rooms.find(a=>a.id===e)?.name).filter(Boolean).join(", ")}preview(){return this.renderRoot.querySelector("#preview")}changedElsewhere(){let t=H(this.plan);return this.plan.name!==this.baseName||t.some((e,a)=>!q(e,this.original[a]??[]))}async save(){let t=this.preview();if(t?.close(),this.changedElsewhere()&&!await C(this,this.t)){this.load();return}let e=this.name.trim(),a=this.days.map(i=>S(i));this.saving=!0;try{await v(this.hass).call("plan/save",{revision:this.snapshot.revision,plan:{id:this.plan.id,name:e,days:Lt(a)}}),this.baseName=e,this.original=a,y(this,this.t("editor.saved"))}catch(i){y(this,b(i,this.t))}finally{this.saving=!1,t?.close()}}async leave(){if(this.dirty){let t=this.t;if(!await k(this,{heading:t("editor.unsaved"),message:t("editor.discard"),confirm:t("editor.discard_button"),cancel:t("common.back"),danger:!0}))return}this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/plans",bubbles:!0,composed:!0}))}cancel(){if(!this.dirty){this.leave();return}(async()=>{let t=this.t;await k(this,{heading:t("editor.unsaved"),message:t("editor.discard"),confirm:t("editor.discard_button"),cancel:t("common.back"),danger:!0})&&this.load()})()}render(){if(!this.plan||!this.days.length)return l;let t=this.t,e=this.days[this.selected]??this.days[0],a=this.plan.used_by??[],i=this.dirty;return n`
      <div class="head">
        <button class="btn" @click=${this.leave}>
          <hs-icon .path=${ut}></hs-icon>${t("plans.all_plans")}
        </button>
        <label class="field name">
          <span class="sr-only">${t("plans.name")}</span>
          <input
            class="input"
            .value=${this.name}
            maxlength="60"
            aria-label=${t("plans.name")}
            @input=${r=>this.name=r.target.value}
          />
        </label>
      </div>
      <div class="used muted">
        ${a.length?t("plans.used_by",{rooms:this.roomNames(a)}):t("plans.unused")}
      </div>
      <section class="card">
        <span class="muted">${t("editor.tap_day")}</span>
        <hs-week-view
          .days=${this.days}
          .t=${t}
          .selected=${this.selected}
          .changed=${this.changedDays()}
          @day-select=${r=>this.selected=r.detail}
        ></hs-week-view>
      </section>
      <section class="card" aria-live="polite">
        <h3>${t(`day.${this.selected}`)}</h3>
        <span class="muted">${t("editor.drag_hint")}</span>
        <hs-day-bar
          class="big"
          interactive
          labels
          .day=${e}
          .handleLabel=${(r,d)=>`${t("editor.starts")} ${d}`}
          @boundary-move=${this.onMove}
          @segment-tap=${r=>this.openSheet(r.detail.index,r.detail.minute)}
        ></hs-day-bar>
        <div class="axis muted" aria-hidden="true">
          ${[0,6,12,18,24].map(r=>n`<span style="left:${r/24*100}%">${r}:00</span>`)}
        </div>
        <span class="muted">${t("editor.parts")}</span>
        <ul class="parts">
          ${E(e).map(r=>n`<li>
              <button class="part" @click=${()=>this.openSheet(r.index,null)}>
                <span class="time">${x(r.start)} – ${x(r.end)}</span>
                <span class="chip" style="background:${D[r.mode]}">
                  <hs-icon .path=${P[r.mode]}></hs-icon>${t(`mode.${r.mode}`)}
                </span>
                <hs-icon .path=${gt}></hs-icon>
              </button>
            </li>`)}
        </ul>
        <button class="btn" @click=${this.copyDay}>
          <hs-icon .path=${B}></hs-icon>${t("editor.copy_day")}
        </button>
      </section>
      <div class="footer">
        <button class="btn" ?disabled=${!i||this.saving} @click=${this.cancel}>${t("common.cancel")}</button>
        <button class="btn primary" ?disabled=${!i||this.saving} @click=${()=>this.preview()?.show()}>
          ${t("common.save")}
        </button>
      </div>
      <hs-dialog id="preview" wide .heading=${t("editor.preview_title")} .closeLabel=${t("common.back")}>
        <p class="muted">${t("editor.preview_changed")}</p>
        <hs-week-view readonly .days=${this.days} .t=${t} .changed=${this.changedDays()}></hs-week-view>
        <p>
          ${a.length?t("editor.preview_used",{rooms:this.roomNames(a)}):t("editor.preview_unused")}
        </p>
        <button slot="actions" class="btn" @click=${()=>this.preview()?.close()}>${t("common.back")}</button>
        <button slot="actions" class="btn primary" ?disabled=${this.saving} @click=${this.save}>
          ${t("common.save")}
        </button>
      </hs-dialog>
      ${i?n`<span class="unsaved sr-only">${t("editor.unsaved")}</span>`:l}
    `}};h("hs-plan-editor",ct);var ht=class extends c{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},planId:{attribute:!1},newName:{state:!0},newSource:{state:!0},busy:{state:!0}}}constructor(){super(),this.newName="",this.newSource="house",this.busy=!1}static{this.styles=[m,p`
      :host {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h2 {
        font-size: 21px;
      }
      .assign {
        padding: 8px 16px;
      }
      .assign-row {
        display: grid;
        grid-template-columns: minmax(120px, 1fr) minmax(160px, 2fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
        font-size: 18px;
      }
      .assign-row:last-child {
        border-bottom: none;
      }
      @media (max-width: 560px) {
        .assign-row {
          grid-template-columns: 1fr;
        }
      }
      .plans {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr));
        gap: 16px;
      }
      .plan {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .plan h3 {
        font-size: 20px;
      }
      .badge {
        font-size: 14px;
        font-weight: 600;
        padding: 2px 10px;
        border-radius: 999px;
        border: 1px solid var(--divider-color, #c4c4c4);
        margin-left: 8px;
        vertical-align: middle;
      }
      .buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .buttons .btn {
        flex: 1 1 140px;
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    `]}get t(){return f(u(this.hass))}roomNames(s=[]){return s.map(t=>this.snapshot.rooms.find(e=>e.id===t)?.name).filter(Boolean).join(", ")}navigate(s){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:s,bubbles:!0,composed:!0}))}async run(s){this.busy=!0;try{return await s()}catch(t){return y(this,b(t,this.t)),null}finally{this.busy=!1}}sharesPlan(s){return s.plan_id==="house"?!0:(this.snapshot.plans.find(e=>e.id===s.plan_id)?.used_by??[]).length>1}async assign(s,t){await this.run(()=>v(this.hass).call("room/save",{revision:this.snapshot.revision,room:I(s,{plan_id:t})}))}async ownPlan(s){let t=this.snapshot.plans.find(d=>d.id===s.plan_id);if(!t)return;let e=v(this.hass),a=this.snapshot.revision,i=N(s.name,this.snapshot.plans.map(d=>d.name)),r=await this.run(async()=>{let d=await e.call("plan/save",{revision:a,plan:{name:i,days:t.days}});return await e.call("room/save",{revision:d.revision,room:I(s,{plan_id:d.plan_id})}),d.plan_id});r&&this.navigate(`/plans/${r}`)}async deletePlan(s){let t=this.t,e=s.used_by??[];await k(this,{heading:t("common.delete"),message:e.length?t("plans.delete_confirm_used",{name:s.name,rooms:this.roomNames(e)}):t("plans.delete_confirm",{name:s.name}),confirm:t("common.delete"),cancel:t("common.cancel"),danger:!0})&&await this.run(()=>v(this.hass).call("plan/delete",{revision:this.snapshot.revision,plan_id:s.id}))}newDialog(){return this.renderRoot.querySelector("#new")}openNew(){this.newName=N(this.t("plans.new"),this.snapshot.plans.map(s=>s.name)),this.newSource="house",this.newDialog()?.show()}async create(){let s=this.snapshot.plans.find(e=>e.id===this.newSource);if(!s||!this.newName.trim())return;let t=await this.run(()=>v(this.hass).call("plan/save",{revision:this.snapshot.revision,plan:{name:this.newName.trim(),days:s.days}}));this.newDialog()?.close(),t&&this.navigate(`/plans/${t.plan_id}`)}render(){if(!this.snapshot||!this.hass)return l;let s=this.t;if(this.planId){let t=this.snapshot.plans.find(e=>e.id===this.planId);if(t)return n`<hs-plan-editor .hass=${this.hass} .snapshot=${this.snapshot} .plan=${t}></hs-plan-editor>`}return n`
      <section>
        <h2>${s("nav.plans")}</h2>
        <div class="plans">
          ${this.snapshot.plans.map(t=>n`<article class="card plan">
              <h3>
                ${t.name}${t.id==="house"?n`<span class="badge">${s("plans.house_badge")}</span>`:l}
              </h3>
              <span class="muted">
                ${t.used_by?.length?s("plans.used_by",{rooms:this.roomNames(t.used_by)}):s("plans.unused")}
              </span>
              <hs-week-view compact readonly .days=${H(t)} .t=${s}></hs-week-view>
              <div class="buttons">
                <button class="btn" @click=${()=>this.navigate(`/plans/${t.id}`)}>
                  <hs-icon .path=${K}></hs-icon>${s("plans.edit")}
                </button>
                ${t.id==="house"?l:n`<button class="btn danger" ?disabled=${this.busy} @click=${()=>this.deletePlan(t)}>
                      <hs-icon .path=${M}></hs-icon>${s("common.delete")}
                    </button>`}
              </div>
            </article>`)}
        </div>
        <button class="btn primary" @click=${this.openNew}>
          <hs-icon .path=${_}></hs-icon>${s("plans.new")}
        </button>
      </section>
      ${this.snapshot.rooms.length?n`<section>
            <h2>${s("plans.rooms_title")}</h2>
            <div class="card assign">
              ${this.snapshot.rooms.map(t=>n`<div class="assign-row">
                  <strong>${t.name}</strong>
                  <select
                    class="input"
                    aria-label=${`${t.name}: ${s("adv.rooms.plan")}`}
                    ?disabled=${this.busy}
                    @change=${e=>this.assign(t,e.target.value)}
                  >
                    ${this.snapshot.plans.map(e=>n`<option value=${e.id} ?selected=${e.id===t.plan_id}>${e.name}</option>`)}
                  </select>
                  ${this.sharesPlan(t)?n`<button class="btn small" ?disabled=${this.busy} @click=${()=>this.ownPlan(t)}>
                        ${s("plans.own_plan")}
                      </button>`:n`<span></span>`}
                </div>`)}
            </div>
          </section>`:l}
      <hs-dialog id="new" .heading=${s("plans.new")} .closeLabel=${s("common.cancel")}>
        <div class="form">
          <label class="field">
            <span>${s("plans.name")}</span>
            <input
              class="input"
              maxlength="60"
              .value=${this.newName}
              @input=${t=>this.newName=t.target.value}
            />
          </label>
          <label class="field">
            <span>${s("plans.start_from")}</span>
            <select class="input" @change=${t=>this.newSource=t.target.value}>
              ${this.snapshot.plans.map(t=>n`<option value=${t.id} ?selected=${t.id===this.newSource}>${t.name}</option>`)}
            </select>
          </label>
        </div>
        <button slot="actions" class="btn" @click=${()=>this.newDialog()?.close()}>${s("common.cancel")}</button>
        <button slot="actions" class="btn primary" ?disabled=${this.busy||!this.newName.trim()} @click=${this.create}>
          ${s("plans.create")}
        </button>
      </hs-dialog>
    `}};h("hs-plans-view",ht);var Jt=[{tab:"home",path:"",icon:wt,label:"nav.home"},{tab:"plans",path:"/plans",icon:ft,label:"nav.plans"},{tab:"advanced",path:"/advanced",icon:$t,label:"nav.advanced"}],mt=class extends c{constructor(){super();this.unsubscribe=null;this.timers=[];this.clock=null;this.messageTimer=null;this.snapshot=null,this.waitedTooLong=!1,this.message="",this.tick=0,this.addEventListener("hs-toast",t=>this.showMessage(t.detail)),this.addEventListener("hs-navigate",t=>this.navigate(t.detail))}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1},snapshot:{state:!0},waitedTooLong:{state:!0},message:{state:!0},tick:{state:!0}}}static{this.styles=[m,p`
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
    `]}connectedCallback(){super.connectedCallback(),this.clock=setInterval(()=>this.tick+=1,3e4),this.hass&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null,this.clock&&clearInterval(this.clock);for(let t of this.timers)clearTimeout(t);this.timers=[]}willUpdate(t){t.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe()}subscribe(){this.unsubscribe=v(this.hass).subscribe(t=>{this.snapshot=t}),this.timers.push(setTimeout(()=>this.waitedTooLong=this.snapshot===null,8e3))}showMessage(t){this.message=t,this.messageTimer&&clearTimeout(this.messageTimer),this.messageTimer=setTimeout(()=>this.message="",6e3)}navigate(t){let e=this.route?.prefix??"/heating-scheduler";history.pushState(null,"",`${e}${t}`),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}toggleMenu(){this.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:!0,composed:!0}))}get path(){return this.route?.path??""}get tab(){return this.path.startsWith("/plans")?"plans":this.path.startsWith("/advanced")?"advanced":"home"}view(){let t=f(u(this.hass));if(!this.snapshot)return n`<div class="status">${this.waitedTooLong?t("common.not_loaded"):t("common.loading")}</div>`;let e=this.path.split("/").filter(Boolean);switch(this.tab){case"plans":return n`<hs-plans-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .planId=${e[1]??null}
        ></hs-plans-view>`;case"advanced":return n`<hs-advanced-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .section=${e[1]??"rooms"}
        ></hs-advanced-view>`;default:return n`<hs-home-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-home-view>`}}render(){if(!this.hass)return l;let t=f(u(this.hass)),e=this.tab;return n`
      <header class="toolbar">
        ${this.narrow?n`<button class="icon-button" @click=${this.toggleMenu} aria-label=${t("nav.menu")}>
              <hs-icon .path=${xt}></hs-icon>
            </button>`:l}
        <h1>${t("app.title")}</h1>
      </header>
      <nav>
        ${Jt.map(a=>n`<button
            aria-current=${a.tab===e?"page":"false"}
            @click=${()=>this.navigate(a.path)}
          >
            <hs-icon .path=${a.icon}></hs-icon>${t(a.label)}
          </button>`)}
      </nav>
      <main data-tick=${this.tick}>${this.view()}</main>
      ${this.message?n`<div class="toast" role="alert">${this.message}</div>`:l}
    `}};h("heating-scheduler-panel",mt);export{mt as HeatingSchedulerPanel};
