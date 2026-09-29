import{A as et,B as S,a as h,b as n,c as l,d,e as W,f as F,g as V,h as M,i as _,j as Z,k as L,l as G,m as N,n as w,o as J,p as Q,q as p,r as c,s as b,t as f,u as tt,v as x,w as k,x as v,y as P,z as D}from"./chunks/chunk-PK2CBGYI.js";var A=class extends d{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},section:{attribute:!1}}}static{this.styles=[c]}render(){return l??n``}};p("hs-advanced-view",A);var I=class extends d{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1}}}static{this.styles=[c,h`
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
    `]}addRooms(){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/advanced/rooms",bubbles:!0,composed:!0}))}render(){if(!this.snapshot)return l;let s=f(b(this.hass));return n`
      ${this.snapshot.settings.dry_run?n`<div class="dry" role="status">${s("adv.dry_run_banner")}</div>`:l}
      <hs-house-strip .hass=${this.hass} .snapshot=${this.snapshot}></hs-house-strip>
      ${this.snapshot.rooms.length===0?n`<div class="card empty">
            <span>${s("adv.rooms.empty")}</span>
            <button class="btn primary" @click=${this.addRooms}>
              <hs-icon .path=${w}></hs-icon>${s("adv.rooms.add")}
            </button>
          </div>`:n`<div class="rooms">
            ${this.snapshot.rooms.map(t=>n`<hs-room-tile
                  .hass=${this.hass}
                  .room=${t}
                  .snapshot=${this.snapshot}
                ></hs-room-tile>`)}
          </div>`}
    `}};p("hs-home-view",I);function bt(i){let[s,t]=i.split(":").map(Number);return(s??0)*60+(t??0)}function m(i){let s=Math.floor(i/60);return`${String(s).padStart(2,"0")}:${String(i%60).padStart(2,"0")}`}function at(i){return Math.round(i/15)*15}function g(i){let s=new Map;for(let a of i)s.set(a.start,a.mode);let t=[...s.entries()].sort((a,r)=>a[0]-r[0]),e=[];for(let[a,r]of t)e.length&&e[e.length-1].mode===r||e.push({start:a,mode:r});return e.length&&e[0].start!==0&&(e[0]={start:0,mode:e[0].mode}),e}function ft(i){let s=i.map(a=>[...a].sort((r,o)=>r.start-o.start)),t=a=>{for(let r=1;r<=7;r+=1){let o=s[(a-r+7)%7];if(o.length)return o[o.length-1].mode}return null},e=s.map((a,r)=>t(r));return s.map((a,r)=>{if(a.length&&a[0].start===0)return st(a);let o=e[r]??a[0]?.mode??"comfort";return st([{start:0,mode:o},...a])})}function st(i){return g(i)}function T(i){return ft(i.days.map(s=>s.map(t=>({start:bt(t.start),mode:t.mode}))))}function it(i){return i.map(s=>s.map(t=>({start:m(t.start),mode:t.mode})))}function y(i){return i.map((s,t)=>({index:t,start:s.start,end:i[t+1]?.start??1440,mode:s.mode}))}function vt(i,s){let t=y(i);return t.find(e=>s>=e.start&&s<e.end)??t[t.length-1]}function nt(i,s,t){return g(i.map((e,a)=>a===s?{...e,mode:t}:e))}function E(i,s,t){if(s<=0||s>=i.length)return i;let e=i[s-1].start+15,a=(i[s+1]?.start??1440)-15,r=Math.min(a,Math.max(e,at(t)));return i.map((o,u)=>u===s?{...o,start:r}:o)}function z(i,s){return i.end-i.start<30?null:Math.min(i.end-15,Math.max(i.start+15,at(s)))}function rt(i,s,t){let e=vt(i,s),a=z(e,s);if(a===null)return{day:i,index:e.index};let r=[...i.slice(0,e.index+1),{start:a,mode:t},...i.slice(e.index+1)];if(t===e.mode)return{day:r,index:e.index+1};let o=g(r);return{day:o,index:o.findIndex(u=>u.start===a)}}function ot(i,s){if(i.length<=1||s<0||s>=i.length)return i;if(s===0){let[,t,...e]=i;return g([{start:0,mode:t.mode},...e])}return g(i.filter((t,e)=>e!==s))}function lt(i,s,t){return i.map((e,a)=>t.includes(a)?i[s].map(r=>({...r})):e)}function R(i,s){return i.length===s.length&&i.every((t,e)=>t.start===s[e].start&&t.mode===s[e].mode)}function dt(i){switch(i){case"comfort":return"eco";case"night":case"eco":case"away":case"frost":case"off":return"comfort"}}var pt=[0,1,2,3,4],ct=[5,6],H=[0,1,2,3,4,5,6];function C(i){return i/1440*100}var B=class extends d{constructor(){super();this.moved=!1;this.interactive=!1,this.labels=!1,this.dragIndex=null,this.handleLabel=(t,e)=>e}static{this.properties={day:{attribute:!1},interactive:{type:Boolean},labels:{type:Boolean},handleLabel:{attribute:!1},dragIndex:{state:!0}}}static{this.styles=[c,h`
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
    `]}updated(t){t.has("interactive")&&this.toggleAttribute("interactive",this.interactive)}get bar(){return this.renderRoot.querySelector(".bar")}minuteAt(t){let e=this.bar.getBoundingClientRect();return Math.min(1440,Math.max(0,(t-e.left)/e.width*1440))}emitMove(t,e,a){this.dispatchEvent(new CustomEvent("boundary-move",{detail:{index:t,minute:e,done:a}}))}onPointerDown(t,e){t.preventDefault(),t.stopPropagation(),t.currentTarget.setPointerCapture(t.pointerId),this.dragIndex=e,this.moved=!1}onPointerMove(t){this.dragIndex!==null&&(this.moved=!0,this.emitMove(this.dragIndex,this.minuteAt(t.clientX),!1))}onPointerUp(t){if(this.dragIndex===null)return;let e=this.dragIndex;this.dragIndex=null,this.moved&&this.emitMove(e,this.minuteAt(t.clientX),!0),t.stopPropagation()}onKey(t,e){let a=t.key==="ArrowLeft"?-15:t.key==="ArrowRight"?15:0;a&&(t.preventDefault(),this.emitMove(e,this.day[e].start+a,!0))}onBarClick(t){if(!this.interactive||this.moved){this.moved=!1;return}let e=this.minuteAt(t.clientX),a=y(this.day).find(r=>e>=r.start&&e<r.end);a&&this.dispatchEvent(new CustomEvent("segment-tap",{detail:{index:a.index,minute:e}}))}render(){if(!this.day)return l;let t=y(this.day),e=this.dragIndex!==null?this.day[this.dragIndex]:void 0;return n`
      <div class="bar" @click=${this.onBarClick}>
        <div class="clip">
          ${t.map(a=>{let r=C(a.end-a.start);return n`<div
              class="seg"
              style="left:${C(a.start)}%;width:${r}%;background:${x[a.mode]}"
            >
              ${this.labels&&r>=7?n`<hs-icon .path=${k[a.mode]}></hs-icon>`:l}
              ${this.labels&&r>=17?m(a.start):l}
            </div>`})}
        </div>
        ${this.interactive?t.slice(1).map(a=>n`<button
                class="handle ${this.dragIndex===a.index?"active":""}"
                style="left:${C(a.start)}%"
                aria-label=${this.handleLabel(a.index,m(a.start))}
                @pointerdown=${r=>this.onPointerDown(r,a.index)}
                @pointermove=${this.onPointerMove}
                @pointerup=${this.onPointerUp}
                @pointercancel=${this.onPointerUp}
                @click=${r=>r.stopPropagation()}
                @keydown=${r=>this.onKey(r,a.index)}
              >
                <span class="grip"></span>
              </button>`):l}
        ${e?n`<div class="tip" style="left:${C(e.start)}%">${m(e.start)}</div>`:l}
      </div>
    `}};p("hs-day-bar",B);var K=class extends d{static{this.properties={day:{attribute:!1},index:{type:Number},minute:{type:Number},dayName:{},t:{attribute:!1}}}static{this.styles=[c,h`
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
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}change(s,t=this.index){this.day=s,this.index=Math.max(0,Math.min(t,s.length-1)),this.dispatchEvent(new CustomEvent("day-change",{detail:s}))}setMode(s){let t=this.day[this.index].start,e=nt(this.day,this.index,s);this.change(e,Math.max(0,e.findIndex(a=>a.start>=t)))}moveStart(s){this.change(E(this.day,this.index,this.day[this.index].start+s))}moveEnd(s){let t=this.index+1;this.change(E(this.day,t,this.day[t].start+s))}addChange(s){let t=y(this.day)[this.index],e=rt(this.day,s,dt(t.mode));this.minute=null,this.change(e.day,e.index)}removePart(){this.change(ot(this.day,this.index),Math.max(0,this.index-1)),this.dialog?.close()}render(){if(!this.day||!this.t)return l;let s=this.t,t=y(this.day)[this.index];if(!t)return l;let e=z(t,this.minute??(t.start+t.end)/2),a=t.index===0,r=t.index===this.day.length-1;return n`
      <hs-dialog
        .heading=${`${this.dayName} ${m(t.start)} \u2013 ${m(t.end)}`}
        .closeLabel=${s("common.close")}
      >
        <div class="section">
          <span>${s("editor.mode")}</span>
          <div class="modes">
            ${et.map(o=>n`<button
                class="btn mode"
                aria-pressed=${t.mode===o?"true":"false"}
                style=${t.mode===o?`background:${x[o]}`:""}
                @click=${()=>this.setMode(o)}
              >
                <hs-icon .path=${k[o]} style="color:${t.mode===o?"#fff":x[o]}"></hs-icon>
                ${s(`mode.${o}`)}
              </button>`)}
          </div>
        </div>
        ${a&&r?l:n`<div class="times section">
              ${a?l:n`<div class="section">
                    <span>${s("editor.starts")}</span>
                    <div class="time">
                      <button class="btn" @click=${()=>this.moveStart(-15)} aria-label=${s("editor.earlier")}>
                        <hs-icon .path=${L}></hs-icon>
                      </button>
                      <strong>${m(t.start)}</strong>
                      <button class="btn" @click=${()=>this.moveStart(15)} aria-label=${s("editor.later")}>
                        <hs-icon .path=${N}></hs-icon>
                      </button>
                    </div>
                  </div>`}
              ${r?l:n`<div class="section">
                    <span>${s("editor.ends")}</span>
                    <div class="time">
                      <button class="btn" @click=${()=>this.moveEnd(-15)} aria-label=${s("editor.earlier")}>
                        <hs-icon .path=${L}></hs-icon>
                      </button>
                      <strong>${m(t.end)}</strong>
                      <button class="btn" @click=${()=>this.moveEnd(15)} aria-label=${s("editor.later")}>
                        <hs-icon .path=${N}></hs-icon>
                      </button>
                    </div>
                  </div>`}
            </div>`}
        <div class="actions">
          ${e!==null?n`<button class="btn wide" @click=${()=>this.addChange(e)}>
                <hs-icon .path=${w}></hs-icon>${s("editor.add_change",{time:m(e)})}
              </button>`:l}
          ${this.day.length>1?n`<button class="btn wide danger" @click=${this.removePart}>
                <hs-icon .path=${_}></hs-icon>${s("editor.remove")}
              </button>`:l}
        </div>
        <button slot="actions" class="btn primary" @click=${()=>this.dialog?.close()}>
          ${s("common.close")}
        </button>
      </hs-dialog>
    `}};p("hs-block-sheet",K);async function ht(i,s){let t=document.createElement("hs-block-sheet");t.day=s.day,t.index=s.index,t.minute=s.minute,t.dayName=s.dayName,t.t=s.t,t.addEventListener("day-change",a=>s.onChange(a.detail)),(i.shadowRoot??i).appendChild(t),await t.updateComplete;let e=t.dialog;e&&(e.addEventListener("hs-closed",()=>t.remove(),{once:!0}),await e.show())}var X=class extends d{constructor(){super();this.result=[];this.chosen=new Set}static{this.properties={source:{type:Number},t:{attribute:!1},chosen:{state:!0}}}static{this.styles=[c,h`
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
          <button class="btn small" @click=${()=>this.pick(pt)}>${t("editor.workdays")}</button>
          <button class="btn small" @click=${()=>this.pick(ct)}>${t("editor.weekend")}</button>
          <button class="btn small" @click=${()=>this.pick(H)}>${t("editor.all_days")}</button>
        </div>
        <div class="days">
          ${H.map(e=>n`<label class=${e===this.source?"disabled":""}>
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
          <hs-icon .path=${M}></hs-icon>${t("editor.copy")}
        </button>
      </hs-dialog>
    `}};p("hs-copy-dialog",X);async function mt(i,s,t){let e=document.createElement("hs-copy-dialog");e.source=s,e.t=t,(i.shadowRoot??i).appendChild(e),await e.updateComplete;let a=e.dialog;return a?new Promise(r=>{a.addEventListener("hs-closed",()=>{e.remove(),r(e.result)},{once:!0}),a.show()}):[]}var yt=[0,6,12,18,24],U=class extends d{static{this.properties={days:{attribute:!1},t:{attribute:!1},selected:{type:Number},changed:{attribute:!1},readonly:{type:Boolean},compact:{type:Boolean}}}constructor(){super(),this.selected=-1,this.changed=new Set,this.readonly=!1,this.compact=!1}static{this.styles=[c,h`
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
              ${yt.map(s=>n`<span style="left:${s/24*100}%">${s}</span>`)}
            </div>
          </div>`}
    `}};p("hs-week-view",U);var q=class extends d{constructor(){super();this.loadedId=null;this.original=[];this.days=[],this.name="",this.saving=!1,this.selected=-1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},plan:{attribute:!1},days:{state:!0},name:{state:!0},selected:{state:!0},saving:{state:!0}}}static{this.styles=[c,h`
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
    `]}get t(){return f(b(this.hass))}get dirty(){return this.name.trim()!==this.plan.name||this.days.some((t,e)=>!R(g(t),this.original[e]??[]))}willUpdate(t){(this.plan&&this.plan.id!==this.loadedId||t.has("plan")&&this.plan&&!this.dirty)&&this.load()}load(){this.loadedId=this.plan.id,this.original=T(this.plan),this.days=this.original.map(t=>t.map(e=>({...e}))),this.name=this.plan.name,this.selected<0&&(this.selected=tt(new Date,this.snapshot.time_zone).weekday)}setDay(t,e){this.days=this.days.map((a,r)=>r===t?e:a)}onMove(t){let{index:e,minute:a}=t.detail;this.setDay(this.selected,E(this.days[this.selected],e,a))}openSheet(t,e){let a=this.selected;ht(this,{day:this.days[a],index:t,minute:e,dayName:this.t(`day.${a}`),t:this.t,onChange:r=>this.setDay(a,r)})}async copyDay(){let t=await mt(this,this.selected,this.t);t.length&&(this.days=lt(this.days,this.selected,t))}changedDays(){return new Set(this.days.map((t,e)=>R(g(t),this.original[e]??[])?-1:e).filter(t=>t>=0))}roomNames(t){return t.map(e=>this.snapshot.rooms.find(a=>a.id===e)?.name).filter(Boolean).join(", ")}preview(){return this.renderRoot.querySelector("#preview")}async save(){let t=this.preview();this.preview()?.close(),this.saving=!0;try{await v(this.hass).call("plan/save",{revision:this.snapshot.revision,plan:{id:this.plan.id,name:this.name.trim(),days:it(this.days.map(e=>g(e)))}}),this.original=this.days.map(e=>g(e)),this.days=this.original.map(e=>e.map(a=>({...a}))),D(this,this.t("editor.saved"))}catch(e){D(this,P(e,this.t))}finally{this.saving=!1,t?.close()}}async leave(){if(this.dirty){let t=this.t;if(!await S(this,{heading:t("editor.unsaved"),message:t("editor.discard"),confirm:t("editor.discard_button"),cancel:t("common.back"),danger:!0}))return}this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/plans",bubbles:!0,composed:!0}))}cancel(){if(!this.dirty){this.leave();return}(async()=>{let t=this.t;await S(this,{heading:t("editor.unsaved"),message:t("editor.discard"),confirm:t("editor.discard_button"),cancel:t("common.back"),danger:!0})&&this.load()})()}render(){if(!this.plan||!this.days.length)return l;let t=this.t,e=this.days[this.selected]??this.days[0],a=this.plan.used_by??[],r=this.dirty;return n`
      <div class="head">
        <button class="btn" @click=${this.leave}>
          <hs-icon .path=${W}></hs-icon>${t("plans.all_plans")}
        </button>
        <label class="field name">
          <span class="sr-only">${t("plans.name")}</span>
          <input
            class="input"
            .value=${this.name}
            maxlength="60"
            aria-label=${t("plans.name")}
            @input=${o=>this.name=o.target.value}
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
          @day-select=${o=>this.selected=o.detail}
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
          .handleLabel=${(o,u)=>`${t("editor.starts")} ${u}`}
          @boundary-move=${this.onMove}
          @segment-tap=${o=>this.openSheet(o.detail.index,o.detail.minute)}
        ></hs-day-bar>
        <div class="axis muted" aria-hidden="true">
          ${[0,6,12,18,24].map(o=>n`<span style="left:${o/24*100}%">${o}:00</span>`)}
        </div>
        <span class="muted">${t("editor.parts")}</span>
        <ul class="parts">
          ${y(e).map(o=>n`<li>
              <button class="part" @click=${()=>this.openSheet(o.index,null)}>
                <span class="time">${m(o.start)} – ${m(o.end)}</span>
                <span class="chip" style="background:${x[o.mode]}">
                  <hs-icon .path=${k[o.mode]}></hs-icon>${t(`mode.${o.mode}`)}
                </span>
                <hs-icon .path=${V}></hs-icon>
              </button>
            </li>`)}
        </ul>
        <button class="btn" @click=${this.copyDay}>
          <hs-icon .path=${M}></hs-icon>${t("editor.copy_day")}
        </button>
      </section>
      <div class="footer">
        <button class="btn" ?disabled=${!r||this.saving} @click=${this.cancel}>${t("common.cancel")}</button>
        <button class="btn primary" ?disabled=${!r||this.saving} @click=${()=>this.preview()?.show()}>
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
      ${r?n`<span class="unsaved sr-only">${t("editor.unsaved")}</span>`:l}
    `}};p("hs-plan-editor",q);function ut(i,s={}){let t={...i,...s};return{id:t.id,name:t.name,trvs:t.trvs,plan_id:t.plan_id,temp_set_id:t.temp_set_id,temperature_entity:t.temperature_entity,area_id:t.area_id}}function gt(i,s){let t=new Set(s.map(e=>e.trim().toLowerCase()));if(!t.has(i.trim().toLowerCase()))return i;for(let e=2;;e+=1){let a=`${i} ${e}`;if(!t.has(a.toLowerCase()))return a}}var Y=class extends d{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},planId:{attribute:!1},newName:{state:!0},newSource:{state:!0},busy:{state:!0}}}constructor(){super(),this.newName="",this.newSource="house",this.busy=!1}static{this.styles=[c,h`
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
    `]}get t(){return f(b(this.hass))}roomNames(s=[]){return s.map(t=>this.snapshot.rooms.find(e=>e.id===t)?.name).filter(Boolean).join(", ")}navigate(s){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:s,bubbles:!0,composed:!0}))}async run(s){this.busy=!0;try{return await s()}catch(t){return D(this,P(t,this.t)),null}finally{this.busy=!1}}sharesPlan(s){return s.plan_id==="house"?!0:(this.snapshot.plans.find(e=>e.id===s.plan_id)?.used_by??[]).length>1}async assign(s,t){await this.run(()=>v(this.hass).call("room/save",{revision:this.snapshot.revision,room:ut(s,{plan_id:t})}))}async ownPlan(s){let t=this.snapshot.plans.find(u=>u.id===s.plan_id);if(!t)return;let e=v(this.hass),a=this.snapshot.revision,r=gt(s.name,this.snapshot.plans.map(u=>u.name)),o=await this.run(async()=>{let u=await e.call("plan/save",{revision:a,plan:{name:r,days:t.days}});return await e.call("room/save",{revision:a+1,room:ut(s,{plan_id:u.plan_id})}),u.plan_id});o&&this.navigate(`/plans/${o}`)}async deletePlan(s){let t=this.t,e=s.used_by??[];await S(this,{heading:t("common.delete"),message:e.length?t("plans.delete_confirm_used",{name:s.name,rooms:this.roomNames(e)}):t("plans.delete_confirm",{name:s.name}),confirm:t("common.delete"),cancel:t("common.cancel"),danger:!0})&&await this.run(()=>v(this.hass).call("plan/delete",{revision:this.snapshot.revision,plan_id:s.id}))}newDialog(){return this.renderRoot.querySelector("#new")}openNew(){this.newName=gt(this.t("plans.new"),this.snapshot.plans.map(s=>s.name)),this.newSource="house",this.newDialog()?.show()}async create(){let s=this.snapshot.plans.find(e=>e.id===this.newSource);if(!s||!this.newName.trim())return;let t=await this.run(()=>v(this.hass).call("plan/save",{revision:this.snapshot.revision,plan:{name:this.newName.trim(),days:s.days}}));this.newDialog()?.close(),t&&this.navigate(`/plans/${t.plan_id}`)}render(){if(!this.snapshot||!this.hass)return l;let s=this.t;if(this.planId){let t=this.snapshot.plans.find(e=>e.id===this.planId);if(t)return n`<hs-plan-editor .hass=${this.hass} .snapshot=${this.snapshot} .plan=${t}></hs-plan-editor>`}return n`
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
              <hs-week-view compact readonly .days=${T(t)} .t=${s}></hs-week-view>
              <div class="buttons">
                <button class="btn" @click=${()=>this.navigate(`/plans/${t.id}`)}>
                  <hs-icon .path=${G}></hs-icon>${s("plans.edit")}
                </button>
                ${t.id==="house"?l:n`<button class="btn danger" ?disabled=${this.busy} @click=${()=>this.deletePlan(t)}>
                      <hs-icon .path=${_}></hs-icon>${s("common.delete")}
                    </button>`}
              </div>
            </article>`)}
        </div>
        <button class="btn primary" @click=${this.openNew}>
          <hs-icon .path=${w}></hs-icon>${s("plans.new")}
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
    `}};p("hs-plans-view",Y);var xt=[{tab:"home",path:"",icon:Q,label:"nav.home"},{tab:"plans",path:"/plans",icon:F,label:"nav.plans"},{tab:"advanced",path:"/advanced",icon:J,label:"nav.advanced"}],j=class extends d{constructor(){super();this.unsubscribe=null;this.timers=[];this.clock=null;this.messageTimer=null;this.snapshot=null,this.waitedTooLong=!1,this.message="",this.tick=0,this.addEventListener("hs-toast",t=>this.showMessage(t.detail)),this.addEventListener("hs-navigate",t=>this.navigate(t.detail))}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1},snapshot:{state:!0},waitedTooLong:{state:!0},message:{state:!0},tick:{state:!0}}}static{this.styles=[c,h`
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
    `]}connectedCallback(){super.connectedCallback(),this.clock=setInterval(()=>this.tick+=1,3e4),this.hass&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null,this.clock&&clearInterval(this.clock);for(let t of this.timers)clearTimeout(t);this.timers=[]}willUpdate(t){t.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe()}subscribe(){this.unsubscribe=v(this.hass).subscribe(t=>{this.snapshot=t}),this.timers.push(setTimeout(()=>this.waitedTooLong=this.snapshot===null,8e3))}showMessage(t){this.message=t,this.messageTimer&&clearTimeout(this.messageTimer),this.messageTimer=setTimeout(()=>this.message="",6e3)}navigate(t){let e=this.route?.prefix??"/heating-scheduler";history.pushState(null,"",`${e}${t}`),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}toggleMenu(){this.dispatchEvent(new CustomEvent("hass-toggle-menu",{bubbles:!0,composed:!0}))}get path(){return this.route?.path??""}get tab(){return this.path.startsWith("/plans")?"plans":this.path.startsWith("/advanced")?"advanced":"home"}view(){let t=f(b(this.hass));if(!this.snapshot)return n`<div class="status">${this.waitedTooLong?t("common.not_loaded"):t("common.loading")}</div>`;let e=this.path.split("/").filter(Boolean);switch(this.tab){case"plans":return n`<hs-plans-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .planId=${e[1]??null}
        ></hs-plans-view>`;case"advanced":return n`<hs-advanced-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .section=${e[1]??"rooms"}
        ></hs-advanced-view>`;default:return n`<hs-home-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-home-view>`}}render(){if(!this.hass)return l;let t=f(b(this.hass)),e=this.tab;return n`
      <header class="toolbar">
        ${this.narrow?n`<button class="icon-button" @click=${this.toggleMenu} aria-label=${t("nav.menu")}>
              <hs-icon .path=${Z}></hs-icon>
            </button>`:l}
        <h1>${t("app.title")}</h1>
      </header>
      <nav>
        ${xt.map(a=>n`<button
            aria-current=${a.tab===e?"page":"false"}
            @click=${()=>this.navigate(a.path)}
          >
            <hs-icon .path=${a.icon}></hs-icon>${t(a.label)}
          </button>`)}
      </nav>
      <main data-tick=${this.tick}>${this.view()}</main>
      ${this.message?n`<div class="toast" role="alert">${this.message}</div>`:l}
    `}};p("heating-scheduler-panel",j);export{j as HeatingSchedulerPanel};
