var X=globalThis,Y=X.ShadowRoot&&(X.ShadyCSS===void 0||X.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,t1=Symbol(),y1=new WeakMap,N=class{constructor(C,H,V){if(this._$cssResult$=!0,V!==t1)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=C,this.t=H}get styleSheet(){let C=this.o,H=this.t;if(Y&&C===void 0){let V=H!==void 0&&H.length===1;V&&(C=y1.get(H)),C===void 0&&((this.o=C=new CSSStyleSheet).replaceSync(this.cssText),V&&y1.set(H,C))}return C}toString(){return this.cssText}},W=M=>new N(typeof M=="string"?M:M+"",void 0,t1),n=(M,...C)=>{let H=M.length===1?M[0]:C.reduce((V,L,r)=>V+(e=>{if(e._$cssResult$===!0)return e.cssText;if(typeof e=="number")return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+M[r+1],M[0]);return new N(H,M,t1)},b1=(M,C)=>{if(Y)M.adoptedStyleSheets=C.map(H=>H instanceof CSSStyleSheet?H:H.styleSheet);else for(let H of C){let V=document.createElement("style"),L=X.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=H.cssText,M.appendChild(V)}},i1=Y?M=>M:M=>M instanceof CSSStyleSheet?(C=>{let H="";for(let V of C.cssRules)H+=V.cssText;return W(H)})(M):M;var{is:h2,defineProperty:O2,getOwnPropertyDescriptor:g2,getOwnPropertyNames:f2,getOwnPropertySymbols:k2,getPrototypeOf:y2}=Object,J=globalThis,w1=J.trustedTypes,b2=w1?w1.emptyScript:"",w2=J.reactiveElementPolyfillSupport,$=(M,C)=>M,o1={toAttribute(M,C){switch(C){case Boolean:M=M?b2:null;break;case Object:case Array:M=M==null?M:JSON.stringify(M)}return M},fromAttribute(M,C){let H=M;switch(C){case Boolean:H=M!==null;break;case Number:H=M===null?null:Number(M);break;case Object:case Array:try{H=JSON.parse(M)}catch{H=null}}return H}},P1=(M,C)=>!h2(M,C),B1={attribute:!0,type:String,converter:o1,reflect:!1,useDefault:!1,hasChanged:P1};Symbol.metadata??=Symbol("metadata"),J.litPropertyMetadata??=new WeakMap;var h=class extends HTMLElement{static addInitializer(C){this._$Ei(),(this.l??=[]).push(C)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(C,H=B1){if(H.state&&(H.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(C)&&((H=Object.create(H)).wrapped=!0),this.elementProperties.set(C,H),!H.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(C,V,H);L!==void 0&&O2(this.prototype,C,L)}}static getPropertyDescriptor(C,H,V){let{get:L,set:r}=g2(this.prototype,C)??{get(){return this[H]},set(e){this[H]=e}};return{get:L,set(e){let i=L?.call(this);r?.call(this,e),this.requestUpdate(C,i,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(C){return this.elementProperties.get(C)??B1}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;let C=y2(this);C.finalize(),C.l!==void 0&&(this.l=[...C.l]),this.elementProperties=new Map(C.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){let H=this.properties,V=[...f2(H),...k2(H)];for(let L of V)this.createProperty(L,H[L])}let C=this[Symbol.metadata];if(C!==null){let H=litPropertyMetadata.get(C);if(H!==void 0)for(let[V,L]of H)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[H,V]of this.elementProperties){let L=this._$Eu(H,V);L!==void 0&&this._$Eh.set(L,H)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(C){let H=[];if(Array.isArray(C)){let V=new Set(C.flat(1/0).reverse());for(let L of V)H.unshift(i1(L))}else C!==void 0&&H.push(i1(C));return H}static _$Eu(C,H){let V=H.attribute;return V===!1?void 0:typeof V=="string"?V:typeof C=="string"?C.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(C=>this.enableUpdating=C),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(C=>C(this))}addController(C){(this._$EO??=new Set).add(C),this.renderRoot!==void 0&&this.isConnected&&C.hostConnected?.()}removeController(C){this._$EO?.delete(C)}_$E_(){let C=new Map,H=this.constructor.elementProperties;for(let V of H.keys())this.hasOwnProperty(V)&&(C.set(V,this[V]),delete this[V]);C.size>0&&(this._$Ep=C)}createRenderRoot(){let C=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return b1(C,this.constructor.elementStyles),C}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(C=>C.hostConnected?.())}enableUpdating(C){}disconnectedCallback(){this._$EO?.forEach(C=>C.hostDisconnected?.())}attributeChangedCallback(C,H,V){this._$AK(C,V)}_$ET(C,H){let V=this.constructor.elementProperties.get(C),L=this.constructor._$Eu(C,V);if(L!==void 0&&V.reflect===!0){let r=(V.converter?.toAttribute!==void 0?V.converter:o1).toAttribute(H,V.type);this._$Em=C,r==null?this.removeAttribute(L):this.setAttribute(L,r),this._$Em=null}}_$AK(C,H){let V=this.constructor,L=V._$Eh.get(C);if(L!==void 0&&this._$Em!==L){let r=V.getPropertyOptions(L),e=typeof r.converter=="function"?{fromAttribute:r.converter}:r.converter?.fromAttribute!==void 0?r.converter:o1;this._$Em=L;let i=e.fromAttribute(H,r.type);this[L]=i??this._$Ej?.get(L)??i,this._$Em=null}}requestUpdate(C,H,V,L=!1,r){if(C!==void 0){let e=this.constructor;if(L===!1&&(r=this[C]),V??=e.getPropertyOptions(C),!((V.hasChanged??P1)(r,H)||V.useDefault&&V.reflect&&r===this._$Ej?.get(C)&&!this.hasAttribute(e._$Eu(C,V))))return;this.C(C,H,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(C,H,{useDefault:V,reflect:L,wrapped:r},e){V&&!(this._$Ej??=new Map).has(C)&&(this._$Ej.set(C,e??H??this[C]),r!==!0||e!==void 0)||(this._$AL.has(C)||(this.hasUpdated||V||(H=void 0),this._$AL.set(C,H)),L===!0&&this._$Em!==C&&(this._$Eq??=new Set).add(C))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(H){Promise.reject(H)}let C=this.scheduleUpdate();return C!=null&&await C,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,r]of this._$Ep)this[L]=r;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,r]of V){let{wrapped:e}=r,i=this[L];e!==!0||this._$AL.has(L)||i===void 0||this.C(L,void 0,r,i)}}let C=!1,H=this._$AL;try{C=this.shouldUpdate(H),C?(this.willUpdate(H),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(H)):this._$EM()}catch(V){throw C=!1,this._$EM(),V}C&&this._$AE(H)}willUpdate(C){}_$AE(C){this._$EO?.forEach(H=>H.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(C)),this.updated(C)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(C){return!0}update(C){this._$Eq&&=this._$Eq.forEach(H=>this._$ET(H,this[H])),this._$EM()}updated(C){}firstUpdated(C){}};h.elementStyles=[],h.shadowRootOptions={mode:"open"},h[$("elementProperties")]=new Map,h[$("finalized")]=new Map,w2?.({ReactiveElement:h}),(J.reactiveElementVersions??=[]).push("2.1.2");var v1=globalThis,T1=M=>M,C1=v1.trustedTypes,F1=C1?C1.createPolicy("lit-html",{createHTML:M=>M}):void 0,W1="$lit$",w=`lit$${Math.random().toFixed(9).slice(2)}$`,$1="?"+w,B2=`<${$1}>`,T=document,U=()=>T.createComment(""),z=M=>M===null||typeof M!="object"&&typeof M!="function",l1=Array.isArray,P2=M=>l1(M)||typeof M?.[Symbol.iterator]=="function",a1=`[ 	
\f\r]`,I=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R1=/-->/g,D1=/>/g,B=RegExp(`>|${a1}(?:([^\\s"'>=/]+)(${a1}*=${a1}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),E1=/'/g,_1=/"/g,I1=/^(?:script|style|textarea|title)$/i,x1=M=>(C,...H)=>({_$litType$:M,strings:C,values:H}),a=x1(1),Y2=x1(2),J2=x1(3),F=Symbol.for("lit-noChange"),o=Symbol.for("lit-nothing"),N1=new WeakMap,P=T.createTreeWalker(T,129);function U1(M,C){if(!l1(M)||!M.hasOwnProperty("raw"))throw Error("invalid template strings array");return F1!==void 0?F1.createHTML(C):C}var T2=(M,C)=>{let H=M.length-1,V=[],L,r=C===2?"<svg>":C===3?"<math>":"",e=I;for(let i=0;i<H;i++){let t=M[i],d,m,A=-1,v=0;for(;v<t.length&&(e.lastIndex=v,m=e.exec(t),m!==null);)v=e.lastIndex,e===I?m[1]==="!--"?e=R1:m[1]!==void 0?e=D1:m[2]!==void 0?(I1.test(m[2])&&(L=RegExp("</"+m[2],"g")),e=B):m[3]!==void 0&&(e=B):e===B?m[0]===">"?(e=L??I,A=-1):m[1]===void 0?A=-2:(A=e.lastIndex-m[2].length,d=m[1],e=m[3]===void 0?B:m[3]==='"'?_1:E1):e===_1||e===E1?e=B:e===R1||e===D1?e=I:(e=B,L=void 0);let u=e===B&&M[i+1].startsWith("/>")?" ":"";r+=e===I?t+B2:A>=0?(V.push(d),t.slice(0,A)+W1+t.slice(A)+w+u):t+w+(A===-2?i:u)}return[U1(M,r+(M[H]||"<?>")+(C===2?"</svg>":C===3?"</math>":"")),V]},Q=class M{constructor({strings:C,_$litType$:H},V){let L;this.parts=[];let r=0,e=0,i=C.length-1,t=this.parts,[d,m]=T2(C,H);if(this.el=M.createElement(d,V),P.currentNode=this.el.content,H===2||H===3){let A=this.el.content.firstChild;A.replaceWith(...A.childNodes)}for(;(L=P.nextNode())!==null&&t.length<i;){if(L.nodeType===1){if(L.hasAttributes())for(let A of L.getAttributeNames())if(A.endsWith(W1)){let v=m[e++],u=L.getAttribute(A).split(w),b=/([.?@])?(.*)/.exec(v);t.push({type:1,index:r,name:b[2],strings:u,ctor:b[1]==="."?d1:b[1]==="?"?m1:b[1]==="@"?p1:E}),L.removeAttribute(A)}else A.startsWith(w)&&(t.push({type:6,index:r}),L.removeAttribute(A));if(I1.test(L.tagName)){let A=L.textContent.split(w),v=A.length-1;if(v>0){L.textContent=C1?C1.emptyScript:"";for(let u=0;u<v;u++)L.append(A[u],U()),P.nextNode(),t.push({type:2,index:++r});L.append(A[v],U())}}}else if(L.nodeType===8)if(L.data===$1)t.push({type:2,index:r});else{let A=-1;for(;(A=L.data.indexOf(w,A+1))!==-1;)t.push({type:7,index:r}),A+=w.length-1}r++}}static createElement(C,H){let V=T.createElement("template");return V.innerHTML=C,V}};function D(M,C,H=M,V){if(C===F)return C;let L=V!==void 0?H._$Co?.[V]:H._$Cl,r=z(C)?void 0:C._$litDirective$;return L?.constructor!==r&&(L?._$AO?.(!1),r===void 0?L=void 0:(L=new r(M),L._$AT(M,H,V)),V!==void 0?(H._$Co??=[])[V]=L:H._$Cl=L),L!==void 0&&(C=D(M,L._$AS(M,C.values),L,V)),C}var A1=class{constructor(C,H){this._$AV=[],this._$AN=void 0,this._$AD=C,this._$AM=H}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(C){let{el:{content:H},parts:V}=this._$AD,L=(C?.creationScope??T).importNode(H,!0);P.currentNode=L;let r=P.nextNode(),e=0,i=0,t=V[0];for(;t!==void 0;){if(e===t.index){let d;t.type===2?d=new G(r,r.nextSibling,this,C):t.type===1?d=new t.ctor(r,t.name,t.strings,this,C):t.type===6&&(d=new n1(r,this,C)),this._$AV.push(d),t=V[++i]}e!==t?.index&&(r=P.nextNode(),e++)}return P.currentNode=T,L}p(C){let H=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(C,V,H),H+=V.strings.length-2):V._$AI(C[H])),H++}},G=class M{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(C,H,V,L){this.type=2,this._$AH=o,this._$AN=void 0,this._$AA=C,this._$AB=H,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let C=this._$AA.parentNode,H=this._$AM;return H!==void 0&&C?.nodeType===11&&(C=H.parentNode),C}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(C,H=this){C=D(this,C,H),z(C)?C===o||C==null||C===""?(this._$AH!==o&&this._$AR(),this._$AH=o):C!==this._$AH&&C!==F&&this._(C):C._$litType$!==void 0?this.$(C):C.nodeType!==void 0?this.T(C):P2(C)?this.k(C):this._(C)}O(C){return this._$AA.parentNode.insertBefore(C,this._$AB)}T(C){this._$AH!==C&&(this._$AR(),this._$AH=this.O(C))}_(C){this._$AH!==o&&z(this._$AH)?this._$AA.nextSibling.data=C:this.T(T.createTextNode(C)),this._$AH=C}$(C){let{values:H,_$litType$:V}=C,L=typeof V=="number"?this._$AC(C):(V.el===void 0&&(V.el=Q.createElement(U1(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(H);else{let r=new A1(L,this),e=r.u(this.options);r.p(H),this.T(e),this._$AH=r}}_$AC(C){let H=N1.get(C.strings);return H===void 0&&N1.set(C.strings,H=new Q(C)),H}k(C){l1(this._$AH)||(this._$AH=[],this._$AR());let H=this._$AH,V,L=0;for(let r of C)L===H.length?H.push(V=new M(this.O(U()),this.O(U()),this,this.options)):V=H[L],V._$AI(r),L++;L<H.length&&(this._$AR(V&&V._$AB.nextSibling,L),H.length=L)}_$AR(C=this._$AA.nextSibling,H){for(this._$AP?.(!1,!0,H);C!==this._$AB;){let V=T1(C).nextSibling;T1(C).remove(),C=V}}setConnected(C){this._$AM===void 0&&(this._$Cv=C,this._$AP?.(C))}},E=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(C,H,V,L,r){this.type=1,this._$AH=o,this._$AN=void 0,this.element=C,this.name=H,this._$AM=L,this.options=r,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=o}_$AI(C,H=this,V,L){let r=this.strings,e=!1;if(r===void 0)C=D(this,C,H,0),e=!z(C)||C!==this._$AH&&C!==F,e&&(this._$AH=C);else{let i=C,t,d;for(C=r[0],t=0;t<r.length-1;t++)d=D(this,i[V+t],H,t),d===F&&(d=this._$AH[t]),e||=!z(d)||d!==this._$AH[t],d===o?C=o:C!==o&&(C+=(d??"")+r[t+1]),this._$AH[t]=d}e&&!L&&this.j(C)}j(C){C===o?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,C??"")}},d1=class extends E{constructor(){super(...arguments),this.type=3}j(C){this.element[this.name]=C===o?void 0:C}},m1=class extends E{constructor(){super(...arguments),this.type=4}j(C){this.element.toggleAttribute(this.name,!!C&&C!==o)}},p1=class extends E{constructor(C,H,V,L,r){super(C,H,V,L,r),this.type=5}_$AI(C,H=this){if((C=D(this,C,H,0)??o)===F)return;let V=this._$AH,L=C===o&&V!==o||C.capture!==V.capture||C.once!==V.once||C.passive!==V.passive,r=C!==o&&(V===o||L);L&&this.element.removeEventListener(this.name,this,V),r&&this.element.addEventListener(this.name,this,C),this._$AH=C}handleEvent(C){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,C):this._$AH.handleEvent(C)}},n1=class{constructor(C,H,V){this.element=C,this.type=6,this._$AN=void 0,this._$AM=H,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(C){D(this,C)}};var F2=v1.litHtmlPolyfillSupport;F2?.(Q,G),(v1.litHtmlVersions??=[]).push("3.3.3");var z1=(M,C,H)=>{let V=H?.renderBefore??C,L=V._$litPart$;if(L===void 0){let r=H?.renderBefore??null;V._$litPart$=L=new G(C.insertBefore(U(),r),r,void 0,H??{})}return L._$AI(M),L};var Z1=globalThis,p=class extends h{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let C=super.createRenderRoot();return this.renderOptions.renderBefore??=C.firstChild,C}update(C){let H=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(C),this._$Do=z1(H,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}};p._$litElement$=!0,p.finalized=!0,Z1.litElementHydrateSupport?.({LitElement:p});var R2=Z1.litElementPolyfillSupport;R2?.({LitElement:p});(Z1.litElementVersions??=[]).push("4.2.2");var H1="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";var d5="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z";var V1="M17.03 6C18.11 6 19 6.88 19 8V19C19 20.13 18.11 21 17.03 21C17.03 21.58 16.56 22 16 22C15.5 22 15 21.58 15 21H9C9 21.58 8.5 22 8 22C7.44 22 6.97 21.58 6.97 21C5.89 21 5 20.13 5 19V8C5 6.88 5.89 6 6.97 6H9V3C9 2.42 9.46 2 10 2H14C14.54 2 15 2.42 15 3V6H17.03M13.5 6V3.5H10.5V6H13.5M8 9V18H9.5V9H8M14.5 9V18H16V9H14.5M11.25 9V18H12.75V9H11.25Z";var m5="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z";var Q1="M18,11V12.5C21.19,12.5 23.09,16.05 21.33,18.71L20.24,17.62C21.06,15.96 19.85,14 18,14V15.5L15.75,13.25L18,11M18,22V20.5C14.81,20.5 12.91,16.95 14.67,14.29L15.76,15.38C14.94,17.04 16.15,19 18,19V17.5L20.25,19.75L18,22M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H14C13.36,20.45 12.86,19.77 12.5,19H5V8H19V10.59C19.71,10.7 20.39,10.94 21,11.31V5A2,2 0 0,0 19,3Z";var p5="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";var G1="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";var n5="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";var v5="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var K1="M13 24C9.74 24 6.81 22 5.6 19L2.57 11.37C2.26 10.58 3 9.79 3.81 10.05L4.6 10.31C5.16 10.5 5.62 10.92 5.84 11.47L7.25 15H8V3.25C8 2.56 8.56 2 9.25 2S10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 .56 12.06 0 12.75 0S14 .56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5S21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z";var K="M24 13L20 17V14H11V12H20V9L24 13M4 20V12H1L11 3L18 9.3V10H15.79L11 5.69L6 10.19V18H16V16H18V20H4Z";var j1="M15 13L11 17V14H2V12H11V9L15 13M5 20V16H7V18H17V10.19L12 5.69L7.21 10H4.22L12 3L22 12H19V20H5Z";var q1="M19 8C20.11 8 21 8.9 21 10V16.76C21.61 17.31 22 18.11 22 19C22 20.66 20.66 22 19 22C17.34 22 16 20.66 16 19C16 18.11 16.39 17.31 17 16.76V10C17 8.9 17.9 8 19 8M19 9C18.45 9 18 9.45 18 10V11H20V10C20 9.45 19.55 9 19 9M12 5.69L7 10.19V18H14.1L14 19L14.1 20H5V12H2L12 3L16.4 6.96C15.89 7.4 15.5 7.97 15.25 8.61L12 5.69Z";var X1="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z";var l5="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z";var Y1="M19,13H5V11H19V13Z";var x5="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var J1="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";var Z5="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";var C2="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13";var H2="M3.28,2L2,3.27L4.77,6.04L5.64,7.39L4.22,9.6L5.95,10.5L7.23,8.5L10.73,12H4A2,2 0 0,0 2,14V22H4V20H18.73L20,21.27V22H22V20.73L22,20.72V20.72L3.28,2M7,17A1,1 0 0,1 6,18A1,1 0 0,1 5,17V15A1,1 0 0,1 6,14A1,1 0 0,1 7,15V17M11,17A1,1 0 0,1 10,18A1,1 0 0,1 9,17V15A1,1 0 0,1 10,14A1,1 0 0,1 11,15V17M15,17A1,1 0 0,1 14,18A1,1 0 0,1 13,17V15C13,14.79 13.08,14.61 13.18,14.45L15,16.27V17M16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5M22,14V18.18L19,15.18V15A1,1 0 0,0 18,14C17.95,14 17.9,14 17.85,14.03L15.82,12H20C21.11,12 22,12.9 22,14M11.64,7.3L10.22,5.1L12.22,2L13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L12.84,9L11.44,7.62L11.64,7.3M7.5,3.69L6.1,2.28L6.22,2.09L7.95,3L7.5,3.69Z";var V2="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z";var L1="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z";var s5="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z";var u5="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z";var L2="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z";var M2="M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13";function x(M,C){customElements.get(M)||customElements.define(M,C)}var Z=n`
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
`;var r2={"app.title":"Topen\xED","nav.home":"P\u0159ehled","nav.plans":"Pl\xE1ny","nav.advanced":"Roz\u0161\xED\u0159en\xE9","nav.menu":"Nab\xEDdka","common.save":"Ulo\u017Eit","common.cancel":"Zru\u0161it","common.back":"Zp\u011Bt","common.close":"Zav\u0159\xEDt","common.delete":"Smazat","common.edit":"Upravit","common.add":"P\u0159idat","common.yes":"Ano","common.no":"Ne","common.loading":"Na\u010D\xEDt\xE1m\u2026","common.not_loaded":"Pl\xE1nova\u010D topen\xED neb\u011B\u017E\xED. Zkontrolujte integraci v Nastaven\xED.","mode.comfort":"Teplo","mode.eco":"\xDAspora","mode.night":"Noc","mode.away":"Pry\u010D","mode.frost":"Proti mrazu","mode.off":"Vypnuto","mode.manual":"Ru\u010Dn\u011B","house.auto":"Norm\xE1ln\u011B","house.away":"Pry\u010D","house.vacation":"Dovolen\xE1","house.off":"Vypnuto","house.title":"Cel\xFD d\u016Fm","house.banner.away":"Cel\xFD d\u016Fm je v re\u017Eimu Pry\u010D.","house.banner.vacation":"Dovolen\xE1 do {until}.","house.banner.vacation_open":"Dovolen\xE1 je zapnut\xE1.","house.banner.off":"Topen\xED je v cel\xE9m dom\u011B vypnut\xE9.","house.home_again":"Jsem doma \u2014 Norm\xE1ln\u011B","house.heating_on":"Zapnout topen\xED \u2014 Norm\xE1ln\u011B","house.planned":"Napl\xE1novan\xE1 dovolen\xE1: {from} \u2013 {to}","house.planned_open":"Napl\xE1novan\xE1 dovolen\xE1 od {from}","house.cancel_planned":"Zru\u0161it dovolenou","house.confirm.away":"P\u0159epnout cel\xFD d\u016Fm na Pry\u010D? V\u0161echny m\xEDstnosti budou na {temp}.","house.confirm.away_button":"Ano, p\u0159epnout na Pry\u010D","house.confirm.off":"Vypnout topen\xED v cel\xE9m dom\u011B?","house.confirm.off_button":"Ano, vypnout","house.confirm.end_vacation":"Ukon\u010Dit dovolenou hned?","house.confirm.end_vacation_button":"Ano, ukon\u010Dit dovolenou","house.confirm.cancel_vacation":"Zru\u0161it napl\xE1novanou dovolenou?","house.confirm.cancel_vacation_button":"Ano, zru\u0161it","room.now":"V m\xEDstnosti","room.set_to":"Nastaveno","room.until_next":"do {until} \u2192 {next}","room.until":"do {until}","room.by_hand_until":"Ru\u010Dn\u011B zm\u011Bn\u011Bno do {until}","room.back_to_plan":"Zp\u011Bt na pl\xE1n","room.warmer":"Tepleji","room.cooler":"Chladn\u011Bji","room.no_trvs":"Zat\xEDm bez hlavic.","room.problem":"N\u011Bco nen\xED v po\u0159\xE1dku. Klepn\u011Bte pro podrobnosti.","room.off":"Topen\xED je vypnut\xE9","room.sending":"Pos\xEDl\xE1m\u2026","reason.plan":"Pl\xE1n: {mode}","reason.manual":"Ru\u010Dn\u011B zm\u011Bn\u011Bno","reason.house_away":"D\u016Fm: Pry\u010D","reason.vacation":"Dovolen\xE1","reason.house_off":"Topen\xED vypnuto","health.title":"Co se d\u011Bje: {room}","health.unavailable":"Hlavice {name} neodpov\xEDd\xE1. Zkontrolujte baterie.","health.write_failed":"Hlavice {name} nep\u0159ijala novou teplotu. Za p\xE1r minut to zkus\xEDm znovu.","health.mismatch":"Hlavice {name} m\xE1 jinou teplotu, ne\u017E m\xE1 m\xEDt. Zkus\xEDm to opravit.","health.since":"Od {time}.","health.retry":"Zkusit hned","health.details":"Podrobnosti jsou v \u010D\xE1sti Roz\u0161\xED\u0159en\xE9 \u2192 Hlavice.","vacation.title":"Dovolen\xE1","vacation.from":"Odjezd","vacation.to":"N\xE1vrat","vacation.date":"Datum","vacation.time":"\u010Cas","vacation.now":"Hned","vacation.later":"Pozd\u011Bji","vacation.temperature":"Teplota b\u011Bhem dovolen\xE9","vacation.start":"Zapnout dovolenou","vacation.plan":"Napl\xE1novat dovolenou","vacation.confirm":"Dovolen\xE1 od {from} do {to}. V\u0161echny m\xEDstnosti budou na {temp}.","vacation.confirm_now":"Dovolen\xE1 od te\u010F do {to}. V\u0161echny m\xEDstnosti budou na {temp}.","vacation.confirm_button":"Ano, zapnout dovolenou","vacation.error_end":"Vyberte, kdy se vr\xE1t\xEDte.","vacation.error_order":"N\xE1vrat mus\xED b\xFDt a\u017E po odjezdu.","plans.rooms_title":"Podle jak\xE9ho pl\xE1nu top\xED m\xEDstnosti","plans.own_plan":"Vlastn\xED pl\xE1n","plans.own_plan_name":"{room}","plans.used_by":"Pou\u017E\xEDv\xE1: {rooms}","plans.unused":"Tento pl\xE1n nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","plans.new":"Nov\xFD pl\xE1n","plans.name":"N\xE1zev","plans.start_from":"Za\u010D\xEDt podle","plans.create":"Vytvo\u0159it","plans.delete_confirm":"Smazat pl\xE1n {name}?","plans.delete_confirm_used":"Smazat pl\xE1n {name}? {rooms} bude topit podle pl\xE1nu domu.","plans.edit":"Upravit pl\xE1n","plans.all_plans":"Pl\xE1ny","plans.house_badge":"D\u016Fm","editor.tap_day":"Klepn\u011Bte na den, kter\xFD chcete zm\u011Bnit.","editor.copy_day":"Kop\xEDrovat den do\u2026","editor.copy_title":"Kop\xEDrovat {day} do","editor.workdays":"Pracovn\xED dny","editor.weekend":"V\xEDkend","editor.all_days":"V\u0161echny dny","editor.copy":"Kop\xEDrovat","editor.mode":"Co se m\xE1 d\xEDt","editor.starts":"Za\u010D\xE1tek","editor.ends":"Konec","editor.add_change":"P\u0159idat zm\u011Bnu v {time}","editor.remove":"Odstranit tento \xFAsek","editor.earlier":"O 15 minut d\u0159\xEDve","editor.later":"O 15 minut pozd\u011Bji","editor.preview_title":"Ulo\u017Eit pl\xE1n?","editor.preview_changed":"Zm\u011Bn\u011Bn\xE9 dny jsou ozna\u010Den\xE9 te\u010Dkou.","editor.preview_used":"Pl\xE1n pou\u017E\xEDvaj\xED: {rooms}","editor.preview_unused":"Pl\xE1n zat\xEDm nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","editor.discard":"Zahodit zm\u011Bny?","editor.discard_button":"Zahodit","editor.saved":"Pl\xE1n je ulo\u017Een\xFD.","editor.unsaved":"Zat\xEDm neulo\u017Eeno","editor.parts":"\xDAseky dne","editor.drag_hint":"\u010Casy zm\u011Bn\xEDte posunut\xEDm b\xEDl\xFDch \xFAchyt\u016F, nebo klepn\u011Bte na \xFAsek.","day.0":"Pond\u011Bl\xED","day.1":"\xDAter\xFD","day.2":"St\u0159eda","day.3":"\u010Ctvrtek","day.4":"P\xE1tek","day.5":"Sobota","day.6":"Ned\u011Ble","day.short.0":"Po","day.short.1":"\xDAt","day.short.2":"St","day.short.3":"\u010Ct","day.short.4":"P\xE1","day.short.5":"So","day.short.6":"Ne","adv.rooms":"M\xEDstnosti","adv.temps":"Teploty","adv.settings":"Nastaven\xED","adv.health":"Hlavice","adv.log":"Z\xE1znam","adv.rooms.add":"P\u0159idat m\xEDstnost","adv.rooms.import":"P\u0159idat m\xEDstnosti podle oblast\xED","adv.rooms.import_hint":"Oblasti v Home Assistantu, kter\xE9 maj\xED hlavice:","adv.rooms.import_none":"\u017D\xE1dn\xE1 oblast s hlavicemi nebyla nalezena.","adv.rooms.import_button":"P\u0159idat vybran\xE9","adv.rooms.name":"N\xE1zev","adv.rooms.trvs":"Termostatick\xE9 hlavice","adv.rooms.in_room":"v m\xEDstnosti {room}","adv.rooms.no_climates":"Home Assistant nem\xE1 \u017E\xE1dn\xE9 hlavice (entity climate).","adv.rooms.temperature_entity":"Zobrazen\xE1 teplota","adv.rooms.temperature_auto":"Pr\u016Fm\u011Br z hlavic","adv.rooms.plan":"Pl\xE1n","adv.rooms.temp_set":"Teploty","adv.rooms.delete_confirm":"Smazat m\xEDstnost {name}? Jej\xED hlavice u\u017E nebudou \u0159\xEDzen\xE9.","adv.rooms.move_up":"Posunout nahoru","adv.rooms.move_down":"Posunout dol\u016F","adv.rooms.empty":"Zat\xEDm \u017E\xE1dn\xE9 m\xEDstnosti. P\u0159idejte m\xEDstnost nebo m\xEDstnosti podle oblast\xED v Home Assistantu.","adv.rooms.edit_title":"M\xEDstnost","adv.temps.house":"Teploty domu","adv.temps.house_hint":"Plat\xED pro v\u0161echny m\xEDstnosti, pokud nemaj\xED vlastn\xED sadu.","adv.temps.sets":"Vlastn\xED sady teplot","adv.temps.sets_hint":"Sada m\u011Bn\xED jen n\u011Bkter\xE9 teploty. Ostatn\xED plat\xED jako pro d\u016Fm.","adv.temps.as_house":"jako d\u016Fm ({temp})","adv.temps.own":"vlastn\xED","adv.temps.new":"Nov\xE1 sada","adv.temps.delete_confirm":"Smazat sadu {name}?","adv.temps.delete_confirm_used":"Smazat sadu {name}? {rooms} bude m\xEDt teploty domu.","adv.settings.max_override":"Nejdel\u0161\xED ru\u010Dn\xED zm\u011Bna (hodiny)","adv.settings.max_override_hint":"Zm\u011Bna na hlavici nebo v aplikaci skon\u010D\xED p\u0159i dal\u0161\xED zm\u011Bn\u011B pl\xE1nu, nejpozd\u011Bji ale po t\xE9to dob\u011B.","adv.settings.safety_interval":"Kontrolovat hlavice ka\u017Ed\xFDch (minut)","adv.settings.mismatch_alert":"Upozornit na \u0161patnou teplotu po (minut\xE1ch)","adv.settings.vacation_mode":"Teplota na dovolen\xE9","adv.settings.dry_run":"Zku\u0161ebn\xED re\u017Eim: jen po\u010D\xEDtat, hlavic\xEDm nic nepos\xEDlat","adv.settings.saved":"Nastaven\xED je ulo\u017Een\xE9.","adv.health.all_ok":"V\u0161echny hlavice jsou v po\u0159\xE1dku.","adv.health.check_now":"Zkontrolovat v\u0161echny hlavice","adv.health.phase.idle":"V po\u0159\xE1dku","adv.health.phase.writing":"Pos\xEDl\xE1m","adv.health.phase.waiting":"Nedostupn\xE1","adv.health.phase.failed":"Selhalo","adv.health.wanted":"M\xE1 m\xEDt","adv.health.valve":"Hlavice m\xE1","adv.health.last_write":"Naposledy posl\xE1no","adv.health.error":"Chyba","adv.log.room":"M\xEDstnost","adv.log.empty":"Zat\xEDm nic.","adv.dry_run_banner":"Zku\u0161ebn\xED re\u017Eim: hlavic\xEDm se nic nepos\xEDl\xE1.","log.write":"Odesl\xE1no","log.verified":"Hlavice potvrdila","log.retry":"Bez odpov\u011Bdi, zkou\u0161\xEDm znovu","log.failed":"Selhalo","log.dry_run":"Poslal bych (zku\u0161ebn\xED re\u017Eim)","log.manual":"Zm\u011Bn\u011Bno na hlavici","log.manual_ignored":"Zm\u011Bna na hlavici vr\xE1cena (re\u017Eim domu)","log.override_set":"Zm\u011Bn\u011Bno v aplikaci","log.override_cleared":"Zp\u011Bt na pl\xE1n","log.override_expired":"Ru\u010Dn\xED zm\u011Bna skon\u010Dila","log.unavailable":"Hlavice nedostupn\xE1","log.available":"Hlavice op\u011Bt dostupn\xE1","error.revision_conflict":"Nastaven\xED mezit\xEDm zm\u011Bnil n\u011Bkdo jin\xFD. Str\xE1nka u\u017E ukazuje nov\xFD stav, zkuste to pros\xEDm znovu.","error.house_mode_active":"D\u016Fm nen\xED v re\u017Eimu Norm\xE1ln\u011B.","error.duplicate_name":"Tento n\xE1zev u\u017E existuje.","error.name_required":"Zadejte n\xE1zev.","error.name_too_long":"N\xE1zev je p\u0159\xEDli\u0161 dlouh\xFD.","error.trv_in_two_rooms":"Hlavice m\u016F\u017Ee pat\u0159it jen do jedn\xE9 m\xEDstnosti.","error.invalid_trv":"Termostat m\xEDstnosti nelze pou\u017E\xEDt jako hlavici.","error.plan_empty":"Pl\xE1n je pr\xE1zdn\xFD.","error.temperature_range":"Teplota mus\xED b\xFDt mezi 5 a 30 \xB0C.","error.setting_range":"Tato hodnota je mimo povolen\xFD rozsah.","error.vacation_order":"Dovolen\xE1 mus\xED skon\u010Dit a\u017E po sv\xE9m za\u010D\xE1tku.","error.not_loaded":"Pl\xE1nova\u010D topen\xED neb\u011B\u017E\xED.","error.unknown":"N\u011Bco se nepovedlo: {message}","card.name":"Pl\xE1nova\u010D topen\xED","card.description":"M\xEDstnosti s teplotami, pl\xE1ny a ru\u010Dn\xEDmi zm\u011Bnami.","card.room":"M\xEDstnost","card.all_rooms":"V\u0161echny m\xEDstnosti","card.compact":"Kompaktn\xED seznam","card.show_house":"Zobrazit re\u017Eim domu","card.open_panel":"Otev\u0159\xEDt topen\xED"};var M1={"app.title":"Heating","nav.home":"Overview","nav.plans":"Plans","nav.advanced":"Advanced","nav.menu":"Menu","common.save":"Save","common.cancel":"Cancel","common.back":"Back","common.close":"Close","common.delete":"Delete","common.edit":"Change","common.add":"Add","common.yes":"Yes","common.no":"No","common.loading":"Loading\u2026","common.not_loaded":"The heating scheduler is not running. Check the integration in Settings.","mode.comfort":"Warm","mode.eco":"Saving","mode.night":"Night","mode.away":"Away","mode.frost":"Frost guard","mode.off":"Off","mode.manual":"By hand","house.auto":"Normal","house.away":"Away","house.vacation":"Holiday","house.off":"Off","house.title":"Whole house","house.banner.away":"The whole house is set to Away.","house.banner.vacation":"Holiday until {until}.","house.banner.vacation_open":"Holiday is on.","house.banner.off":"Heating is off in the whole house.","house.home_again":"I'm home \u2014 Normal","house.heating_on":"Turn heating on \u2014 Normal","house.planned":"Holiday planned: {from} \u2013 {to}","house.planned_open":"Holiday planned from {from}","house.cancel_planned":"Cancel holiday","house.confirm.away":"Switch the whole house to Away? All rooms will be kept at {temp}.","house.confirm.away_button":"Yes, switch to Away","house.confirm.off":"Turn off the heating in the whole house?","house.confirm.off_button":"Yes, turn off","house.confirm.end_vacation":"End the holiday now?","house.confirm.end_vacation_button":"Yes, end the holiday","house.confirm.cancel_vacation":"Cancel the planned holiday?","house.confirm.cancel_vacation_button":"Yes, cancel it","room.now":"In the room","room.set_to":"Set to","room.until_next":"until {until} \u2192 {next}","room.until":"until {until}","room.by_hand_until":"Changed by hand until {until}","room.back_to_plan":"Back to plan","room.warmer":"Warmer","room.cooler":"Cooler","room.no_trvs":"No radiator valves yet.","room.problem":"Something is wrong. Tap for details.","room.off":"Heating is off","room.sending":"Sending\u2026","reason.plan":"Plan: {mode}","reason.manual":"Changed by hand","reason.house_away":"House: Away","reason.vacation":"Holiday","reason.house_off":"Heating off","health.title":"What is wrong in {room}","health.unavailable":"The valve {name} does not respond. Check its batteries.","health.write_failed":"The valve {name} did not take the new temperature. It will be tried again in a few minutes.","health.mismatch":"The valve {name} has a different temperature than it should. It will be corrected.","health.since":"Since {time}.","health.retry":"Try again now","health.details":"Details are in Advanced \u2192 Valves.","vacation.title":"Holiday","vacation.from":"Leaving","vacation.to":"Coming back","vacation.date":"Date","vacation.time":"Time","vacation.now":"Now","vacation.later":"Later","vacation.temperature":"Temperature while away","vacation.start":"Turn holiday on","vacation.plan":"Plan the holiday","vacation.confirm":"Holiday from {from} to {to}. All rooms will be kept at {temp}.","vacation.confirm_now":"Holiday from now to {to}. All rooms will be kept at {temp}.","vacation.confirm_button":"Yes, turn holiday on","vacation.error_end":"Choose when you come back.","vacation.error_order":"The return must be after the start.","plans.rooms_title":"Which plan each room follows","plans.own_plan":"Own plan","plans.own_plan_name":"{room}","plans.used_by":"Used by: {rooms}","plans.unused":"No room uses this plan.","plans.new":"New plan","plans.name":"Name","plans.start_from":"Start from","plans.create":"Create","plans.delete_confirm":"Delete the plan {name}?","plans.delete_confirm_used":"Delete the plan {name}? {rooms} will follow the house plan.","plans.edit":"Change plan","plans.all_plans":"Plans","plans.house_badge":"House","editor.tap_day":"Tap a day to change it.","editor.copy_day":"Copy this day to\u2026","editor.copy_title":"Copy {day} to","editor.workdays":"Workdays","editor.weekend":"Weekend","editor.all_days":"All days","editor.copy":"Copy","editor.mode":"What should happen","editor.starts":"Starts","editor.ends":"Ends","editor.add_change":"Add a change at {time}","editor.remove":"Remove this part","editor.earlier":"15 minutes earlier","editor.later":"15 minutes later","editor.preview_title":"Save this plan?","editor.preview_changed":"Changed days are marked with a dot.","editor.preview_used":"This plan is used by: {rooms}","editor.preview_unused":"No room uses this plan yet.","editor.discard":"Discard your changes?","editor.discard_button":"Discard","editor.saved":"The plan is saved.","editor.unsaved":"Not saved yet","editor.parts":"Parts of the day","editor.drag_hint":"Drag the white handles to change times, or tap a part.","day.0":"Monday","day.1":"Tuesday","day.2":"Wednesday","day.3":"Thursday","day.4":"Friday","day.5":"Saturday","day.6":"Sunday","day.short.0":"Mo","day.short.1":"Tu","day.short.2":"We","day.short.3":"Th","day.short.4":"Fr","day.short.5":"Sa","day.short.6":"Su","adv.rooms":"Rooms","adv.temps":"Temperatures","adv.settings":"Settings","adv.health":"Valves","adv.log":"Log","adv.rooms.add":"Add room","adv.rooms.import":"Add rooms from areas","adv.rooms.import_hint":"Areas in Home Assistant that have radiator valves:","adv.rooms.import_none":"No area with radiator valves was found.","adv.rooms.import_button":"Add selected","adv.rooms.name":"Name","adv.rooms.trvs":"Radiator valves","adv.rooms.in_room":"in {room}","adv.rooms.no_climates":"Home Assistant has no radiator valves (climate entities).","adv.rooms.temperature_entity":"Temperature shown","adv.rooms.temperature_auto":"Average of the valves","adv.rooms.plan":"Plan","adv.rooms.temp_set":"Temperatures","adv.rooms.delete_confirm":"Delete the room {name}? Its valves will no longer be controlled.","adv.rooms.move_up":"Move up","adv.rooms.move_down":"Move down","adv.rooms.empty":"No rooms yet. Add a room, or add rooms from Home Assistant areas.","adv.rooms.edit_title":"Room","adv.temps.house":"House temperatures","adv.temps.house_hint":"Every room uses these, unless it has its own set.","adv.temps.sets":"Own temperature sets","adv.temps.sets_hint":"A set changes only some temperatures. The others come from the house.","adv.temps.as_house":"as house ({temp})","adv.temps.own":"own","adv.temps.new":"New set","adv.temps.delete_confirm":"Delete the set {name}?","adv.temps.delete_confirm_used":"Delete the set {name}? {rooms} will use the house temperatures.","adv.settings.max_override":"Longest manual change (hours)","adv.settings.max_override_hint":"A change on a valve or in the app ends at the next change of the plan, but never later than this.","adv.settings.safety_interval":"Check the valves every (minutes)","adv.settings.mismatch_alert":"Warn about a wrong temperature after (minutes)","adv.settings.vacation_mode":"Temperature during a holiday","adv.settings.dry_run":"Test mode: compute only, send nothing to the valves","adv.settings.saved":"Settings saved.","adv.health.all_ok":"All valves are fine.","adv.health.check_now":"Check all valves now","adv.health.phase.idle":"OK","adv.health.phase.writing":"Sending","adv.health.phase.waiting":"Offline","adv.health.phase.failed":"Failed","adv.health.wanted":"Wanted","adv.health.valve":"Valve","adv.health.last_write":"Last sent","adv.health.error":"Error","adv.log.room":"Room","adv.log.empty":"Nothing recorded yet.","adv.dry_run_banner":"Test mode is on: nothing is sent to the valves.","log.write":"Sent","log.verified":"Confirmed by the valve","log.retry":"No answer, trying again","log.failed":"Failed","log.dry_run":"Would send (test mode)","log.manual":"Changed on the valve","log.manual_ignored":"Change on the valve undone (house mode)","log.override_set":"Changed in the app","log.override_cleared":"Back to plan","log.override_expired":"Manual change ended","log.unavailable":"Valve offline","log.available":"Valve back online","error.revision_conflict":"Somebody else changed the settings meanwhile. The page shows the new state now; please try again.","error.house_mode_active":"The house is not in Normal mode.","error.duplicate_name":"This name is already used.","error.name_required":"Enter a name.","error.name_too_long":"The name is too long.","error.trv_in_two_rooms":"A valve can belong to one room only.","error.invalid_trv":"A room thermostat cannot be used as a valve.","error.plan_empty":"The plan is empty.","error.temperature_range":"The temperature must be between 5 and 30 \xB0C.","error.setting_range":"This value is out of range.","error.vacation_order":"The holiday must end after it starts.","error.not_loaded":"The heating scheduler is not running.","error.unknown":"Something went wrong: {message}","card.name":"Heating Scheduler","card.description":"Rooms with their temperatures, plans and manual changes.","card.room":"Room","card.all_rooms":"All rooms","card.compact":"Compact list","card.show_house":"Show the house mode","card.open_panel":"Open Heating"};var D2={cs:r2,en:M1};function l(M){return(M?.locale?.language??M?.language??"").toLowerCase().startsWith("en")?"en":"cs"}function S(M){let C=D2[M];return(H,V)=>{let L=C[H]??M1[H]??H;if(V)for(let[r,e]of Object.entries(V))L=L.split(`{${r}}`).join(String(e));return L}}var e2=Object.keys(M1);var s1=class{constructor(C){this.snapshot=null;this.listeners=new Set;this.unsubscribe=null;this.retry=null;this.hass=C}setHass(C){this.hass=C}subscribe(C){return this.listeners.add(C),this.listeners.size===1&&this.start(),C(this.snapshot),()=>{this.listeners.delete(C),this.listeners.size===0&&this.stop()}}start(){this.unsubscribe=this.hass.connection.subscribeMessage(C=>{this.snapshot=C;for(let H of this.listeners)H(C)},{type:"heating_scheduler/subscribe"}),this.unsubscribe.catch(()=>{this.unsubscribe=null,this.retry=setTimeout(()=>{this.retry=null,this.listeners.size&&this.start()},1e4)})}stop(){this.retry&&clearTimeout(this.retry),this.retry=null;let C=this.unsubscribe;this.unsubscribe=null,C?.then(H=>H()).catch(()=>{})}call(C,H={}){return this.hass.callWS({type:`heating_scheduler/${C}`,...H})}},t2=new WeakMap;function O(M){let C=t2.get(M.connection);return C||(C=new s1(M),t2.set(M.connection,C)),C.setHass(M),C}function g(M,C){let H=M?.code,V=`error.${H}`;if(H&&e2.includes(V))return C(V);let L=M?.message??String(M);return C("error.unknown",{message:L})}function f(M,C){M.dispatchEvent(new CustomEvent("hs-toast",{detail:C,bubbles:!0,composed:!0}))}var u1=class extends p{static{this.properties={path:{}}}static{this.styles=n`
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
  `}render(){return a`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${this.path??""}></path></svg>`}};x("hs-icon",u1);function E2(){return Intl.DateTimeFormat().resolvedOptions().timeZone}function i2(M){return new Intl.NumberFormat(M).formatToParts(1.5).find(H=>H.type==="decimal")?.value??"."}function o2(M){let C=new Intl.DateTimeFormat(M,{hour:"numeric"}).resolvedOptions().hourCycle;return C==="h11"||C==="h12"}function s(M,C,H){let V=M.locale,L;switch(V?.number_format){case"comma_decimal":case"none":L=C==="cs"&&V?.number_format==="none"?",":".";break;case"decimal_comma":case"space_comma":L=",";break;case"system":L=i2(void 0);break;default:L=i2(C)}let r;switch(V?.time_format){case"12":r=!0;break;case"24":r=!1;break;case"system":r=o2(void 0);break;default:r=o2(C)}let e=H?.time_zone??M.config?.time_zone??E2();return{lang:C,decimalSeparator:L,hour12:r,timeZone:e}}function _2(M,C){return M.toFixed(1).replace(".",C.decimalSeparator)}function k(M,C){return M==null||!Number.isFinite(M)?"\u2014":`${_2(M,C)} \xB0C`}var N2={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};function R(M,C){let H=new Intl.DateTimeFormat("en-US",{timeZone:C,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",weekday:"short",hourCycle:"h23"}).formatToParts(M),V=L=>H.find(r=>r.type===L)?.value??"0";return{year:Number(V("year")),month:Number(V("month")),day:Number(V("day")),hour:Number(V("hour"))%24,minute:Number(V("minute")),weekday:N2[V("weekday")]??0}}function a2(M,C){let H=R(new Date(M),C);return Date.UTC(H.year,H.month-1,H.day,H.hour,H.minute)-Math.floor(M/6e4)*6e4}function A2(M,C,H,V,L,r){let e=Date.UTC(M,C-1,H,V,L),i=e-a2(e,r),t=a2(i,r);return t!==e-i&&(i=e-t),new Date(i)}function d2(M,C){let H=R(M,C.timeZone);if(!C.hour12)return`${String(H.hour).padStart(2,"0")}:${String(H.minute).padStart(2,"0")}`;let V=H.hour<12?"AM":"PM";return`${H.hour%12===0?12:H.hour%12}:${String(H.minute).padStart(2,"0")} ${V}`}var W2={cs:["pond\u011Bl\xED","\xFAter\xFD","st\u0159edy","\u010Dtvrtka","p\xE1tku","soboty","ned\u011Ble"],en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]},$2={cs:["po","\xFAt","st","\u010Dt","p\xE1","so","ne"],en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]},I2=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function m2(M,C){return C==="cs"?`${M.day}. ${M.month}.`:`${M.day} ${I2[M.month-1]}`}function p2(M,C,H){let V=new Date(M),L=d2(V,H),r=V.getTime()-C.getTime();if(r<24*3600*1e3)return L;let e=R(V,H.timeZone);return r<168*3600*1e3?`${W2[H.lang][e.weekday]} ${L}`:`${m2(e,H.lang)} ${L}`}function c(M,C){let H=new Date(M),V=R(H,C.timeZone);return`${$2[C.lang][V.weekday]} ${m2(V,C.lang)} ${d2(H,C)}`}function j(M,C){return C(`mode.${M}`)}function n2(M,C,H,V){let L=M.source==="plan"?V("reason.plan",{mode:j(M.mode,V)}):V(`reason.${M.source}`);if(!M.valid_until)return L;let r=M.source==="vacation"?c(M.valid_until,H):p2(M.valid_until,C,H);return`${L} ${V("room.until",{until:r})}`}function v2(M,C,H,V){if(!M.valid_until||!M.next)return null;let L=M.next,r=L.temperature===null?j(L.mode,V):`${j(L.mode,V)} ${k(L.temperature,H)}`;return V("room.until_next",{until:p2(M.valid_until,C,H),next:r})}function l2(M,C){let H=L=>{let r=typeof L=="number"?L:Number.parseFloat(String(L));return Number.isFinite(r)?r:null};if(M.temperature_entity){let L=C.states[M.temperature_entity];if(L&&L.state!=="unavailable"&&L.state!=="unknown"){let r=M.temperature_entity.startsWith("climate.")?H(L.attributes.current_temperature):H(L.state);if(r!==null)return Math.round(r*10)/10}}let V=M.trvs.map(L=>C.states[L]).filter(L=>L&&L.state!=="unavailable"&&L.state!=="unknown").map(L=>H(L.attributes.current_temperature)).filter(L=>L!==null);return V.length?Math.round(V.reduce((L,r)=>L+r,0)/V.length*10)/10:M.current_temperature}var y={comfort:"#bf360c",eco:"#2e7d32",night:"#3949ab",away:"#546e7a",frost:"#006978",off:"#616161",manual:"#8e24aa"},x2={comfort:M2,eco:X1,night:L2,away:K,frost:L1,off:H2,manual:K1},S1={auto:"#1565c0",away:y.away,vacation:"#00695c",off:y.off},Z2={auto:q1,away:K,vacation:V1,off:C2};function s2(M,C){let H=C.temp_sets.find(L=>L.id==="house"),V=C.temp_sets.find(L=>L.id===M.temp_set_id);return{...H?.temperatures??{},...V&&V.id!=="house"?V.temperatures:{}}}function q(M,C){return M.temp_sets.find(H=>H.id==="house")?.temperatures[C]}var _5=["comfort","eco","night","away","frost","off"];var u2=["auto","away","vacation","off"];var c1=class extends p{static{this.properties={heading:{},closeLabel:{attribute:"close-label"},wide:{type:Boolean}}}static{this.styles=[Z,n`
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
    `]}get dialog(){return this.renderRoot.querySelector("dialog")}async show(){await this.updateComplete;let C=this.dialog;C&&!C.open&&C.showModal()}close(){let C=this.dialog;C?.open&&C.close()}onClosed(){this.dispatchEvent(new CustomEvent("hs-closed"))}onClick(C){C.target===this.dialog&&this.close()}render(){return a`
      <dialog @close=${this.onClosed} @click=${this.onClick} aria-label=${this.heading??""}>
        <div class="frame">
          <header>
            <h2>${this.heading??o}</h2>
            <button class="close" @click=${this.close} aria-label=${this.closeLabel??"Close"}>
              <hs-icon .path=${G1}></hs-icon>
            </button>
          </header>
          <div class="body"><slot></slot></div>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </dialog>
    `}};x("hs-dialog",c1);var h1=class extends p{constructor(){super(...arguments);this.result=!1}static{this.properties={options:{attribute:!1}}}static{this.styles=[Z,n`
      p {
        margin: 0;
      }
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}answer(H){this.result=H,this.dialog?.close()}render(){let H=this.options;return a`
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
    `}};x("hs-confirm",h1);async function _(M,C){let H=document.createElement("hs-confirm");H.options=C,(M.shadowRoot??M).appendChild(H),await H.updateComplete;let V=H.dialog;return V?new Promise(L=>{V.addEventListener("hs-closed",()=>{H.remove(),L(H.result)},{once:!0}),V.show()}):(H.remove(),!1)}function r1(M){return String(M).padStart(2,"0")}var O1=class extends p{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},later:{state:!0},fromDate:{state:!0},fromTime:{state:!0},toDate:{state:!0},toTime:{state:!0},mode:{state:!0},error:{state:!0}}}static{this.styles=[Z,n`
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
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}prepare(){let C=this.snapshot.time_zone,H=R(new Date,C),V=R(new Date(Date.now()+24*3600*1e3),C);this.later=!1,this.fromDate=`${H.year}-${r1(H.month)}-${r1(H.day)}`,this.fromTime="08:00",this.toDate=`${V.year}-${r1(V.month)}-${r1(V.day)}`,this.toTime="12:00",this.mode=this.snapshot.settings.vacation_mode,this.error=""}instant(C,H){let[V,L,r]=C.split("-").map(Number),[e,i]=H.split(":").map(Number);return[V,L,r,e,i].every(t=>Number.isFinite(t))?A2(V,L,r,e,i,this.snapshot.time_zone):null}async submit(C){C.preventDefault();let H=l(this.hass),V=S(H),L=s(this.hass,H,this.snapshot),r=this.toDate&&this.toTime?this.instant(this.toDate,this.toTime):null;if(!r){this.error=V("vacation.error_end");return}let e=this.later?this.instant(this.fromDate,this.fromTime):null,i=e&&e.getTime()>Date.now()?e:null;if(r.getTime()<=(i??new Date).getTime()){this.error=V("vacation.error_order");return}this.error="";let t=k(q(this.snapshot,this.mode),L),d=c(r.toISOString(),L),m=i?V("vacation.confirm",{from:c(i.toISOString(),L),to:d,temp:t}):V("vacation.confirm_now",{to:d,temp:t});if(await _(this,{heading:V("vacation.title"),message:m,confirm:V("vacation.confirm_button"),cancel:V("common.back")}))try{await O(this.hass).call("vacation/set",{start:i?i.toISOString():null,end:r.toISOString(),mode:this.mode}),this.dialog?.close()}catch(v){f(this,g(v,V))}}render(){if(!this.snapshot)return o;let C=l(this.hass),H=S(C),V=s(this.hass,C,this.snapshot),L=(r,e)=>a`
      <button
        type="button"
        class="btn option"
        aria-pressed=${this.mode===r?"true":"false"}
        style=${this.mode===r?`background:${y[r]};border-color:${y[r]}`:""}
        @click=${()=>this.mode=r}
      >
        <span class="row"><hs-icon .path=${e}></hs-icon>${H(`mode.${r}`)}</span>
        <small>${k(q(this.snapshot,r),V)}</small>
      </button>
    `;return a`
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
            ${this.later?a`<div class="pair">
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
                </div>`:o}
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
              ${L("frost",L1)} ${L("away",K)}
            </div>
          </fieldset>
          ${this.error?a`<p class="error" role="alert">${this.error}</p>`:o}
        </form>
        <button slot="actions" class="btn" @click=${()=>this.dialog?.close()}>
          ${H("common.cancel")}
        </button>
        <button slot="actions" class="btn primary" type="button" @click=${this.submit}>
          <hs-icon .path=${V1}></hs-icon>${this.later?H("vacation.plan"):H("vacation.start")}
        </button>
      </hs-dialog>
    `}};x("hs-vacation-dialog",O1);async function S2(M,C,H){let V=document.createElement("hs-vacation-dialog");V.hass=C,V.snapshot=H,V.prepare(),(M.shadowRoot??M).appendChild(V),await V.updateComplete;let L=V.dialog;L&&(L.addEventListener("hs-closed",()=>V.remove(),{once:!0}),await L.show())}var g1=class extends p{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[Z,n`
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
    `]}get t(){return S(l(this.hass))}async setMode(C){let H=this.t,V=this.snapshot,L=s(this.hass,l(this.hass),V);if(C!==V.house.effective){if(C==="vacation"){await S2(this,this.hass,V);return}if(C==="away"){let r=k(q(V,"away"),L);if(!await _(this,{heading:H("house.away"),message:H("house.confirm.away",{temp:r}),confirm:H("house.confirm.away_button"),cancel:H("common.cancel")}))return}C==="off"&&!await _(this,{heading:H("house.off"),message:H("house.confirm.off"),confirm:H("house.confirm.off_button"),cancel:H("common.cancel"),danger:!0})||await this.send("house_mode/set",{mode:C})}}async cancelPlanned(){let C=this.t;await _(this,{heading:C("house.vacation"),message:C("house.confirm.cancel_vacation"),confirm:C("house.confirm.cancel_vacation_button"),cancel:C("common.back")})&&await this.send("vacation/cancel",{})}async send(C,H){this.busy=!0;try{await O(this.hass).call(C,H)}catch(V){f(this,g(V,this.t))}finally{this.busy=!1}}banner(){let C=this.t,H=this.snapshot.house,V=s(this.hass,l(this.hass),this.snapshot),L;if(H.effective==="vacation"){let e=H.vacation?.end;L=e?C("house.banner.vacation",{until:c(e,V)}):C("house.banner.vacation_open")}else H.effective==="away"?L=C("house.banner.away"):L=C("house.banner.off");let r=H.effective==="off"?C("house.heating_on"):C("house.home_again");return a`
      <div class="banner" role="status" style="background:${S1[H.effective]}">
        <span>${L}</span>
        <button class="btn" ?disabled=${this.busy} @click=${()=>this.send("house_mode/set",{mode:"auto"})}>
          <hs-icon .path=${j1}></hs-icon>${r}
        </button>
      </div>
    `}planned(){let C=this.snapshot.house.vacation;if(!C||C.active)return o;let H=this.t,V=s(this.hass,l(this.hass),this.snapshot),L=c(C.start,V),r=C.end?H("house.planned",{from:L,to:c(C.end,V)}):H("house.planned_open",{from:L});return a`
      <div class="planned">
        <span>${r}</span>
        <button class="btn small" ?disabled=${this.busy} @click=${this.cancelPlanned}>
          ${H("house.cancel_planned")}
        </button>
      </div>
    `}render(){if(!this.snapshot||!this.hass)return o;let C=this.t,H=this.snapshot.house.effective;return a`
      <section class="card wrap" aria-label=${C("house.title")}>
        <h2 class="muted">${C("house.title")}</h2>
        <div class="modes" role="group" aria-label=${C("house.title")}>
          ${u2.map(V=>{let L=V===H;return a`<button
              class="btn mode"
              aria-pressed=${L?"true":"false"}
              style=${L?`background:${S1[V]}`:""}
              ?disabled=${this.busy}
              @click=${()=>this.setMode(V)}
            >
              <hs-icon .path=${Z2[V]}></hs-icon>${C(`house.${V}`)}
            </button>`})}
        </div>
        ${H!=="auto"?this.banner():o} ${this.planned()}
      </section>
    `}};x("hs-house-strip",g1);var f1=class extends p{static{this.properties={hass:{attribute:!1},room:{attribute:!1}}}static{this.styles=[Z,n`
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
    `]}get dialog(){return this.renderRoot.querySelector("hs-dialog")}async retry(){let C=S(l(this.hass));try{await O(this.hass).call("reconcile"),this.dialog?.close()}catch(H){f(this,g(H,C))}}valveName(C){let V=this.hass.states[C]?.attributes.friendly_name;return typeof V=="string"?V:C}render(){let C=l(this.hass),H=S(C),V=s(this.hass,C);return a`
      <hs-dialog .heading=${H("health.title",{room:this.room.name})} .closeLabel=${H("common.close")}>
        <ul>
          ${this.room.issues.map(L=>a`<li>
              <hs-icon .path=${H1}></hs-icon>
              <span>
                ${H(`health.${L.kind}`,{name:this.valveName(L.entity_id)})}
                ${L.since?a`<span class="since muted">
                      ${H("health.since",{time:c(L.since,V)})}
                    </span>`:""}
              </span>
            </li>`)}
        </ul>
        <p class="details muted">${H("health.details")}</p>
        <button slot="actions" class="btn" @click=${()=>this.dialog?.close()}>
          ${H("common.close")}
        </button>
        <button slot="actions" class="btn primary" @click=${this.retry}>
          <hs-icon .path=${V2}></hs-icon>${H("health.retry")}
        </button>
      </hs-dialog>
    `}};x("hs-health-dialog",f1);async function c2(M,C,H){let V=document.createElement("hs-health-dialog");V.hass=C,V.room=H,(M.shadowRoot??M).appendChild(V),await V.updateComplete;let L=V.dialog;L&&(L.addEventListener("hs-closed",()=>V.remove(),{once:!0}),await L.show())}var e1=.5,U2=5,z2=30,Q2=1e3;function G2(M){return Math.min(z2,Math.max(U2,Math.round(M/e1)*e1))}var k1=class extends p{constructor(){super();this.timer=null;this.sentAt=0;this.pending=null,this.sending=!1,this.compact=!1}static{this.properties={hass:{attribute:!1},room:{attribute:!1},snapshot:{attribute:!1},compact:{type:Boolean,reflect:!0},pending:{state:!0},sending:{state:!0}}}static{this.styles=[Z,n`
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
        border-left-color: ${W(y.manual)};
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
        border-color: ${W(y.manual)};
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
    `]}disconnectedCallback(){super.disconnectedCallback(),this.timer&&(clearTimeout(this.timer),this.timer=null,this.send())}willUpdate(H){H.has("room")&&this.pending!==null&&!this.timer&&!this.sending&&(this.room.target?.temperature===this.pending||Date.now()-this.sentAt>4e3)&&(this.pending=null)}get t(){return S(l(this.hass))}comfort(){return s2(this.room,this.snapshot).comfort??21}step(H){let V=this.pending??this.room.target?.temperature??this.comfort()-H;this.pending=G2(V+H),this.timer&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null,this.send()},Q2)}async send(){let H=this.pending;if(H!==null){this.sending=!0;try{await O(this.hass).call("override/set",{room_id:this.room.id,temperature:H}),this.sentAt=Date.now()}catch(V){this.pending=null,f(this,g(V,this.t))}finally{this.sending=!1}}}async backToPlan(){this.timer&&(clearTimeout(this.timer),this.timer=null),this.pending=null;try{await O(this.hass).call("override/clear",{room_id:this.room.id})}catch(H){f(this,g(H,this.t))}}showHealth(){c2(this,this.hass,this.room)}render(){let H=this.room,V=H.target;if(!H||!this.snapshot||!this.hass)return o;let L=this.t,r=s(this.hass,l(this.hass),this.snapshot),e=new Date,t=this.snapshot.house.effective==="auto"&&V!==null,d=V?.source==="manual",m=this.pending??V?.temperature??null,A=this.pending===null&&V!==null&&V.temperature===null,v=this.pending!==null?"manual":V?.mode??"off",u=l2(H,this.hass),b=null;return V&&(b=V.source==="plan"||V.source==="manual"?v2(V,e,r,L):n2(V,e,r,L)),a`
      <article class="tile card ${d||this.pending!==null?"manual":""}">
        <header>
          <h2>${H.name}</h2>
          ${H.issues.length?a`<button class="warn" @click=${this.showHealth} aria-label=${L("room.problem")}>
                <hs-icon .path=${H1}></hs-icon>
              </button>`:o}
        </header>
        <div class="current">${L("room.now")} <strong>${k(u,r)}</strong></div>
        <div class="control">
          ${t?a`<button class="round" @click=${()=>this.step(-e1)} aria-label=${L("room.cooler")}>
                <hs-icon .path=${Y1}></hs-icon>
              </button>`:a`<span></span>`}
          <div class="target" aria-live="polite">
            <span class="label muted">${L("room.set_to")}</span>
            <span class="value ${A?"off":""}">
              ${A?L("room.off"):k(m,r)}
            </span>
            <span class="hint muted">${this.sending?L("room.sending"):""}</span>
          </div>
          ${t?a`<button class="round" @click=${()=>this.step(e1)} aria-label=${L("room.warmer")}>
                <hs-icon .path=${J1}></hs-icon>
              </button>`:a`<span></span>`}
        </div>
        <div class="status">
          <span class="chip" style="background:${y[v]}">
            <hs-icon .path=${x2[v]}></hs-icon>${j(v,L)}
          </span>
          ${b?a`<span class="next">${b}</span>`:o}
        </div>
        ${H.trvs.length===0?a`<div class="note muted">${L("room.no_trvs")}</div>`:o}
        ${d&&t?a`<button class="btn wide back" @click=${this.backToPlan}>
              <hs-icon .path=${Q1}></hs-icon>${L("room.back_to_plan")}
            </button>`:o}
      </article>
    `}};x("hs-room-tile",k1);export{n as a,a as b,o as c,p as d,d5 as e,m5 as f,p5 as g,n5 as h,v5 as i,l5 as j,Y1 as k,x5 as l,J1 as m,Z5 as n,s5 as o,u5 as p,x as q,Z as r,l as s,S as t,R as u,y as v,x2 as w,O as x,g as y,f as z,_5 as A,_ as B};
