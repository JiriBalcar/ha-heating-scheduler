var C1=globalThis,H1=C1.ShadowRoot&&(C1.ShadyCSS===void 0||C1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,x1=Symbol(),E1=new WeakMap,z=class{constructor(C,H,V){if(this._$cssResult$=!0,V!==x1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=C,this.t=H}get styleSheet(){let C=this.o,H=this.t;if(H1&&C===void 0){let V=H!==void 0&&H.length===1;V&&(C=E1.get(H)),C===void 0&&((this.o=C=new CSSStyleSheet).replaceSync(this.cssText),V&&E1.set(H,C))}return C}toString(){return this.cssText}},U=L=>new z(typeof L=="string"?L:L+"",void 0,x1),x=(L,...C)=>{let H=L.length===1?L[0]:C.reduce((V,M,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(M)+L[r+1],L[0]);return new z(H,L,x1)},_1=(L,C)=>{if(H1)L.adoptedStyleSheets=C.map(H=>H instanceof CSSStyleSheet?H:H.styleSheet);else for(let H of C){let V=document.createElement("style"),M=C1.litNonce;M!==void 0&&V.setAttribute("nonce",M),V.textContent=H.cssText,L.appendChild(V)}},Z1=H1?L=>L:L=>L instanceof CSSStyleSheet?(C=>{let H="";for(let V of C.cssRules)H+=V.cssText;return U(H)})(L):L;var{is:I2,defineProperty:z2,getOwnPropertyDescriptor:U2,getOwnPropertyNames:Q2,getOwnPropertySymbols:G2,getPrototypeOf:K2}=Object,V1=globalThis,N1=V1.trustedTypes,j2=N1?N1.emptyScript:"",q2=V1.reactiveElementPolyfillSupport,Q=(L,C)=>L,s1={toAttribute(L,C){switch(C){case Boolean:L=L?j2:null;break;case Object:case Array:L=L==null?L:JSON.stringify(L)}return L},fromAttribute(L,C){let H=L;switch(C){case Boolean:H=L!==null;break;case Number:H=L===null?null:Number(L);break;case Object:case Array:try{H=JSON.parse(L)}catch{H=null}}return H}},$1=(L,C)=>!I2(L,C),W1={attribute:!0,type:String,converter:s1,reflect:!1,useDefault:!1,hasChanged:$1};Symbol.metadata??=Symbol("metadata"),V1.litPropertyMetadata??=new WeakMap;var g=class extends HTMLElement{static addInitializer(C){this._$Ei(),(this.l??=[]).push(C)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(C,H=W1){if(H.state&&(H.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(C)&&((H=Object.create(H)).wrapped=!0),this.elementProperties.set(C,H),!H.noAccessor){let V=Symbol(),M=this.getPropertyDescriptor(C,V,H);M!==void 0&&z2(this.prototype,C,M)}}static getPropertyDescriptor(C,H,V){let{get:M,set:r}=U2(this.prototype,C)??{get(){return this[H]},set(e){this[H]=e}};return{get:M,set(e){let i=M?.call(this);r?.call(this,e),this.requestUpdate(C,i,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(C){return this.elementProperties.get(C)??W1}static _$Ei(){if(this.hasOwnProperty(Q("elementProperties")))return;let C=K2(this);C.finalize(),C.l!==void 0&&(this.l=[...C.l]),this.elementProperties=new Map(C.elementProperties)}static finalize(){if(this.hasOwnProperty(Q("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(Q("properties"))){let H=this.properties,V=[...Q2(H),...G2(H)];for(let M of V)this.createProperty(M,H[M])}let C=this[Symbol.metadata];if(C!==null){let H=litPropertyMetadata.get(C);if(H!==void 0)for(let[V,M]of H)this.elementProperties.set(V,M)}this._$Eh=new Map;for(let[H,V]of this.elementProperties){let M=this._$Eu(H,V);M!==void 0&&this._$Eh.set(M,H)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(C){let H=[];if(Array.isArray(C)){let V=new Set(C.flat(1/0).reverse());for(let M of V)H.unshift(Z1(M))}else C!==void 0&&H.push(Z1(C));return H}static _$Eu(C,H){let V=H.attribute;return V===!1?void 0:typeof V=="string"?V:typeof C=="string"?C.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(C=>this.enableUpdating=C),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(C=>C(this))}addController(C){(this._$EO??=new Set).add(C),this.renderRoot!==void 0&&this.isConnected&&C.hostConnected?.()}removeController(C){this._$EO?.delete(C)}_$E_(){let C=new Map,H=this.constructor.elementProperties;for(let V of H.keys())this.hasOwnProperty(V)&&(C.set(V,this[V]),delete this[V]);C.size>0&&(this._$Ep=C)}createRenderRoot(){let C=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return _1(C,this.constructor.elementStyles),C}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(C=>C.hostConnected?.())}enableUpdating(C){}disconnectedCallback(){this._$EO?.forEach(C=>C.hostDisconnected?.())}attributeChangedCallback(C,H,V){this._$AK(C,V)}_$ET(C,H){let V=this.constructor.elementProperties.get(C),M=this.constructor._$Eu(C,V);if(M!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:s1).toAttribute(H,V.type);this._$Em=C,r==null?this.removeAttribute(M):this.setAttribute(M,r),this._$Em=null}}_$AK(C,H){let V=this.constructor,M=V._$Eh.get(C);if(M!==void 0&&this._$Em!==M){let r=V.getPropertyOptions(M),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:s1;this._$Em=M;let i=e.fromAttribute(H,r.type);this[M]=i??this._$Ej?.get(M)??i,this._$Em=null}}requestUpdate(C,H,V,M=!1,r){if(C!==void 0){let e=this.constructor;if(M===!1&&(r=this[C]),V??=e.getPropertyOptions(C),!((V.hasChanged??$1)(r,H)||V.useDefault&&V.reflect&&r===this._$Ej?.get(C)&&!this.hasAttribute(e._$Eu(C,V))))return;this.C(C,H,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(C,H,{useDefault:V,reflect:M,wrapped:r},e){V&&!(this._$Ej??=new Map).has(C)&&(this._$Ej.set(C,e??H??this[C]),r!==!0||e!==void 0)||(this._$AL.has(C)||(this.hasUpdated||V||(H=void 0),this._$AL.set(C,H)),M===!0&&this._$Em!==C&&(this._$Eq??=new Set).add(C))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(H){Promise.reject(H)}let C=this.scheduleUpdate();return C!=null&&await C,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[M,r]of this._$Ep)this[M]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[M,r]of V){let{wrapped:e}=r,i=this[M];e!==!0||this._$AL.has(M)||i===void 0||this.C(M,void 0,r,i)}}let C=!1,H=this._$AL;try{C=this.shouldUpdate(H),C?(this.willUpdate(H),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(H)):this._$EM()}catch(V){throw C=!1,this._$EM(),V}C&&this._$AE(H)}willUpdate(C){}_$AE(C){this._$EO?.forEach(H=>H.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(C)),this.updated(C)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(C){return!0}update(C){this._$Eq&&=this._$Eq.forEach(H=>this._$ET(H,this[H])),this._$EM()}updated(C){}firstUpdated(C){}};g.elementStyles=[],g.shadowRootOptions={mode:"open"},g[Q("elementProperties")]=new Map,g[Q("finalized")]=new Map,q2?.({ReactiveElement:g}),(V1.reactiveElementVersions??=[]).push("2.1.2");var S1=globalThis,I1=L=>L,L1=S1.trustedTypes,z1=L1?L1.createPolicy("lit-html",{createHTML:L=>L}):void 0,c1="$lit$",f=`lit$${Math.random().toFixed(9).slice(2)}$`,h1="?"+f,X2=`<${h1}>`,D=document,K=()=>D.createComment(""),j=L=>L===null||typeof L!="object"&&typeof L!="function",O1=Array.isArray,q1=L=>O1(L)||typeof L?.[Symbol.iterator]=="function",u1=`[ 	
\f\r]`,G=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,U1=/-->/g,Q1=/>/g,F=RegExp(`>|${u1}(?:([^\\s"'>=/]+)(${u1}*=${u1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),G1=/'/g,K1=/"/g,X1=/^(?:script|style|textarea|title)$/i,g1=L=>(C,...H)=>({_$litType$:L,strings:C,values:H}),p=g1(1),Z5=g1(2),s5=g1(3),k=Symbol.for("lit-noChange"),a=Symbol.for("lit-nothing"),j1=new WeakMap,R=D.createTreeWalker(D,129);function Y1(L,C){if(!O1(L)||!L.hasOwnProperty("raw"))throw Error("invalid template strings array");return z1!==void 0?z1.createHTML(C):C}var J1=(L,C)=>{let H=L.length-1,V=[],M,r=C===2?"<svg>":C===3?"<math>":"",e=G;for(let i=0;i<H;i++){let t=L[i],A,n,o=-1,d=0;for(;d<t.length&&(e.lastIndex=d,n=e.exec(t),n!==null);)d=e.lastIndex,e===G?n[1]==="!--"?e=U1:n[1]!==void 0?e=Q1:n[2]!==void 0?(X1.test(n[2])&&(M=RegExp("</"+n[2],"g")),e=F):n[3]!==void 0&&(e=F):e===F?n[0]===">"?(e=M??G,o=-1):n[1]===void 0?o=-2:(o=e.lastIndex-n[2].length,A=n[1],e=n[3]===void 0?F:n[3]==='"'?K1:G1):e===K1||e===G1?e=F:e===U1||e===Q1?e=G:(e=F,M=void 0);let m=e===F&&L[i+1].startsWith("/>")?" ":"";r+=e===G?t+X2:o>=0?(V.push(A),t.slice(0,o)+c1+t.slice(o)+f+m):t+f+(o===-2?i:m)}return[Y1(L,r+(L[H]||"<?>")+(C===2?"</svg>":C===3?"</math>":"")),V]},q=class L{constructor({strings:C,_$litType$:H},V){let M;this.parts=[];let r=0,e=0,i=C.length-1,t=this.parts,[A,n]=J1(C,H);if(this.el=L.createElement(A,V),R.currentNode=this.el.content,H===2||H===3){let o=this.el.content.firstChild;o.replaceWith(...o.childNodes)}for(;(M=R.nextNode())!==null&&t.length<i;){if(M.nodeType===1){if(M.hasAttributes())for(let o of M.getAttributeNames())if(o.endsWith(c1)){let d=n[e++],m=M.getAttribute(o).split(f),v=/([.?@])?(.*)/.exec(d);t.push({type:1,index:r,name:v[2],strings:m,ctor:v[1]==="."?r1:v[1]==="?"?e1:v[1]==="@"?t1:_}),M.removeAttribute(o)}else o.startsWith(f)&&(t.push({type:6,index:r}),M.removeAttribute(o));if(X1.test(M.tagName)){let o=M.textContent.split(f),d=o.length-1;if(d>0){M.textContent=L1?L1.emptyScript:"";for(let m=0;m<d;m++)M.append(o[m],K()),R.nextNode(),t.push({type:2,index:++r});M.append(o[d],K())}}}else if(M.nodeType===8)if(M.data===h1)t.push({type:2,index:r});else{let o=-1;for(;(o=M.data.indexOf(f,o+1))!==-1;)t.push({type:7,index:r}),o+=f.length-1}r++}}static createElement(C,H){let V=D.createElement("template");return V.innerHTML=C,V}};function E(L,C,H=L,V){if(C===k)return C;let M=V!==void 0?H._$Co?.[V]:H._$Cl,r=j(C)?void 0:C._$litDirective$;return M?.constructor!==r&&(M?._$AO?.(!1),r===void 0?M=void 0:(M=new r(L),M._$AT(L,H,V)),V!==void 0?(H._$Co??=[])[V]=M:H._$Cl=M),M!==void 0&&(C=E(L,M._$AS(L,C.values),M,V)),C}var M1=class{constructor(C,H){this._$AV=[],this._$AN=void 0,this._$AD=C,this._$AM=H}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(C){let{el:{content:H},parts:V}=this._$AD,M=(C?.creationScope??D).importNode(H,!0);R.currentNode=M;let r=R.nextNode(),e=0,i=0,t=V[0];for(;t!==void 0;){if(e===t.index){let A;t.type===2?A=new $(r,r.nextSibling,this,C):t.type===1?A=new t.ctor(r,t.name,t.strings,this,C):t.type===6&&(A=new i1(r,this,C)),this._$AV.push(A),t=V[++i]}e!==t?.index&&(r=R.nextNode(),e++)}return R.currentNode=D,M}p(C){let H=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(C,V,H),H+=V.strings.length-2):V._$AI(C[H])),H++}},$=class L{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(C,H,V,M){this.type=2,this._$AH=a,this._$AN=void 0,this._$AA=C,this._$AB=H,this._$AM=V,this.options=M,this._$Cv=M?.isConnected??!0}get parentNode(){let C=this._$AA.parentNode,H=this._$AM;return H!==void 0&&C?.nodeType===11&&(C=H.parentNode),C}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(C,H=this){C=E(this,C,H),j(C)?C===a||C==null||C===""?(this._$AH!==a&&this._$AR(),this._$AH=a):C!==this._$AH&&C!==k&&this._(C):C._$litType$!==void 0?this.$(C):C.nodeType!==void 0?this.T(C):q1(C)?this.k(C):this._(C)}O(C){return this._$AA.parentNode.insertBefore(C,this._$AB)}T(C){this._$AH!==C&&(this._$AR(),this._$AH=this.O(C))}_(C){this._$AH!==a&&j(this._$AH)?this._$AA.nextSibling.data=C:this.T(D.createTextNode(C)),this._$AH=C}$(C){let{values:H,_$litType$:V}=C,M=typeof V=="number"?this._$AC(C):(V.el===void 0&&(V.el=q.createElement(Y1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===M)this._$AH.p(H);else{let r=new M1(M,this),e=r.u(this.options);r.p(H),this.T(e),this._$AH=r}}_$AC(C){let H=j1.get(C.strings);return H===void 0&&j1.set(C.strings,H=new q(C)),H}k(C){O1(this._$AH)||(this._$AH=[],this._$AR());let H=this._$AH,V,M=0;for(let r of C)M===H.length?H.push(V=new L(this.O(K()),this.O(K()),this,this.options)):V=H[M],V._$AI(r),M++;M<H.length&&(this._$AR(V&&V._$AB.nextSibling,M),H.length=M)}_$AR(C=this._$AA.nextSibling,H){for(this._$AP?.(!1,!0,H);C!==this._$AB;){let V=I1(C).nextSibling;I1(C).remove(),C=V}}setConnected(C){this._$AM===void 0&&(this._$Cv=C,this._$AP?.(C))}},_=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(C,H,V,M,r){this.type=1,this._$AH=a,this._$AN=void 0,this.element=C,this.name=H,this._$AM=M,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=a}_$AI(C,H=this,V,M){let r=this.strings,e=!1;if(r===void 0)C=E(this,C,H,0),e=!j(C)||C!==this._$AH&&C!==k,e&&(this._$AH=C);else{let i=C,t,A;for(C=r[0],t=0;t<r.length-1;t++)A=E(this,i[V+t],H,t),A===k&&(A=this._$AH[t]),e||=!j(A)||A!==this._$AH[t],A===a?C=a:C!==a&&(C+=(A??"")+r[t+1]),this._$AH[t]=A}e&&!M&&this.j(C)}j(C){C===a?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,C??"")}},r1=class extends _{constructor(){super(...arguments),this.type=3}j(C){this.element[this.name]=C===a?void 0:C}},e1=class extends _{constructor(){super(...arguments),this.type=4}j(C){this.element.toggleAttribute(this.name,!!C&&C!==a)}},t1=class extends _{constructor(C,H,V,M,r){super(C,H,V,M,r),this.type=5}_$AI(C,H=this){if((C=E(this,C,H,0)??a)===k)return;let V=this._$AH,M=C===a&&V!==a||C.capture!==V.capture||C.once!==V.once||C.passive!==V.passive,r=C!==a&&(V===a||M);M&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,C),this._$AH=C}handleEvent(C){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,C):this._$AH.handleEvent(C)}},i1=class{constructor(C,H,V){this.element=C,this.type=6,this._$AN=void 0,this._$AM=H,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(C){E(this,C)}},C2={M:c1,P:f,A:h1,C:1,L:J1,R:M1,D:q1,V:E,I:$,H:_,N:e1,U:t1,B:r1,F:i1},Y2=S1.litHtmlPolyfillSupport;Y2?.(q,$),(S1.litHtmlVersions??=[]).push("3.3.3");var H2=(L,C,H)=>{let V=H?.renderBefore??C,M=V._$litPart$;if(M===void 0){let r=H?.renderBefore??null;V._$litPart$=M=new $(C.insertBefore(K(),r),r,void 0,H??{})}return M._$AI(L),M};var f1=globalThis,l=class extends g{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let C=super.createRenderRoot();return this.renderOptions.renderBefore??=C.firstChild,C}update(C){let H=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(C),this._$Do=H2(H,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return k}};l._$litElement$=!0,l.finalized=!0,f1.litElementHydrateSupport?.({LitElement:l});var J2=f1.litElementPolyfillSupport;J2?.({LitElement:l});(f1.litElementVersions??=[]).push("4.2.2");var o1="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";var P5="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z";var a1="M17.03 6C18.11 6 19 6.88 19 8V19C19 20.13 18.11 21 17.03 21C17.03 21.58 16.56 22 16 22C15.5 22 15 21.58 15 21H9C9 21.58 8.5 22 8 22C7.44 22 6.97 21.58 6.97 21C5.89 21 5 20.13 5 19V8C5 6.88 5.89 6 6.97 6H9V3C9 2.42 9.46 2 10 2H14C14.54 2 15 2.42 15 3V6H17.03M13.5 6V3.5H10.5V6H13.5M8 9V18H9.5V9H8M14.5 9V18H16V9H14.5M11.25 9V18H12.75V9H11.25Z";var T5="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z";var V2="M18,11V12.5C21.19,12.5 23.09,16.05 21.33,18.71L20.24,17.62C21.06,15.96 19.85,14 18,14V15.5L15.75,13.25L18,11M18,22V20.5C14.81,20.5 12.91,16.95 14.67,14.29L15.76,15.38C14.94,17.04 16.15,19 18,19V17.5L20.25,19.75L18,22M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H14C13.36,20.45 12.86,19.77 12.5,19H5V8H19V10.59C19.71,10.7 20.39,10.94 21,11.31V5A2,2 0 0,0 19,3Z";var F5="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";var R5="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";var D5="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";var L2="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";var E5="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";var _5="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var M2="M13 24C9.74 24 6.81 22 5.6 19L2.57 11.37C2.26 10.58 3 9.79 3.81 10.05L4.6 10.31C5.16 10.5 5.62 10.92 5.84 11.47L7.25 15H8V3.25C8 2.56 8.56 2 9.25 2S10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 .56 12.06 0 12.75 0S14 .56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5S21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z";var X="M24 13L20 17V14H11V12H20V9L24 13M4 20V12H1L11 3L18 9.3V10H15.79L11 5.69L6 10.19V18H16V16H18V20H4Z";var r2="M15 13L11 17V14H2V12H11V9L15 13M5 20V16H7V18H17V10.19L12 5.69L7.21 10H4.22L12 3L22 12H19V20H5Z";var e2="M19 8C20.11 8 21 8.9 21 10V16.76C21.61 17.31 22 18.11 22 19C22 20.66 20.66 22 19 22C17.34 22 16 20.66 16 19C16 18.11 16.39 17.31 17 16.76V10C17 8.9 17.9 8 19 8M19 9C18.45 9 18 9.45 18 10V11H20V10C20 9.45 19.55 9 19 9M12 5.69L7 10.19V18H14.1L14 19L14.1 20H5V12H2L12 3L16.4 6.96C15.89 7.4 15.5 7.97 15.25 8.61L12 5.69Z";var t2="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z";var N5="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";var i2="M19,13H5V11H19V13Z";var W5="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var o2="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";var $5="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";var a2="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13";var A2="M3.28,2L2,3.27L4.77,6.04L5.64,7.39L4.22,9.6L5.95,10.5L7.23,8.5L10.73,12H4A2,2 0 0,0 2,14V22H4V20H18.73L20,21.27V22H22V20.73L22,20.72V20.72L3.28,2M7,17A1,1 0 0,1 6,18A1,1 0 0,1 5,17V15A1,1 0 0,1 6,14A1,1 0 0,1 7,15V17M11,17A1,1 0 0,1 10,18A1,1 0 0,1 9,17V15A1,1 0 0,1 10,14A1,1 0 0,1 11,15V17M15,17A1,1 0 0,1 14,18A1,1 0 0,1 13,17V15C13,14.79 13.08,14.61 13.18,14.45L15,16.27V17M16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5M22,14V18.18L19,15.18V15A1,1 0 0,0 18,14C17.95,14 17.9,14 17.85,14.03L15.82,12H20C21.11,12 22,12.9 22,14M11.64,7.3L10.22,5.1L12.22,2L13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L12.84,9L11.44,7.62L11.64,7.3M7.5,3.69L6.1,2.28L6.22,2.09L7.95,3L7.5,3.69Z";var d2="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z";var A1="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z";var I5="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z";var z5="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z";var m2="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z";var p2="M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13";var v2=["home-assistant","hc-main"],n2=null;function C5(){return v2.some(L=>customElements.get(L)!==void 0)}function s(L,C){let H=()=>{customElements.get(L)||customElements.define(L,C)};if(C5()){H();return}n2??=Promise.race(v2.map(V=>customElements.whenDefined(V))),n2.then(H)}var l2={"app.title":"Topen\xED","nav.home":"P\u0159ehled","nav.plans":"Pl\xE1ny","nav.advanced":"Roz\u0161\xED\u0159en\xE9","nav.menu":"Nab\xEDdka","common.save":"Ulo\u017Eit","common.cancel":"Zru\u0161it","common.back":"Zp\u011Bt","common.close":"Zav\u0159\xEDt","common.delete":"Smazat","common.edit":"Upravit","common.add":"P\u0159idat","common.yes":"Ano","common.no":"Ne","common.loading":"Na\u010D\xEDt\xE1m\u2026","common.conflict_title":"Zm\u011Bn\u011Bno jinde","common.conflict_message":"N\u011Bkdo jin\xFD to mezit\xEDm zm\u011Bnil. Ponechat va\u0161i verzi a p\u0159epsat jeho zm\u011Bny?","common.overwrite":"Ponechat moje","common.discard_mine":"Zahodit moje","common.not_loaded":"Pl\xE1nova\u010D topen\xED neb\u011B\u017E\xED. Zkontrolujte integraci v Nastaven\xED.","mode.comfort":"Teplo","mode.eco":"\xDAspora","mode.night":"Noc","mode.away":"Pry\u010D","mode.frost":"Proti mrazu","mode.off":"Vypnuto","mode.manual":"Ru\u010Dn\u011B","house.auto":"Norm\xE1ln\u011B","house.away":"Pry\u010D","house.vacation":"Dovolen\xE1","house.off":"Vypnuto","house.title":"Cel\xFD d\u016Fm","house.banner.away":"Cel\xFD d\u016Fm je v re\u017Eimu Pry\u010D.","house.banner.vacation":"Dovolen\xE1 do {until}.","house.banner.vacation_open":"Dovolen\xE1 je zapnut\xE1.","house.banner.off":"Topen\xED je v cel\xE9m dom\u011B vypnut\xE9.","house.home_again":"Jsem doma \u2014 Norm\xE1ln\u011B","house.heating_on":"Zapnout topen\xED \u2014 Norm\xE1ln\u011B","house.planned":"Napl\xE1novan\xE1 dovolen\xE1: {from} \u2013 {to}","house.planned_open":"Napl\xE1novan\xE1 dovolen\xE1 od {from}","house.cancel_planned":"Zru\u0161it dovolenou","house.confirm.away":"P\u0159epnout cel\xFD d\u016Fm na Pry\u010D? V\u0161echny m\xEDstnosti budou na {temp}.","house.confirm.away_button":"Ano, p\u0159epnout na Pry\u010D","house.confirm.off":"Vypnout topen\xED v cel\xE9m dom\u011B?","house.confirm.off_button":"Ano, vypnout","house.confirm.end_vacation":"Ukon\u010Dit dovolenou hned?","house.confirm.end_vacation_button":"Ano, ukon\u010Dit dovolenou","house.confirm.cancel_vacation":"Zru\u0161it napl\xE1novanou dovolenou?","house.confirm.cancel_vacation_button":"Ano, zru\u0161it","room.now":"V m\xEDstnosti","room.set_to":"Nastaveno","room.until_next":"do {until} \u2192 {next}","room.until":"do {until}","room.by_hand_until":"Ru\u010Dn\u011B zm\u011Bn\u011Bno do {until}","room.back_to_plan":"Zp\u011Bt na pl\xE1n","room.warmer":"Tepleji","room.cooler":"Chladn\u011Bji","room.no_trvs":"Zat\xEDm bez hlavic.","room.problem":"N\u011Bco nen\xED v po\u0159\xE1dku. Klepn\u011Bte pro podrobnosti.","room.off":"Topen\xED je vypnut\xE9","room.sending":"Pos\xEDl\xE1m\u2026","reason.plan":"Pl\xE1n: {mode}","reason.manual":"Ru\u010Dn\u011B zm\u011Bn\u011Bno","reason.house_away":"D\u016Fm: Pry\u010D","reason.vacation":"Dovolen\xE1","reason.house_off":"Topen\xED vypnuto","health.title":"Co se d\u011Bje: {room}","health.unavailable":"Hlavice {name} neodpov\xEDd\xE1. Zkontrolujte baterie.","health.write_failed":"Hlavice {name} nep\u0159ijala novou teplotu. Za p\xE1r minut to zkus\xEDm znovu.","health.mismatch":"Hlavice {name} m\xE1 jinou teplotu, ne\u017E m\xE1 m\xEDt. Zkus\xEDm to opravit.","health.since":"Od {time}.","health.retry":"Zkusit hned","health.details":"Podrobnosti jsou v \u010D\xE1sti Roz\u0161\xED\u0159en\xE9 \u2192 Hlavice.","vacation.title":"Dovolen\xE1","vacation.from":"Odjezd","vacation.to":"N\xE1vrat","vacation.date":"Datum","vacation.time":"\u010Cas","vacation.now":"Hned","vacation.later":"Pozd\u011Bji","vacation.temperature":"Teplota b\u011Bhem dovolen\xE9","vacation.start":"Zapnout dovolenou","vacation.plan":"Napl\xE1novat dovolenou","vacation.confirm":"Dovolen\xE1 od {from} do {to}. V\u0161echny m\xEDstnosti budou na {temp}.","vacation.confirm_now":"Dovolen\xE1 od te\u010F do {to}. V\u0161echny m\xEDstnosti budou na {temp}.","vacation.confirm_button":"Ano, zapnout dovolenou","vacation.error_end":"Vyberte, kdy se vr\xE1t\xEDte.","vacation.error_order":"N\xE1vrat mus\xED b\xFDt a\u017E po odjezdu.","plans.rooms_title":"Podle jak\xE9ho pl\xE1nu top\xED m\xEDstnosti","plans.own_plan":"Vlastn\xED pl\xE1n","plans.own_plan_name":"{room}","plans.used_by":"Pou\u017E\xEDv\xE1: {rooms}","plans.unused":"Tento pl\xE1n nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","plans.new":"Nov\xFD pl\xE1n","plans.name":"N\xE1zev","plans.start_from":"Za\u010D\xEDt podle","plans.create":"Vytvo\u0159it","plans.delete_confirm":"Smazat pl\xE1n {name}?","plans.delete_confirm_used":"Smazat pl\xE1n {name}? {rooms} bude topit podle pl\xE1nu domu.","plans.edit":"Upravit pl\xE1n","plans.all_plans":"Pl\xE1ny","plans.house_badge":"D\u016Fm","editor.tap_day":"Klepn\u011Bte na den, kter\xFD chcete zm\u011Bnit.","editor.copy_day":"Kop\xEDrovat den do\u2026","editor.copy_title":"Kop\xEDrovat {day} do","editor.workdays":"Pracovn\xED dny","editor.weekend":"V\xEDkend","editor.all_days":"V\u0161echny dny","editor.copy":"Kop\xEDrovat","editor.mode":"Co se m\xE1 d\xEDt","editor.starts":"Za\u010D\xE1tek","editor.ends":"Konec","editor.add_change":"P\u0159idat zm\u011Bnu v {time}","editor.remove":"Odstranit tento \xFAsek","editor.earlier":"O 15 minut d\u0159\xEDve","editor.later":"O 15 minut pozd\u011Bji","editor.preview_title":"Ulo\u017Eit pl\xE1n?","editor.preview_changed":"Zm\u011Bn\u011Bn\xE9 dny jsou ozna\u010Den\xE9 te\u010Dkou.","editor.preview_used":"Pl\xE1n pou\u017E\xEDvaj\xED: {rooms}","editor.preview_unused":"Pl\xE1n zat\xEDm nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","editor.discard":"Zahodit zm\u011Bny?","editor.discard_button":"Zahodit","editor.saved":"Pl\xE1n je ulo\u017Een\xFD.","editor.unsaved":"Zat\xEDm neulo\u017Eeno","editor.parts":"\xDAseky dne","editor.drag_hint":"\u010Casy zm\u011Bn\xEDte posunut\xEDm b\xEDl\xFDch \xFAchyt\u016F, nebo klepn\u011Bte na \xFAsek.","day.0":"Pond\u011Bl\xED","day.1":"\xDAter\xFD","day.2":"St\u0159eda","day.3":"\u010Ctvrtek","day.4":"P\xE1tek","day.5":"Sobota","day.6":"Ned\u011Ble","day.short.0":"Po","day.short.1":"\xDAt","day.short.2":"St","day.short.3":"\u010Ct","day.short.4":"P\xE1","day.short.5":"So","day.short.6":"Ne","adv.rooms":"M\xEDstnosti","adv.temps":"Teploty","adv.settings":"Nastaven\xED","adv.health":"Hlavice","adv.log":"Z\xE1znam","adv.rooms.add":"P\u0159idat m\xEDstnost","adv.rooms.import":"P\u0159idat m\xEDstnosti podle oblast\xED","adv.rooms.import_hint":"Oblasti v Home Assistantu, kter\xE9 maj\xED hlavice:","adv.rooms.import_none":"\u017D\xE1dn\xE1 oblast s voln\xFDmi hlavicemi nebyla nalezena.","adv.rooms.import_button":"P\u0159idat vybran\xE9","adv.rooms.name":"N\xE1zev","adv.rooms.trvs":"Termostatick\xE9 hlavice","adv.rooms.in_room":"v m\xEDstnosti {room}","adv.rooms.no_climates":"Home Assistant nem\xE1 \u017E\xE1dn\xE9 hlavice (entity climate).","adv.rooms.temperature_entity":"Zobrazen\xE1 teplota","adv.rooms.temperature_auto":"Pr\u016Fm\u011Br z hlavic","adv.rooms.plan":"Pl\xE1n","adv.rooms.temp_set":"Teploty","adv.rooms.delete_confirm":"Smazat m\xEDstnost {name}? Jej\xED hlavice u\u017E nebudou \u0159\xEDzen\xE9.","adv.rooms.move_up":"Posunout nahoru","adv.rooms.move_down":"Posunout dol\u016F","adv.rooms.empty":"Zat\xEDm \u017E\xE1dn\xE9 m\xEDstnosti. P\u0159idejte m\xEDstnost nebo m\xEDstnosti podle oblast\xED v Home Assistantu.","adv.rooms.edit_title":"M\xEDstnost","adv.temps.house":"Teploty domu","adv.temps.house_hint":"Plat\xED pro v\u0161echny m\xEDstnosti, pokud nemaj\xED vlastn\xED sadu.","adv.temps.sets":"Vlastn\xED sady teplot","adv.temps.sets_hint":"Sada m\u011Bn\xED jen n\u011Bkter\xE9 teploty. Ostatn\xED plat\xED jako pro d\u016Fm.","adv.temps.as_house":"jako d\u016Fm ({temp})","adv.temps.own":"vlastn\xED","adv.temps.new":"Nov\xE1 sada","adv.temps.delete_confirm":"Smazat sadu {name}?","adv.temps.delete_confirm_used":"Smazat sadu {name}? {rooms} bude m\xEDt teploty domu.","adv.settings.max_override":"Nejdel\u0161\xED ru\u010Dn\xED zm\u011Bna (hodiny)","adv.settings.max_override_hint":"Zm\u011Bna na hlavici nebo v aplikaci skon\u010D\xED p\u0159i dal\u0161\xED zm\u011Bn\u011B pl\xE1nu, nejpozd\u011Bji ale po t\xE9to dob\u011B.","adv.settings.safety_interval":"Kontrolovat hlavice ka\u017Ed\xFDch (minut)","adv.settings.mismatch_alert":"Upozornit na \u0161patnou teplotu po (minut\xE1ch)","adv.settings.vacation_mode":"Teplota na dovolen\xE9","adv.settings.dry_run":"Zku\u0161ebn\xED re\u017Eim: jen po\u010D\xEDtat, hlavic\xEDm nic nepos\xEDlat","adv.settings.saved":"Nastaven\xED je ulo\u017Een\xE9.","adv.health.all_ok":"V\u0161echny hlavice jsou v po\u0159\xE1dku.","adv.health.check_now":"Zkontrolovat v\u0161echny hlavice","adv.health.phase.idle":"V po\u0159\xE1dku","adv.health.phase.writing":"Pos\xEDl\xE1m","adv.health.phase.waiting":"Nedostupn\xE1","adv.health.phase.failed":"Selhalo","adv.health.wanted":"M\xE1 m\xEDt","adv.health.valve":"Hlavice m\xE1","adv.health.last_write":"Naposledy posl\xE1no","adv.health.error":"Chyba","adv.log.room":"M\xEDstnost","adv.log.empty":"Zat\xEDm nic.","adv.rooms.none_trvs":"Bez hlavic","adv.rooms.new_title":"Nov\xE1 m\xEDstnost","adv.rooms.sensor_hint":"Jen pro zobrazen\xED v aplikaci; hlavice d\xE1l pou\u017E\xEDvaj\xED sv\u016Fj senzor.","adv.temps.save_hint":"Po ulo\u017Een\xED se zm\u011Bny hned projev\xED v m\xEDstnostech.","adv.health.mode":"Re\u017Eim","adv.log.refresh":"Obnovit","adv.log.at":"\u010Cas","adv.settings.hours":"{n} h","adv.settings.minutes":"{n} min","adv.settings.frost":"Proti mrazu","adv.settings.away":"Pry\u010D","adv.dry_run_banner":"Zku\u0161ebn\xED re\u017Eim: hlavic\xEDm se nic nepos\xEDl\xE1.","log.write":"Odesl\xE1no","log.verified":"Hlavice potvrdila","log.retry":"Bez odpov\u011Bdi, zkou\u0161\xEDm znovu","log.failed":"Selhalo","log.dry_run":"Poslal bych (zku\u0161ebn\xED re\u017Eim)","log.manual":"Zm\u011Bn\u011Bno na hlavici","log.manual_ignored":"Zm\u011Bna na hlavici vr\xE1cena (re\u017Eim domu)","log.override_set":"Zm\u011Bn\u011Bno v aplikaci","log.override_cleared":"Zp\u011Bt na pl\xE1n","log.override_expired":"Ru\u010Dn\xED zm\u011Bna skon\u010Dila","log.unavailable":"Hlavice nedostupn\xE1","log.available":"Hlavice op\u011Bt dostupn\xE1","error.revision_conflict":"Nastaven\xED mezit\xEDm zm\u011Bnil n\u011Bkdo jin\xFD. Str\xE1nka u\u017E ukazuje nov\xFD stav, zkuste to pros\xEDm znovu.","error.house_mode_active":"D\u016Fm nen\xED v re\u017Eimu Norm\xE1ln\u011B.","error.duplicate_name":"Tento n\xE1zev u\u017E existuje.","error.name_required":"Zadejte n\xE1zev.","error.name_too_long":"N\xE1zev je p\u0159\xEDli\u0161 dlouh\xFD.","error.trv_in_two_rooms":"Hlavice m\u016F\u017Ee pat\u0159it jen do jedn\xE9 m\xEDstnosti.","error.invalid_trv":"Termostat m\xEDstnosti nelze pou\u017E\xEDt jako hlavici.","error.plan_empty":"Pl\xE1n je pr\xE1zdn\xFD.","error.temperature_range":"Teplota mus\xED b\xFDt mezi 5 a 30 \xB0C.","error.setting_range":"Tato hodnota je mimo povolen\xFD rozsah.","error.vacation_order":"Dovolen\xE1 mus\xED skon\u010Dit a\u017E po sv\xE9m za\u010D\xE1tku.","error.not_loaded":"Pl\xE1nova\u010D topen\xED neb\u011B\u017E\xED.","error.unknown":"N\u011Bco se nepovedlo: {message}","card.name":"Pl\xE1nova\u010D topen\xED","card.description":"M\xEDstnosti s teplotami, pl\xE1ny a ru\u010Dn\xEDmi zm\u011Bnami.","card.room":"M\xEDstnost","card.all_rooms":"V\u0161echny m\xEDstnosti","card.compact":"Kompaktn\xED seznam","card.show_house":"Zobrazit re\u017Eim domu","card.open_panel":"Otev\u0159\xEDt topen\xED"};var d1={"app.title":"Heating","nav.home":"Overview","nav.plans":"Plans","nav.advanced":"Advanced","nav.menu":"Menu","common.save":"Save","common.cancel":"Cancel","common.back":"Back","common.close":"Close","common.delete":"Delete","common.edit":"Change","common.add":"Add","common.yes":"Yes","common.no":"No","common.loading":"Loading\u2026","common.conflict_title":"Changed elsewhere","common.conflict_message":"Somebody else changed this meanwhile. Keep your version and overwrite theirs?","common.overwrite":"Keep mine","common.discard_mine":"Discard mine","common.not_loaded":"The heating scheduler is not running. Check the integration in Settings.","mode.comfort":"Warm","mode.eco":"Saving","mode.night":"Night","mode.away":"Away","mode.frost":"Frost guard","mode.off":"Off","mode.manual":"By hand","house.auto":"Normal","house.away":"Away","house.vacation":"Holiday","house.off":"Off","house.title":"Whole house","house.banner.away":"The whole house is set to Away.","house.banner.vacation":"Holiday until {until}.","house.banner.vacation_open":"Holiday is on.","house.banner.off":"Heating is off in the whole house.","house.home_again":"I'm home \u2014 Normal","house.heating_on":"Turn heating on \u2014 Normal","house.planned":"Holiday planned: {from} \u2013 {to}","house.planned_open":"Holiday planned from {from}","house.cancel_planned":"Cancel holiday","house.confirm.away":"Switch the whole house to Away? All rooms will be kept at {temp}.","house.confirm.away_button":"Yes, switch to Away","house.confirm.off":"Turn off the heating in the whole house?","house.confirm.off_button":"Yes, turn off","house.confirm.end_vacation":"End the holiday now?","house.confirm.end_vacation_button":"Yes, end the holiday","house.confirm.cancel_vacation":"Cancel the planned holiday?","house.confirm.cancel_vacation_button":"Yes, cancel it","room.now":"In the room","room.set_to":"Set to","room.until_next":"until {until} \u2192 {next}","room.until":"until {until}","room.by_hand_until":"Changed by hand until {until}","room.back_to_plan":"Back to plan","room.warmer":"Warmer","room.cooler":"Cooler","room.no_trvs":"No radiator valves yet.","room.problem":"Something is wrong. Tap for details.","room.off":"Heating is off","room.sending":"Sending\u2026","reason.plan":"Plan: {mode}","reason.manual":"Changed by hand","reason.house_away":"House: Away","reason.vacation":"Holiday","reason.house_off":"Heating off","health.title":"What is wrong in {room}","health.unavailable":"The valve {name} does not respond. Check its batteries.","health.write_failed":"The valve {name} did not take the new temperature. It will be tried again in a few minutes.","health.mismatch":"The valve {name} has a different temperature than it should. It will be corrected.","health.since":"Since {time}.","health.retry":"Try again now","health.details":"Details are in Advanced \u2192 Valves.","vacation.title":"Holiday","vacation.from":"Leaving","vacation.to":"Coming back","vacation.date":"Date","vacation.time":"Time","vacation.now":"Now","vacation.later":"Later","vacation.temperature":"Temperature while away","vacation.start":"Turn holiday on","vacation.plan":"Plan the holiday","vacation.confirm":"Holiday from {from} to {to}. All rooms will be kept at {temp}.","vacation.confirm_now":"Holiday from now to {to}. All rooms will be kept at {temp}.","vacation.confirm_button":"Yes, turn holiday on","vacation.error_end":"Choose when you come back.","vacation.error_order":"The return must be after the start.","plans.rooms_title":"Which plan each room follows","plans.own_plan":"Own plan","plans.own_plan_name":"{room}","plans.used_by":"Used by: {rooms}","plans.unused":"No room uses this plan.","plans.new":"New plan","plans.name":"Name","plans.start_from":"Start from","plans.create":"Create","plans.delete_confirm":"Delete the plan {name}?","plans.delete_confirm_used":"Delete the plan {name}? {rooms} will follow the house plan.","plans.edit":"Change plan","plans.all_plans":"Plans","plans.house_badge":"House","editor.tap_day":"Tap a day to change it.","editor.copy_day":"Copy this day to\u2026","editor.copy_title":"Copy {day} to","editor.workdays":"Workdays","editor.weekend":"Weekend","editor.all_days":"All days","editor.copy":"Copy","editor.mode":"What should happen","editor.starts":"Starts","editor.ends":"Ends","editor.add_change":"Add a change at {time}","editor.remove":"Remove this part","editor.earlier":"15 minutes earlier","editor.later":"15 minutes later","editor.preview_title":"Save this plan?","editor.preview_changed":"Changed days are marked with a dot.","editor.preview_used":"This plan is used by: {rooms}","editor.preview_unused":"No room uses this plan yet.","editor.discard":"Discard your changes?","editor.discard_button":"Discard","editor.saved":"The plan is saved.","editor.unsaved":"Not saved yet","editor.parts":"Parts of the day","editor.drag_hint":"Drag the white handles to change times, or tap a part.","day.0":"Monday","day.1":"Tuesday","day.2":"Wednesday","day.3":"Thursday","day.4":"Friday","day.5":"Saturday","day.6":"Sunday","day.short.0":"Mo","day.short.1":"Tu","day.short.2":"We","day.short.3":"Th","day.short.4":"Fr","day.short.5":"Sa","day.short.6":"Su","adv.rooms":"Rooms","adv.temps":"Temperatures","adv.settings":"Settings","adv.health":"Valves","adv.log":"Log","adv.rooms.add":"Add room","adv.rooms.import":"Add rooms from areas","adv.rooms.import_hint":"Areas in Home Assistant that have radiator valves:","adv.rooms.import_none":"No area with unassigned radiator valves was found.","adv.rooms.import_button":"Add selected","adv.rooms.name":"Name","adv.rooms.trvs":"Radiator valves","adv.rooms.in_room":"in {room}","adv.rooms.no_climates":"Home Assistant has no radiator valves (climate entities).","adv.rooms.temperature_entity":"Temperature shown","adv.rooms.temperature_auto":"Average of the valves","adv.rooms.plan":"Plan","adv.rooms.temp_set":"Temperatures","adv.rooms.delete_confirm":"Delete the room {name}? Its valves will no longer be controlled.","adv.rooms.move_up":"Move up","adv.rooms.move_down":"Move down","adv.rooms.empty":"No rooms yet. Add a room, or add rooms from Home Assistant areas.","adv.rooms.edit_title":"Room","adv.temps.house":"House temperatures","adv.temps.house_hint":"Every room uses these, unless it has its own set.","adv.temps.sets":"Own temperature sets","adv.temps.sets_hint":"A set changes only some temperatures. The others come from the house.","adv.temps.as_house":"as house ({temp})","adv.temps.own":"own","adv.temps.new":"New set","adv.temps.delete_confirm":"Delete the set {name}?","adv.temps.delete_confirm_used":"Delete the set {name}? {rooms} will use the house temperatures.","adv.settings.max_override":"Longest manual change (hours)","adv.settings.max_override_hint":"A change on a valve or in the app ends at the next change of the plan, but never later than this.","adv.settings.safety_interval":"Check the valves every (minutes)","adv.settings.mismatch_alert":"Warn about a wrong temperature after (minutes)","adv.settings.vacation_mode":"Temperature during a holiday","adv.settings.dry_run":"Test mode: compute only, send nothing to the valves","adv.settings.saved":"Settings saved.","adv.health.all_ok":"All valves are fine.","adv.health.check_now":"Check all valves now","adv.health.phase.idle":"OK","adv.health.phase.writing":"Sending","adv.health.phase.waiting":"Offline","adv.health.phase.failed":"Failed","adv.health.wanted":"Wanted","adv.health.valve":"Valve","adv.health.last_write":"Last sent","adv.health.error":"Error","adv.log.room":"Room","adv.log.empty":"Nothing recorded yet.","adv.rooms.none_trvs":"No valves","adv.rooms.new_title":"New room","adv.rooms.sensor_hint":"Shown in the app only; the valves keep their own sensor.","adv.temps.save_hint":"Changes apply to the rooms at once after saving.","adv.health.mode":"Mode","adv.log.refresh":"Refresh","adv.log.at":"Time","adv.settings.hours":"{n} h","adv.settings.minutes":"{n} min","adv.settings.frost":"Frost guard","adv.settings.away":"Away","adv.dry_run_banner":"Test mode is on: nothing is sent to the valves.","log.write":"Sent","log.verified":"Confirmed by the valve","log.retry":"No answer, trying again","log.failed":"Failed","log.dry_run":"Would send (test mode)","log.manual":"Changed on the valve","log.manual_ignored":"Change on the valve undone (house mode)","log.override_set":"Changed in the app","log.override_cleared":"Back to plan","log.override_expired":"Manual change ended","log.unavailable":"Valve offline","log.available":"Valve back online","error.revision_conflict":"Somebody else changed the settings meanwhile. The page shows the new state now; please try again.","error.house_mode_active":"The house is not in Normal mode.","error.duplicate_name":"This name is already used.","error.name_required":"Enter a name.","error.name_too_long":"The name is too long.","error.trv_in_two_rooms":"A valve can belong to one room only.","error.invalid_trv":"A room thermostat cannot be used as a valve.","error.plan_empty":"The plan is empty.","error.temperature_range":"The temperature must be between 5 and 30 \xB0C.","error.setting_range":"This value is out of range.","error.vacation_order":"The holiday must end after it starts.","error.not_loaded":"The heating scheduler is not running.","error.unknown":"Something went wrong: {message}","card.name":"Heating Scheduler","card.description":"Rooms with their temperatures, plans and manual changes.","card.room":"Room","card.all_rooms":"All rooms","card.compact":"Compact list","card.show_house":"Show the house mode","card.open_panel":"Open Heating"};var H5={cs:l2,en:d1};function Z(L){return(L?.locale?.language??L?.language??"").toLowerCase().startsWith("en")?"en":"cs"}function c(L){let C=H5[L];return(H,V)=>{let M=C[H]??d1[H]??H;if(V)for(let[r,e]of Object.entries(V))M=M.split(`{${r}}`).join(String(e));return M}}var x2=Object.keys(d1);var u=x`
  :host {
    /* Filled buttons: white text on this colour passes WCAG AA in light and dark themes. */
    --hs-accent: #1565c0;
    font-family: var(
      --ha-font-family-body,
      var(--paper-font-body1_-_font-family, Roboto, "Noto Sans", system-ui, sans-serif)
    );
    color: var(--primary-text-color, #212121);
    -webkit-tap-highlight-color: transparent;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  button,
  input,
  select {
    font: inherit;
    color: inherit;
  }
  .btn {
    min-height: 52px;
    min-width: 52px;
    padding: 0 20px;
    border-radius: 14px;
    border: 2px solid var(--divider-color, #c4c4c4);
    background: var(--card-background-color, #fff);
    font-size: 17px;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    text-align: center;
    touch-action: manipulation;
  }
  .btn.primary {
    background: var(--hs-accent, #1565c0);
    border-color: var(--hs-accent, #1565c0);
    color: #fff;
  }
  .btn.danger {
    color: var(--error-color, #c62828);
    border-color: var(--error-color, #c62828);
  }
  .btn.danger.primary {
    background: #c62828;
    border-color: #c62828;
    color: #fff;
  }
  .btn.wide {
    width: 100%;
  }
  .btn.small {
    min-height: 48px;
    font-size: 15px;
    padding: 0 14px;
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible {
    outline: 3px solid var(--primary-color, #1565c0);
    outline-offset: 2px;
  }
  .card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 16px);
    box-shadow: var(--ha-card-box-shadow, none);
    border: var(--ha-card-border-width, 1px) solid
      var(--ha-card-border-color, var(--divider-color, #e0e0e0));
  }
  .muted {
    color: var(--secondary-text-color, #5f6368);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px 6px 10px;
    border-radius: 999px;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    white-space: nowrap;
    --hs-icon-size: 22px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 16px;
  }
  .field > span {
    font-weight: 600;
  }
  .input,
  select.input {
    min-height: 52px;
    padding: 0 14px;
    border-radius: 12px;
    border: 2px solid var(--divider-color, #c4c4c4);
    background: var(--card-background-color, #fff);
    font-size: 18px;
    width: 100%;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  h2,
  h3 {
    margin: 0;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
`;var k1=class{constructor(C){this.snapshot=null;this.listeners=new Set;this.unsubscribe=null;this.retry=null;this.hass=C}setHass(C){this.hass=C}subscribe(C){return this.listeners.add(C),this.listeners.size===1&&this.start(),C(this.snapshot),()=>{this.listeners.delete(C),this.listeners.size===0&&this.stop()}}start(){this.unsubscribe=this.hass.connection.subscribeMessage(C=>{this.snapshot=C;for(let H of this.listeners)H(C)},{type:"heating_scheduler/subscribe"}),this.unsubscribe.catch(()=>{this.unsubscribe=null,this.retry=setTimeout(()=>{this.retry=null,this.listeners.size&&this.start()},1e4)})}stop(){this.retry&&clearTimeout(this.retry),this.retry=null;let C=this.unsubscribe;this.unsubscribe=null,C?.then(H=>H()).catch(()=>{})}call(C,H={}){return this.hass.callWS({type:`heating_scheduler/${C}`,...H})}},Z2=new WeakMap;function y(L){let C=Z2.get(L.connection);return C||(C=new k1(L),Z2.set(L.connection,C)),C.setHass(L),C}function b(L,C){let H=L?.code,V=`error.${H}`;if(H&&x2.includes(V))return C(V);let M=L?.message??String(L);return C("error.unknown",{message:M})}function w(L,C){L.dispatchEvent(new CustomEvent("hs-toast",{detail:C,bubbles:!0,composed:!0}))}var y1=class extends l{static{this.properties={path:{}}}static{this.styles=x`
    :host {
      display: inline-flex;
      width: var(--hs-icon-size, 24px);
      height: var(--hs-icon-size, 24px);
      flex: none;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
    }
  `}render(){return p`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${this.path??""}></path></svg>`}};s("hs-icon",y1);var s2={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},u2=L=>(...C)=>({_$litDirective$:L,values:C}),m1=class{constructor(C){}get _$AU(){return this._$AM._$AU}_$AT(C,H,V){this._$Ct=C,this._$AM=H,this._$Ci=V}_$AS(C,H){return this.update(C,H)}update(C,H){return this.render(...H)}};var{I:V5}=C2,S2=L=>L;var c2=()=>document.createComment(""),I=(L,C,H)=>{let V=L._$AA.parentNode,M=C===void 0?L._$AB:C._$AA;if(H===void 0){let r=V.insertBefore(c2(),M),e=V.insertBefore(c2(),M);H=new V5(r,e,L,L.options)}else{let r=H._$AB.nextSibling,e=H._$AM,i=e!==L;if(i){let t;H._$AQ?.(L),H._$AM=L,H._$AP!==void 0&&(t=L._$AU)!==e._$AU&&H._$AP(t)}if(r!==M||i){let t=H._$AA;for(;t!==r;){let A=S2(t).nextSibling;S2(V).insertBefore(t,M),t=A}}}return H},T=(L,C,H=L)=>(L._$AI(C,H),L),L5={},h2=(L,C=L5)=>L._$AH=C,O2=L=>L._$AH,p1=L=>{L._$AR(),L._$AA.remove()};var g2=(L,C,H)=>{let V=new Map;for(let M=C;M<=H;M++)V.set(L[M],M);return V},A3=u2(class extends m1{constructor(L){if(super(L),L.type!==s2.CHILD)throw Error("repeat() can only be used in text expressions")}dt(L,C,H){let V;H===void 0?H=C:C!==void 0&&(V=C);let M=[],r=[],e=0;for(let i of L)M[e]=V?V(i,e):e,r[e]=H(i,e),e++;return{values:r,keys:M}}render(L,C,H){return this.dt(L,C,H).values}update(L,[C,H,V]){let M=O2(L),{values:r,keys:e}=this.dt(C,H,V);if(!Array.isArray(M))return this.ut=e,r;let i=this.ut??=[],t=[],A,n,o=0,d=M.length-1,m=0,v=r.length-1;for(;o<=d&&m<=v;)if(M[o]===null)o++;else if(M[d]===null)d--;else if(i[o]===e[m])t[m]=T(M[o],r[m]),o++,m++;else if(i[d]===e[v])t[v]=T(M[d],r[v]),d--,v--;else if(i[o]===e[v])t[v]=T(M[o],r[v]),I(L,t[v+1],M[o]),o++,v--;else if(i[d]===e[m])t[m]=T(M[d],r[m]),I(L,M[o],M[d]),d--,m++;else if(A===void 0&&(A=g2(e,m,v),n=g2(i,o,d)),A.has(i[o]))if(A.has(i[d])){let O=n.get(e[m]),l1=O!==void 0?M[O]:null;if(l1===null){let D1=I(L,M[o]);T(D1,r[m]),t[m]=D1}else t[m]=T(l1,r[m]),I(L,M[o],l1),M[O]=null;m++}else p1(M[d]),d--;else p1(M[o]),o++;for(;m<=v;){let O=I(L,t[v+1]);T(O,r[m]),t[m++]=O}for(;o<=d;){let O=M[o++];O!==null&&p1(O)}return this.ut=e,h2(L,t),k}});function M5(){return Intl.DateTimeFormat().resolvedOptions().timeZone}function f2(L){return new Intl.NumberFormat(L).formatToParts(1.5).find(H=>H.type==="decimal")?.value??"."}function k2(L){let C=new Intl.DateTimeFormat(L,{hour:"numeric"}).resolvedOptions().hourCycle;return C==="h11"||C==="h12"}function S(L,C,H){let V=L.locale,M;switch(V?.number_format){case"comma_decimal":case"none":M=C==="cs"&&V?.number_format==="none"?",":".";break;case"decimal_comma":case"space_comma":M=",";break;case"system":M=f2(void 0);break;default:M=f2(C)}let r;switch(V?.time_format){case"12":r=!0;break;case"24":r=!1;break;case"system":r=k2(void 0);break;default:r=k2(C)}let e=H?.time_zone??L.config?.time_zone??M5();return{lang:C,decimalSeparator:M,hour12:r,timeZone:e}}function r5(L,C){return L.toFixed(1).replace(".",C.decimalSeparator)}function B(L,C){return L==null||!Number.isFinite(L)?"\u2014":`${r5(L,C)} \xB0C`}var e5={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};function N(L,C){let H=new Intl.DateTimeFormat("en-US",{timeZone:C,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",weekday:"short",hourCycle:"h23"}).formatToParts(L),V=M=>H.find(r=>r.type===M)?.value??"0";return{year:Number(V("year")),month:Number(V("month")),day:Number(V("day")),hour:Number(V("hour"))%24,minute:Number(V("minute")),weekday:e5[V("weekday")]??0}}function y2(L,C){let H=N(new Date(L),C);return Date.UTC(H.year,H.month-1,H.day,H.hour,H.minute)-Math.floor(L/6e4)*6e4}function b2(L,C,H,V,M,r){let e=Date.UTC(L,C-1,H,V,M),i=e-y2(e,r),t=y2(i,r);return t!==e-i&&(i=e-t),new Date(i)}function w2(L,C){let H=N(L,C.timeZone);if(!C.hour12)return`${String(H.hour).padStart(2,"0")}:${String(H.minute).padStart(2,"0")}`;let V=H.hour<12?"AM":"PM";return`${H.hour%12===0?12:H.hour%12}:${String(H.minute).padStart(2,"0")} ${V}`}var t5={cs:["pond\u011Bl\xED","\xFAter\xFD","st\u0159edy","\u010Dtvrtka","p\xE1tku","soboty","ned\u011Ble"],en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]},i5={cs:["po","\xFAt","st","\u010Dt","p\xE1","so","ne"],en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]},o5=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function B2(L,C){return C==="cs"?`${L.day}. ${L.month}.`:`${L.day} ${o5[L.month-1]}`}function P2(L,C,H){let V=new Date(L),M=w2(V,H),r=V.getTime()-C.getTime();if(r<24*3600*1e3)return M;let e=N(V,H.timeZone);return r<168*3600*1e3?`${t5[H.lang][e.weekday]} ${M}`:`${B2(e,H.lang)} ${M}`}function h(L,C){let H=new Date(L),V=N(H,C.timeZone);return`${i5[C.lang][V.weekday]} ${B2(V,C.lang)} ${w2(H,C)}`}function Y(L,C){return C(`mode.${L}`)}function T2(L,C,H,V){let M=L.source==="plan"?V("reason.plan",{mode:Y(L.mode,V)}):V(`reason.${L.source}`);if(!L.valid_until)return M;let r=L.source==="vacation"?h(L.valid_until,H):P2(L.valid_until,C,H);return`${M} ${V("room.until",{until:r})}`}function F2(L,C,H,V){if(!L.valid_until||!L.next)return null;let M=L.next,r=M.temperature===null?Y(M.mode,V):`${Y(M.mode,V)} ${B(M.temperature,H)}`;return V("room.until_next",{until:P2(L.valid_until,C,H),next:r})}function a5(L,C){return C==="\xB0F"?(L-32)*5/9:C==="K"?L-273.15:L}function R2(L,C){let H=C.config?.unit_system?.temperature,V=(r,e)=>{let i=typeof r=="number"?r:Number.parseFloat(String(r));return Number.isFinite(i)?a5(i,e):null};if(L.temperature_entity){let r=C.states[L.temperature_entity];if(r&&r.state!=="unavailable"&&r.state!=="unknown"){let e=L.temperature_entity.startsWith("climate.")?V(r.attributes.current_temperature,H):V(r.state,r.attributes.unit_of_measurement??H);if(e!==null)return Math.round(e*10)/10}}let M=L.trvs.map(r=>C.states[r]).filter(r=>r&&r.state!=="unavailable"&&r.state!=="unknown").map(r=>V(r.attributes.current_temperature,H)).filter(r=>r!==null);return M.length?Math.round(M.reduce((r,e)=>r+e,0)/M.length*10)/10:L.current_temperature}var P={comfort:"#bf360c",eco:"#2e7d32",night:"#3949ab",away:"#546e7a",frost:"#006978",off:"#616161",manual:"#8e24aa"},D2={comfort:p2,eco:t2,night:m2,away:X,frost:A1,off:A2,manual:M2},b1={auto:"#1565c0",away:P.away,vacation:"#00695c",off:P.off},E2={auto:e2,away:X,vacation:a1,off:a2};function _2(L,C){let H=C.temp_sets.find(M=>M.id==="house"),V=C.temp_sets.find(M=>M.id===L.temp_set_id);return{...H?.temperatures??{},...V&&V.id!=="house"?V.temperatures:{}}}function J(L,C){return L.temp_sets.find(H=>H.id==="house")?.temperatures[C]}var Z3=["comfort","eco","night","away","frost","off"],s3=["comfort","eco","night","away","frost"],N2=["auto","away","vacation","off"];var w1=class extends l{static{this.properties={heading:{},closeLabel:{attribute:"close-label"},wide:{type:Boolean}}}static{this.styles=[u,x`
      dialog {
        border: none;
        padding: 0;
        margin: auto auto 0;
        width: 100%;
        max-width: 100%;
        max-height: 92vh;
        border-radius: 22px 22px 0 0;
        background: var(--card-background-color, #fff);
        color: var(--primary-text-color, #212121);
        box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.25);
      }
      dialog::backdrop {
        background: rgba(0, 0, 0, 0.5);
      }
      @media (min-width: 640px) {
        dialog {
          margin: auto;
          max-width: 540px;
          border-radius: 22px;
        }
        :host([wide]) dialog {
          max-width: 760px;
        }
      }
      .frame {
        display: flex;
        flex-direction: column;
        max-height: 92vh;
      }
      header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 18px 12px 8px 22px;
      }
      h2 {
        flex: 1;
        font-size: 22px;
        line-height: 1.25;
      }
      .close {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: none;
        background: transparent;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .body {
        padding: 8px 22px 16px;
        overflow-y: auto;
        font-size: 18px;
        line-height: 1.45;
      }
      .actions {
        display: flex;
        flex-wrap: wrap-reverse;
        gap: 12px;
        padding: 12px 22px calc(18px + env(safe-area-inset-bottom, 0px));
        border-top: 1px solid var(--divider-color, #e0e0e0);
      }
      ::slotted([slot="actions"]) {
        flex: 1 1 180px;
      }
    `]}get dialog(){return this.renderRoot.querySelector("dialog")}async show(){await this.updateComplete;let C=this.dialog;C&&!C.open&&C.showModal()}close(){let C=this.dialog;C?.open&&C.close()}onClosed(){this.dispatchEvent(new CustomEvent("hs-closed"))}onClick(C){C.target===this.dialog&&this.close()}render(){return p`
      <dialog @close=${this.onClosed} @click=${this.onClick} aria-label=${this.heading??""}>
        <div class="frame">
          <header>
            <h2>${this.heading??a}</h2>
            <button class="close" @click=${this.close} aria-label=${this.closeLabel??"Close"}>
              <hs-icon .path=${L2}></hs-icon>
            </button>
          </header>
          <div class="body"><slot></slot></div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </dialog>
    `}};s("hs-dialog",w1);var B1=class extends l{constructor(){super(...arguments);this.result=!1}static{this.properties={options:{attribute:!1}}}static{this.styles=[u,x`
      p {
        margin: 0;
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}answer(H){this.result=H,this.dialog?.close()}render(){let H=this.options;return p`
      <hs-dialog .heading=${H.heading} .closeLabel=${H.cancel}>
        <p>${H.message}</p>
        <button slot="actions" class="btn" @click=${()=>this.answer(!1)}>${H.cancel}</button>
        <button
          slot="actions"
          class="btn primary ${H.danger?"danger":""}"
          @click=${()=>this.answer(!0)}
        >
          ${H.confirm}
        </button>
      </hs-dialog>
    `}};s("hs-confirm",B1);async function W(L,C){let H=document.createElement("hs-confirm");H.options=C,(L.shadowRoot??L).appendChild(H),await H.updateComplete;let V=H.dialog;return V?new Promise(M=>{V.addEventListener("hs-closed",()=>{H.remove(),M(H.result)},{once:!0}),V.show()}):(H.remove(),!1)}function f3(L,C){return W(L,{heading:C("common.conflict_title"),message:C("common.conflict_message"),confirm:C("common.overwrite"),cancel:C("common.discard_mine")})}function n1(L){return String(L).padStart(2,"0")}var P1=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},later:{state:!0},fromDate:{state:!0},fromTime:{state:!0},toDate:{state:!0},toTime:{state:!0},mode:{state:!0},error:{state:!0}}}static{this.styles=[u,x`
      form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      fieldset {
        border: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      legend {
        font-weight: 700;
        font-size: 19px;
        padding: 0;
        margin-bottom: 8px;
      }
      .pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .choice {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .choice button[aria-pressed="true"] {
        border-color: var(--hs-accent, #1565c0);
        background: var(--hs-accent, #1565c0);
        color: #fff;
      }
      .option {
        min-height: 64px;
        flex-direction: column;
        gap: 2px;
      }
      .option small {
        font-weight: 500;
        font-size: 15px;
      }
      .error {
        color: var(--error-color, #c62828);
        font-weight: 600;
        margin: 0;
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}prepare(){let C=this.snapshot.time_zone,H=N(new Date,C),V=N(new Date(Date.now()+24*3600*1e3),C);this.later=!1,this.fromDate=`${H.year}-${n1(H.month)}-${n1(H.day)}`,this.fromTime="08:00",this.toDate=`${V.year}-${n1(V.month)}-${n1(V.day)}`,this.toTime="12:00",this.mode=this.snapshot.settings.vacation_mode,this.error=""}instant(C,H){let[V,M,r]=C.split("-").map(Number),[e,i]=H.split(":").map(Number);return[V,M,r,e,i].every(t=>Number.isFinite(t))?b2(V,M,r,e,i,this.snapshot.time_zone):null}async submit(C){C.preventDefault();let H=Z(this.hass),V=c(H),M=S(this.hass,H,this.snapshot),r=this.toDate&&this.toTime?this.instant(this.toDate,this.toTime):null;if(!r){this.error=V("vacation.error_end");return}let e=this.later?this.instant(this.fromDate,this.fromTime):null,i=e&&e.getTime()>Date.now()?e:null;if(r.getTime()<=(i??new Date).getTime()){this.error=V("vacation.error_order");return}this.error="";let t=B(J(this.snapshot,this.mode),M),A=h(r.toISOString(),M),n=i?V("vacation.confirm",{from:h(i.toISOString(),M),to:A,temp:t}):V("vacation.confirm_now",{to:A,temp:t});if(await W(this,{heading:V("vacation.title"),message:n,confirm:V("vacation.confirm_button"),cancel:V("common.back")}))try{await y(this.hass).call("vacation/set",{start:i?i.toISOString():null,end:r.toISOString(),mode:this.mode}),this.dialog?.close()}catch(d){w(this,b(d,V))}}render(){if(!this.snapshot)return a;let C=Z(this.hass),H=c(C),V=S(this.hass,C,this.snapshot),M=(r,e)=>p`
      <button
        type="button"
        class="btn option"
        aria-pressed=${this.mode===r?"true":"false"}
        style=${this.mode===r?`background:${P[r]};border-color:${P[r]}`:""}
        @click=${()=>this.mode=r}
      >
        <span class="row"><hs-icon .path=${e}></hs-icon>${H(`mode.${r}`)}</span>
        <small>${B(J(this.snapshot,r),V)}</small>
      </button>
    `;return p`
      <hs-dialog .heading=${H("vacation.title")} .closeLabel=${H("common.cancel")}>
        <form id="form" @submit=${this.submit}>
          <fieldset>
            <legend>${H("vacation.from")}</legend>
            <div class="choice">
              <button
                type="button"
                class="btn"
                aria-pressed=${this.later?"false":"true"}
                @click=${()=>this.later=!1}
              >
                ${H("vacation.now")}
              </button>
              <button
                type="button"
                class="btn"
                aria-pressed=${this.later?"true":"false"}
                @click=${()=>this.later=!0}
              >
                ${H("vacation.later")}
              </button>
            </div>
            ${this.later?p`<div class="pair">
                  <label class="field">
                    <span>${H("vacation.date")}</span>
                    <input
                      class="input"
                      type="date"
                      .value=${this.fromDate}
                      @change=${r=>this.fromDate=r.target.value}
                    />
                  </label>
                  <label class="field">
                    <span>${H("vacation.time")}</span>
                    <input
                      class="input"
                      type="time"
                      step="900"
                      .value=${this.fromTime}
                      @change=${r=>this.fromTime=r.target.value}
                    />
                  </label>
                </div>`:a}
          </fieldset>
          <fieldset>
            <legend>${H("vacation.to")}</legend>
            <div class="pair">
              <label class="field">
                <span>${H("vacation.date")}</span>
                <input
                  class="input"
                  type="date"
                  required
                  .value=${this.toDate}
                  @change=${r=>this.toDate=r.target.value}
                />
              </label>
              <label class="field">
                <span>${H("vacation.time")}</span>
                <input
                  class="input"
                  type="time"
                  step="900"
                  .value=${this.toTime}
                  @change=${r=>this.toTime=r.target.value}
                />
              </label>
            </div>
          </fieldset>
          <fieldset>
            <legend>${H("vacation.temperature")}</legend>
            <div class="choice">
              ${M("frost",A1)} ${M("away",X)}
            </div>
          </fieldset>
          ${this.error?p`<p class="error" role="alert">${this.error}</p>`:a}
        </form>
        <button slot="actions" class="btn" @click=${()=>this.dialog?.close()}>
          ${H("common.cancel")}
        </button>
        <button slot="actions" class="btn primary" type="button" @click=${this.submit}>
          <hs-icon .path=${a1}></hs-icon>${this.later?H("vacation.plan"):H("vacation.start")}
        </button>
      </hs-dialog>
    `}};s("hs-vacation-dialog",P1);async function W2(L,C,H){let V=document.createElement("hs-vacation-dialog");V.hass=C,V.snapshot=H,V.prepare(),(L.shadowRoot??L).appendChild(V),await V.updateComplete;let M=V.dialog;M&&(M.addEventListener("hs-closed",()=>V.remove(),{once:!0}),await M.show())}var T1=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[u,x`
      :host {
        display: block;
      }
      .wrap {
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      h2 {
        font-size: 17px;
        font-weight: 600;
      }
      .modes {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }
      .mode {
        min-height: 72px;
        padding: 6px 4px;
        flex-direction: column;
        gap: 4px;
        font-size: 16px;
        --hs-icon-size: 28px;
      }
      .mode[aria-pressed="true"] {
        color: #fff;
        border-color: transparent;
      }
      .banner {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border-radius: 14px;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }
      .banner span {
        flex: 1 1 220px;
      }
      .banner .btn {
        flex: 1 1 220px;
        background: #fff;
        color: #1f1f1f;
        border-color: #fff;
      }
      .planned {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px;
        font-size: 17px;
      }
      .planned span {
        flex: 1 1 220px;
      }
      @media (max-width: 380px) {
        .mode {
          font-size: 14px;
        }
      }
    `]}get t(){return c(Z(this.hass))}async setMode(C){let H=this.t,V=this.snapshot,M=S(this.hass,Z(this.hass),V);if(C!==V.house.effective){if(C==="vacation"){await W2(this,this.hass,V);return}if(C==="away"){let r=B(J(V,"away"),M);if(!await W(this,{heading:H("house.away"),message:H("house.confirm.away",{temp:r}),confirm:H("house.confirm.away_button"),cancel:H("common.cancel")}))return}C==="off"&&!await W(this,{heading:H("house.off"),message:H("house.confirm.off"),confirm:H("house.confirm.off_button"),cancel:H("common.cancel"),danger:!0})||await this.send("house_mode/set",{mode:C})}}async cancelPlanned(){let C=this.t;await W(this,{heading:C("house.vacation"),message:C("house.confirm.cancel_vacation"),confirm:C("house.confirm.cancel_vacation_button"),cancel:C("common.back")})&&await this.send("vacation/cancel",{})}async send(C,H){this.busy=!0;try{await y(this.hass).call(C,H)}catch(V){w(this,b(V,this.t))}finally{this.busy=!1}}banner(){let C=this.t,H=this.snapshot.house,V=S(this.hass,Z(this.hass),this.snapshot),M;if(H.effective==="vacation"){let e=H.vacation?.end;M=e?C("house.banner.vacation",{until:h(e,V)}):C("house.banner.vacation_open")}else H.effective==="away"?M=C("house.banner.away"):M=C("house.banner.off");let r=H.effective==="off"?C("house.heating_on"):C("house.home_again");return p`
      <div class="banner" role="status" style="background:${b1[H.effective]}">
        <span>${M}</span>
        <button class="btn" ?disabled=${this.busy} @click=${()=>this.send("house_mode/set",{mode:"auto"})}>
          <hs-icon .path=${r2}></hs-icon>${r}
        </button>
      </div>
    `}planned(){let C=this.snapshot.house.vacation;if(!C||C.active)return a;let H=this.t,V=S(this.hass,Z(this.hass),this.snapshot),M=h(C.start,V),r=C.end?H("house.planned",{from:M,to:h(C.end,V)}):H("house.planned_open",{from:M});return p`
      <div class="planned">
        <span>${r}</span>
        <button class="btn small" ?disabled=${this.busy} @click=${this.cancelPlanned}>
          ${H("house.cancel_planned")}
        </button>
      </div>
    `}render(){if(!this.snapshot||!this.hass)return a;let C=this.t,H=this.snapshot.house.effective;return p`
      <section class="card wrap" aria-label=${C("house.title")}>
        <h2 class="muted">${C("house.title")}</h2>
        <div class="modes" role="group" aria-label=${C("house.title")}>
          ${N2.map(V=>{let M=V===H;return p`<button
              class="btn mode"
              aria-pressed=${M?"true":"false"}
              style=${M?`background:${b1[V]}`:""}
              ?disabled=${this.busy}
              @click=${()=>this.setMode(V)}
            >
              <hs-icon .path=${E2[V]}></hs-icon>${C(`house.${V}`)}
            </button>`})}
        </div>
        ${H!=="auto"?this.banner():a} ${this.planned()}
      </section>
    `}};s("hs-house-strip",T1);var F1=class extends l{static{this.properties={hass:{attribute:!1},room:{attribute:!1}}}static{this.styles=[u,x`
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      li {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      li hs-icon {
        color: var(--warning-color, #e65100);
        --hs-icon-size: 28px;
      }
      .since {
        display: block;
        font-size: 15px;
      }
      .details {
        margin: 18px 0 0;
        font-size: 15px;
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}async retry(){let C=c(Z(this.hass));try{await y(this.hass).call("reconcile"),this.dialog?.close()}catch(H){w(this,b(H,C))}}valveName(C){let V=this.hass.states[C]?.attributes.friendly_name;return typeof V=="string"?V:C}render(){let C=Z(this.hass),H=c(C),V=S(this.hass,C);return p`
      <hs-dialog .heading=${H("health.title",{room:this.room.name})} .closeLabel=${H("common.close")}>
        <ul>
          ${this.room.issues.map(M=>p`<li>
              <hs-icon .path=${o1}></hs-icon>
              <span>
                ${H(`health.${M.kind}`,{name:this.valveName(M.entity_id)})}
                ${M.since?p`<span class="since muted">
                      ${H("health.since",{time:h(M.since,V)})}
                    </span>`:""}
              </span>
            </li>`)}
        </ul>
        <p class="details muted">${H("health.details")}</p>
        <button slot="actions" class="btn" @click=${()=>this.dialog?.close()}>
          ${H("common.close")}
        </button>
        <button slot="actions" class="btn primary" @click=${this.retry}>
          <hs-icon .path=${d2}></hs-icon>${H("health.retry")}
        </button>
      </hs-dialog>
    `}};s("hs-health-dialog",F1);async function $2(L,C,H){let V=document.createElement("hs-health-dialog");V.hass=C,V.room=H,(L.shadowRoot??L).appendChild(V),await V.updateComplete;let M=V.dialog;M&&(M.addEventListener("hs-closed",()=>V.remove(),{once:!0}),await M.show())}var v1=.5,A5=5,d5=30,m5=1e3;function p5(L){return Math.min(d5,Math.max(A5,Math.round(L/v1)*v1))}var R1=class extends l{constructor(){super();this.timer=null;this.sentAt=0;this.pendingRoom=null;this.pending=null,this.sending=!1,this.compact=!1}static{this.properties={hass:{attribute:!1},room:{attribute:!1},snapshot:{attribute:!1},compact:{type:Boolean,reflect:!0},pending:{state:!0},sending:{state:!0}}}static{this.styles=[u,x`
      :host {
        display: block;
      }
      .tile {
        padding: 18px 18px 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        height: 100%;
        border-left: 8px solid transparent;
      }
      .tile.manual {
        border-left-color: ${U(P.manual)};
      }
      header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      h2 {
        flex: 1;
        font-size: 22px;
        line-height: 1.25;
        font-weight: 700;
        overflow-wrap: anywhere;
      }
      .warn {
        width: 52px;
        height: 52px;
        margin: -10px -8px -8px 0;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--warning-color, #e65100);
        cursor: pointer;
        --hs-icon-size: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .current {
        font-size: 18px;
      }
      .current strong {
        font-size: 24px;
        font-weight: 700;
      }
      .control {
        display: grid;
        grid-template-columns: 72px 1fr 72px;
        align-items: center;
        gap: 8px;
      }
      .round {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 2px solid var(--divider-color, #c4c4c4);
        background: var(--secondary-background-color, #f2f2f2);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        --hs-icon-size: 36px;
        touch-action: manipulation;
      }
      .round:active {
        transform: scale(0.96);
      }
      .target {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .target .label {
        font-size: 15px;
      }
      .target .value {
        font-size: 44px;
        font-weight: 700;
        line-height: 1.1;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .target .value.off {
        font-size: 30px;
      }
      .target .hint {
        font-size: 14px;
        min-height: 18px;
      }
      .status {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px 12px;
      }
      .next {
        font-size: 18px;
        line-height: 1.35;
      }
      .note {
        font-size: 16px;
      }
      .back {
        border-color: ${U(P.manual)};
        color: var(--primary-text-color);
        min-height: 56px;
        font-size: 18px;
      }
      :host([compact]) .tile {
        padding: 12px 14px;
        gap: 6px;
      }
      :host([compact]) .control {
        grid-template-columns: 56px 1fr 56px;
      }
      :host([compact]) .round {
        width: 56px;
        height: 56px;
      }
      :host([compact]) .target .value {
        font-size: 34px;
      }
    `]}disconnectedCallback(){super.disconnectedCallback(),this.timer&&(clearTimeout(this.timer),this.timer=null,this.send())}willUpdate(H){H.has("room")&&this.pendingRoom!==null&&this.room.id!==this.pendingRoom&&(this.timer&&(clearTimeout(this.timer),this.timer=null,this.send()),this.pending=null),H.has("room")&&this.pending!==null&&!this.timer&&!this.sending&&(this.room.target?.temperature===this.pending||Date.now()-this.sentAt>4e3)&&(this.pending=null)}get t(){return c(Z(this.hass))}comfort(){return _2(this.room,this.snapshot).comfort??21}step(H){let V=this.pending??this.room.target?.temperature??this.comfort()-H;this.pending===null&&(this.pendingRoom=this.room.id),this.pending=p5(V+H),this.timer&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null,this.send()},m5)}async send(){let H=this.pending,V=this.pendingRoom??this.room.id;if(H!==null){this.sending=!0;try{await y(this.hass).call("override/set",{room_id:V,temperature:H}),this.sentAt=Date.now()}catch(M){this.pending=null,w(this,b(M,this.t))}finally{this.sending=!1}}}async backToPlan(){this.timer&&(clearTimeout(this.timer),this.timer=null),this.pending=null;try{await y(this.hass).call("override/clear",{room_id:this.room.id})}catch(H){w(this,b(H,this.t))}}showHealth(){$2(this,this.hass,this.room)}render(){let H=this.room,V=H.target;if(!H||!this.snapshot||!this.hass)return a;let M=this.t,r=S(this.hass,Z(this.hass),this.snapshot),e=new Date,t=this.snapshot.house.effective==="auto"&&V!==null,A=V?.source==="manual",n=this.pending??V?.temperature??null,o=this.pending===null&&V!==null&&V.temperature===null,d=this.pending!==null?"manual":V?.mode??"off",m=R2(H,this.hass),v=null;return V&&(v=V.source==="plan"||V.source==="manual"?F2(V,e,r,M):T2(V,e,r,M)),p`
      <article class="tile card ${A||this.pending!==null?"manual":""}">
        <header>
          <h2>${H.name}</h2>
          ${H.issues.length?p`<button class="warn" @click=${this.showHealth} aria-label=${M("room.problem")}>
                <hs-icon .path=${o1}></hs-icon>
              </button>`:a}
        </header>
        <div class="current">${M("room.now")} <strong>${B(m,r)}</strong></div>
        <div class="control">
          ${t?p`<button class="round" @click=${()=>this.step(-v1)} aria-label=${M("room.cooler")}>
                <hs-icon .path=${i2}></hs-icon>
              </button>`:p`<span></span>`}
          <div class="target" aria-live="polite">
            <span class="label muted">${M("room.set_to")}</span>
            <span class="value ${o?"off":""}">
              ${o?M("room.off"):B(n,r)}
            </span>
            <span class="hint muted">${this.sending?M("room.sending"):""}</span>
          </div>
          ${t?p`<button class="round" @click=${()=>this.step(v1)} aria-label=${M("room.warmer")}>
                <hs-icon .path=${o2}></hs-icon>
              </button>`:p`<span></span>`}
        </div>
        <div class="status">
          <span class="chip" style="background:${P[d]}">
            <hs-icon .path=${D2[d]}></hs-icon>${Y(d,M)}
          </span>
          ${v?p`<span class="next">${v}</span>`:a}
        </div>
        ${H.trvs.length===0?p`<div class="note muted">${M("room.no_trvs")}</div>`:a}
        ${A&&t?p`<button class="btn wide back" @click=${this.backToPlan}>
              <hs-icon .path=${V2}></hs-icon>${M("room.back_to_plan")}
            </button>`:a}
      </article>
    `}};s("hs-room-tile",R1);export{x as a,p as b,a as c,l as d,P5 as e,T5 as f,F5 as g,R5 as h,D5 as i,E5 as j,_5 as k,r2 as l,N5 as m,i2 as n,W5 as o,o2 as p,$5 as q,d2 as r,I5 as s,z5 as t,s as u,Z as v,c as w,x2 as x,u as y,S as z,B as A,N as B,h as C,y as D,b as E,w as F,W as G,f3 as H,P as I,D2 as J,Z3 as K,s3 as L,A3 as M};
