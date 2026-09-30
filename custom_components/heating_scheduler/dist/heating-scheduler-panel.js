var f1=globalThis,g1=f1.ShadowRoot&&(f1.ShadyCSS===void 0||f1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,M2=Symbol(),r5=new WeakMap,n1=class{constructor(H,C,V){if(this._$cssResult$=!0,V!==M2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=H,this.t=C}get styleSheet(){let H=this.o,C=this.t;if(g1&&H===void 0){let V=C!==void 0&&C.length===1;V&&(H=r5.get(C)),H===void 0&&((this.o=H=new CSSStyleSheet).replaceSync(this.cssText),V&&r5.set(C,H))}return H}toString(){return this.cssText}},t5=e=>new n1(typeof e=="string"?e:e+"",void 0,M2),m=(e,...H)=>{let C=e.length===1?e[0]:H.reduce((V,L,M)=>V+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(L)+e[M+1],e[0]);return new n1(C,e,M2)},o5=(e,H)=>{if(g1)e.adoptedStyleSheets=H.map(C=>C instanceof CSSStyleSheet?C:C.styleSheet);else for(let C of H){let V=document.createElement("style"),L=f1.litNonce;L!==void 0&&V.setAttribute("nonce",L),V.textContent=C.cssText,e.appendChild(V)}},r2=g1?e=>e:e=>e instanceof CSSStyleSheet?(H=>{let C="";for(let V of H.cssRules)C+=V.cssText;return t5(C)})(e):e;var{is:q3,defineProperty:X3,getOwnPropertyDescriptor:Y3,getOwnPropertyNames:J3,getOwnPropertySymbols:C0,getPrototypeOf:H0}=Object,O1=globalThis,a5=O1.trustedTypes,V0=a5?a5.emptyScript:"",L0=O1.reactiveElementPolyfillSupport,d1=(e,H)=>e,t2={toAttribute(e,H){switch(H){case Boolean:e=e?V0:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,H){let C=e;switch(H){case Boolean:C=e!==null;break;case Number:C=e===null?null:Number(e);break;case Object:case Array:try{C=JSON.parse(e)}catch{C=null}}return C}},A5=(e,H)=>!q3(e,H),i5={attribute:!0,type:String,converter:t2,reflect:!1,useDefault:!1,hasChanged:A5};Symbol.metadata??=Symbol("metadata"),O1.litPropertyMetadata??=new WeakMap;var $=class extends HTMLElement{static addInitializer(H){this._$Ei(),(this.l??=[]).push(H)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(H,C=i5){if(C.state&&(C.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(H)&&((C=Object.create(C)).wrapped=!0),this.elementProperties.set(H,C),!C.noAccessor){let V=Symbol(),L=this.getPropertyDescriptor(H,V,C);L!==void 0&&X3(this.prototype,H,L)}}static getPropertyDescriptor(H,C,V){let{get:L,set:M}=Y3(this.prototype,H)??{get(){return this[C]},set(r){this[C]=r}};return{get:L,set(r){let o=L?.call(this);M?.call(this,r),this.requestUpdate(H,o,V)},configurable:!0,enumerable:!0}}static getPropertyOptions(H){return this.elementProperties.get(H)??i5}static _$Ei(){if(this.hasOwnProperty(d1("elementProperties")))return;let H=H0(this);H.finalize(),H.l!==void 0&&(this.l=[...H.l]),this.elementProperties=new Map(H.elementProperties)}static finalize(){if(this.hasOwnProperty(d1("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d1("properties"))){let C=this.properties,V=[...J3(C),...C0(C)];for(let L of V)this.createProperty(L,C[L])}let H=this[Symbol.metadata];if(H!==null){let C=litPropertyMetadata.get(H);if(C!==void 0)for(let[V,L]of C)this.elementProperties.set(V,L)}this._$Eh=new Map;for(let[C,V]of this.elementProperties){let L=this._$Eu(C,V);L!==void 0&&this._$Eh.set(L,C)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(H){let C=[];if(Array.isArray(H)){let V=new Set(H.flat(1/0).reverse());for(let L of V)C.unshift(r2(L))}else H!==void 0&&C.push(r2(H));return C}static _$Eu(H,C){let V=C.attribute;return V===!1?void 0:typeof V=="string"?V:typeof H=="string"?H.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(H=>this.enableUpdating=H),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(H=>H(this))}addController(H){(this._$EO??=new Set).add(H),this.renderRoot!==void 0&&this.isConnected&&H.hostConnected?.()}removeController(H){this._$EO?.delete(H)}_$E_(){let H=new Map,C=this.constructor.elementProperties;for(let V of C.keys())this.hasOwnProperty(V)&&(H.set(V,this[V]),delete this[V]);H.size>0&&(this._$Ep=H)}createRenderRoot(){let H=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return o5(H,this.constructor.elementStyles),H}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(H=>H.hostConnected?.())}enableUpdating(H){}disconnectedCallback(){this._$EO?.forEach(H=>H.hostDisconnected?.())}attributeChangedCallback(H,C,V){this._$AK(H,V)}_$ET(H,C){let V=this.constructor.elementProperties.get(H),L=this.constructor._$Eu(H,V);if(L!==void 0&&V.reflect===!0){let M=(V.converter?.toAttribute!==void 0?V.converter:t2).toAttribute(C,V.type);this._$Em=H,M==null?this.removeAttribute(L):this.setAttribute(L,M),this._$Em=null}}_$AK(H,C){let V=this.constructor,L=V._$Eh.get(H);if(L!==void 0&&this._$Em!==L){let M=V.getPropertyOptions(L),r=typeof M.converter=="function"?{fromAttribute:M.converter}:M.converter?.fromAttribute!==void 0?M.converter:t2;this._$Em=L;let o=r.fromAttribute(C,M.type);this[L]=o??this._$Ej?.get(L)??o,this._$Em=null}}requestUpdate(H,C,V,L=!1,M){if(H!==void 0){let r=this.constructor;if(L===!1&&(M=this[H]),V??=r.getPropertyOptions(H),!((V.hasChanged??A5)(M,C)||V.useDefault&&V.reflect&&M===this._$Ej?.get(H)&&!this.hasAttribute(r._$Eu(H,V))))return;this.C(H,C,V)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(H,C,{useDefault:V,reflect:L,wrapped:M},r){V&&!(this._$Ej??=new Map).has(H)&&(this._$Ej.set(H,r??C??this[H]),M!==!0||r!==void 0)||(this._$AL.has(H)||(this.hasUpdated||V||(C=void 0),this._$AL.set(H,C)),L===!0&&this._$Em!==H&&(this._$Eq??=new Set).add(H))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(C){Promise.reject(C)}let H=this.scheduleUpdate();return H!=null&&await H,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[L,M]of this._$Ep)this[L]=M;this._$Ep=void 0}let V=this.constructor.elementProperties;if(V.size>0)for(let[L,M]of V){let{wrapped:r}=M,o=this[L];r!==!0||this._$AL.has(L)||o===void 0||this.C(L,void 0,M,o)}}let H=!1,C=this._$AL;try{H=this.shouldUpdate(C),H?(this.willUpdate(C),this._$EO?.forEach(V=>V.hostUpdate?.()),this.update(C)):this._$EM()}catch(V){throw H=!1,this._$EM(),V}H&&this._$AE(C)}willUpdate(H){}_$AE(H){this._$EO?.forEach(C=>C.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(H)),this.updated(H)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(H){return!0}update(H){this._$Eq&&=this._$Eq.forEach(C=>this._$ET(C,this[C])),this._$EM()}updated(H){}firstUpdated(H){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[d1("elementProperties")]=new Map,$[d1("finalized")]=new Map,L0?.({ReactiveElement:$}),(O1.reactiveElementVersions??=[]).push("2.1.2");var a2=globalThis,n5=e=>e,b1=a2.trustedTypes,d5=b1?b1.createPolicy("lit-html",{createHTML:e=>e}):void 0,i2="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,A2="?"+E,e0=`<${A2}>`,X=document,p1=()=>X.createComment(""),s1=e=>e===null||typeof e!="object"&&typeof e!="function",n2=Array.isArray,x5=e=>n2(e)||typeof e?.[Symbol.iterator]=="function",o2=`[ 	
\f\r]`,m1=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,m5=/-->/g,p5=/>/g,j=RegExp(`>|${o2}(?:([^\\s"'>=/]+)(${o2}*=${o2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),s5=/'/g,l5=/"/g,u5=/^(?:script|style|textarea|title)$/i,d2=e=>(H,...C)=>({_$litType$:e,strings:H,values:C}),t=d2(1),I0=d2(2),W0=d2(3),z=Symbol.for("lit-noChange"),a=Symbol.for("lit-nothing"),v5=new WeakMap,q=X.createTreeWalker(X,129);function c5(e,H){if(!n2(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return d5!==void 0?d5.createHTML(H):H}var Z5=(e,H)=>{let C=e.length-1,V=[],L,M=H===2?"<svg>":H===3?"<math>":"",r=m1;for(let o=0;o<C;o++){let i=e[o],d,v,A=-1,u=0;for(;u<i.length&&(r.lastIndex=u,v=r.exec(i),v!==null);)u=r.lastIndex,r===m1?v[1]==="!--"?r=m5:v[1]!==void 0?r=p5:v[2]!==void 0?(u5.test(v[2])&&(L=RegExp("</"+v[2],"g")),r=j):v[3]!==void 0&&(r=j):r===j?v[0]===">"?(r=L??m1,A=-1):v[1]===void 0?A=-2:(A=r.lastIndex-v[2].length,d=v[1],r=v[3]===void 0?j:v[3]==='"'?l5:s5):r===l5||r===s5?r=j:r===m5||r===p5?r=m1:(r=j,L=void 0);let S=r===j&&e[o+1].startsWith("/>")?" ":"";M+=r===m1?i+e0:A>=0?(V.push(d),i.slice(0,A)+i2+i.slice(A)+E+S):i+E+(A===-2?o:S)}return[c5(e,M+(e[C]||"<?>")+(H===2?"</svg>":H===3?"</math>":"")),V]},l1=class e{constructor({strings:H,_$litType$:C},V){let L;this.parts=[];let M=0,r=0,o=H.length-1,i=this.parts,[d,v]=Z5(H,C);if(this.el=e.createElement(d,V),q.currentNode=this.el.content,C===2||C===3){let A=this.el.content.firstChild;A.replaceWith(...A.childNodes)}for(;(L=q.nextNode())!==null&&i.length<o;){if(L.nodeType===1){if(L.hasAttributes())for(let A of L.getAttributeNames())if(A.endsWith(i2)){let u=v[r++],S=L.getAttribute(A).split(E),O=/([.?@])?(.*)/.exec(u);i.push({type:1,index:M,name:O[2],strings:S,ctor:O[1]==="."?w1:O[1]==="?"?k1:O[1]==="@"?P1:J}),L.removeAttribute(A)}else A.startsWith(E)&&(i.push({type:6,index:M}),L.removeAttribute(A));if(u5.test(L.tagName)){let A=L.textContent.split(E),u=A.length-1;if(u>0){L.textContent=b1?b1.emptyScript:"";for(let S=0;S<u;S++)L.append(A[S],p1()),q.nextNode(),i.push({type:2,index:++M});L.append(A[u],p1())}}}else if(L.nodeType===8)if(L.data===A2)i.push({type:2,index:M});else{let A=-1;for(;(A=L.data.indexOf(E,A+1))!==-1;)i.push({type:7,index:M}),A+=E.length-1}M++}}static createElement(H,C){let V=X.createElement("template");return V.innerHTML=H,V}};function Y(e,H,C=e,V){if(H===z)return H;let L=V!==void 0?C._$Co?.[V]:C._$Cl,M=s1(H)?void 0:H._$litDirective$;return L?.constructor!==M&&(L?._$AO?.(!1),M===void 0?L=void 0:(L=new M(e),L._$AT(e,C,V)),V!==void 0?(C._$Co??=[])[V]=L:C._$Cl=L),L!==void 0&&(H=Y(e,L._$AS(e,H.values),L,V)),H}var y1=class{constructor(H,C){this._$AV=[],this._$AN=void 0,this._$AD=H,this._$AM=C}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(H){let{el:{content:C},parts:V}=this._$AD,L=(H?.creationScope??X).importNode(C,!0);q.currentNode=L;let M=q.nextNode(),r=0,o=0,i=V[0];for(;i!==void 0;){if(r===i.index){let d;i.type===2?d=new L1(M,M.nextSibling,this,H):i.type===1?d=new i.ctor(M,i.name,i.strings,this,H):i.type===6&&(d=new T1(M,this,H)),this._$AV.push(d),i=V[++o]}r!==i?.index&&(M=q.nextNode(),r++)}return q.currentNode=X,L}p(H){let C=0;for(let V of this._$AV)V!==void 0&&(V.strings!==void 0?(V._$AI(H,V,C),C+=V.strings.length-2):V._$AI(H[C])),C++}},L1=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(H,C,V,L){this.type=2,this._$AH=a,this._$AN=void 0,this._$AA=H,this._$AB=C,this._$AM=V,this.options=L,this._$Cv=L?.isConnected??!0}get parentNode(){let H=this._$AA.parentNode,C=this._$AM;return C!==void 0&&H?.nodeType===11&&(H=C.parentNode),H}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(H,C=this){H=Y(this,H,C),s1(H)?H===a||H==null||H===""?(this._$AH!==a&&this._$AR(),this._$AH=a):H!==this._$AH&&H!==z&&this._(H):H._$litType$!==void 0?this.$(H):H.nodeType!==void 0?this.T(H):x5(H)?this.k(H):this._(H)}O(H){return this._$AA.parentNode.insertBefore(H,this._$AB)}T(H){this._$AH!==H&&(this._$AR(),this._$AH=this.O(H))}_(H){this._$AH!==a&&s1(this._$AH)?this._$AA.nextSibling.data=H:this.T(X.createTextNode(H)),this._$AH=H}$(H){let{values:C,_$litType$:V}=H,L=typeof V=="number"?this._$AC(H):(V.el===void 0&&(V.el=l1.createElement(c5(V.h,V.h[0]),this.options)),V);if(this._$AH?._$AD===L)this._$AH.p(C);else{let M=new y1(L,this),r=M.u(this.options);M.p(C),this.T(r),this._$AH=M}}_$AC(H){let C=v5.get(H.strings);return C===void 0&&v5.set(H.strings,C=new l1(H)),C}k(H){n2(this._$AH)||(this._$AH=[],this._$AR());let C=this._$AH,V,L=0;for(let M of H)L===C.length?C.push(V=new e(this.O(p1()),this.O(p1()),this,this.options)):V=C[L],V._$AI(M),L++;L<C.length&&(this._$AR(V&&V._$AB.nextSibling,L),C.length=L)}_$AR(H=this._$AA.nextSibling,C){for(this._$AP?.(!1,!0,C);H!==this._$AB;){let V=n5(H).nextSibling;n5(H).remove(),H=V}}setConnected(H){this._$AM===void 0&&(this._$Cv=H,this._$AP?.(H))}},J=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(H,C,V,L,M){this.type=1,this._$AH=a,this._$AN=void 0,this.element=H,this.name=C,this._$AM=L,this.options=M,V.length>2||V[0]!==""||V[1]!==""?(this._$AH=Array(V.length-1).fill(new String),this.strings=V):this._$AH=a}_$AI(H,C=this,V,L){let M=this.strings,r=!1;if(M===void 0)H=Y(this,H,C,0),r=!s1(H)||H!==this._$AH&&H!==z,r&&(this._$AH=H);else{let o=H,i,d;for(H=M[0],i=0;i<M.length-1;i++)d=Y(this,o[V+i],C,i),d===z&&(d=this._$AH[i]),r||=!s1(d)||d!==this._$AH[i],d===a?H=a:H!==a&&(H+=(d??"")+M[i+1]),this._$AH[i]=d}r&&!L&&this.j(H)}j(H){H===a?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,H??"")}},w1=class extends J{constructor(){super(...arguments),this.type=3}j(H){this.element[this.name]=H===a?void 0:H}},k1=class extends J{constructor(){super(...arguments),this.type=4}j(H){this.element.toggleAttribute(this.name,!!H&&H!==a)}},P1=class extends J{constructor(H,C,V,L,M){super(H,C,V,L,M),this.type=5}_$AI(H,C=this){if((H=Y(this,H,C,0)??a)===z)return;let V=this._$AH,L=H===a&&V!==a||H.capture!==V.capture||H.once!==V.once||H.passive!==V.passive,M=H!==a&&(V===a||L);L&&this.element.removeEventListener(this.name,this,V),M&&this.element.addEventListener(this.name,this,H),this._$AH=H}handleEvent(H){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,H):this._$AH.handleEvent(H)}},T1=class{constructor(H,C,V){this.element=H,this.type=6,this._$AN=void 0,this._$AM=C,this.options=V}get _$AU(){return this._$AM._$AU}_$AI(H){Y(this,H)}},h5={M:i2,P:E,A:A2,C:1,L:Z5,R:y1,D:x5,V:Y,I:L1,H:J,N:k1,U:P1,B:w1,F:T1},M0=a2.litHtmlPolyfillSupport;M0?.(l1,L1),(a2.litHtmlVersions??=[]).push("3.3.3");var S5=(e,H,C)=>{let V=C?.renderBefore??H,L=V._$litPart$;if(L===void 0){let M=C?.renderBefore??null;V._$litPart$=L=new L1(H.insertBefore(p1(),M),M,void 0,C??{})}return L._$AI(e),L};var m2=globalThis,l=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let H=super.createRenderRoot();return this.renderOptions.renderBefore??=H.firstChild,H}update(H){let C=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(H),this._$Do=S5(C,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return z}};l._$litElement$=!0,l.finalized=!0,m2.litElementHydrateSupport?.({LitElement:l});var r0=m2.litElementPolyfillSupport;r0?.({LitElement:l});(m2.litElementVersions??=[]).push("4.2.2");var B1="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z";var f5="M17.03 6C18.11 6 19 6.88 19 8V19C19 20.13 18.11 21 17.03 21C17.03 21.58 16.56 22 16 22C15.5 22 15 21.58 15 21H9C9 21.58 8.5 22 8 22C7.44 22 6.97 21.58 6.97 21C5.89 21 5 20.13 5 19V8C5 6.88 5.89 6 6.97 6H9V3C9 2.42 9.46 2 10 2H14C14.54 2 15 2.42 15 3V6H17.03M13.5 6V3.5H10.5V6H13.5M8 9V18H9.5V9H8M14.5 9V18H16V9H14.5M11.25 9V18H12.75V9H11.25Z";var g5="M15,13H16.5V15.82L18.94,17.23L18.19,18.53L15,16.69V13M19,8H5V19H9.67C9.24,18.09 9,17.07 9,16A7,7 0 0,1 16,9C17.07,9 18.09,9.24 19,9.67V8M5,21C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H6V1H8V3H16V1H18V3H19A2,2 0 0,1 21,5V11.1C22.24,12.36 23,14.09 23,16A7,7 0 0,1 16,23C14.09,23 12.36,22.24 11.1,21H5M16,11.15A4.85,4.85 0 0,0 11.15,16C11.15,18.68 13.32,20.85 16,20.85A4.85,4.85 0 0,0 20.85,16C20.85,13.32 18.68,11.15 16,11.15Z";var O5="M18,11V12.5C21.19,12.5 23.09,16.05 21.33,18.71L20.24,17.62C21.06,15.96 19.85,14 18,14V15.5L15.75,13.25L18,11M18,22V20.5C14.81,20.5 12.91,16.95 14.67,14.29L15.76,15.38C14.94,17.04 16.15,19 18,19V17.5L20.25,19.75L18,22M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H14C13.36,20.45 12.86,19.77 12.5,19H5V8H19V10.59C19.71,10.7 20.39,10.94 21,11.31V5A2,2 0 0,0 19,3Z";var b5="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,5V19H5V5H19Z";var y5="M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z";var _1="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";var D1="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z";var R1="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";var w5="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z";var k5="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z";var _="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";var F1="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z";var P5="M10 3H14V14H10V3M10 21V17H14V21H10Z";var T5="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2M14.5 17.5C14.22 17.74 13.76 18 13.4 18.1C12.28 18.5 11.16 17.94 10.5 17.28C11.69 17 12.4 16.12 12.61 15.23C12.78 14.43 12.46 13.77 12.33 13C12.21 12.26 12.23 11.63 12.5 10.94C12.69 11.32 12.89 11.7 13.13 12C13.9 13 15.11 13.44 15.37 14.8C15.41 14.94 15.43 15.08 15.43 15.23C15.46 16.05 15.1 16.95 14.5 17.5H14.5Z";var B5="M13 24C9.74 24 6.81 22 5.6 19L2.57 11.37C2.26 10.58 3 9.79 3.81 10.05L4.6 10.31C5.16 10.5 5.62 10.92 5.84 11.47L7.25 15H8V3.25C8 2.56 8.56 2 9.25 2S10.5 2.56 10.5 3.25V12H11.5V1.25C11.5 .56 12.06 0 12.75 0S14 .56 14 1.25V12H15V2.75C15 2.06 15.56 1.5 16.25 1.5C16.94 1.5 17.5 2.06 17.5 2.75V12H18.5V5.75C18.5 5.06 19.06 4.5 19.75 4.5S21 5.06 21 5.75V16C21 20.42 17.42 24 13 24Z";var _5="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3";var p2="M24 13L20 17V14H11V12H20V9L24 13M4 20V12H1L11 3L18 9.3V10H15.79L11 5.69L6 10.19V18H16V16H18V20H4Z";var e1="M12,3L2,12H5V20H19V12H22L12,3M10,8H14V18H12V10H10V8Z";var D5="M15 13L11 17V14H2V12H11V9L15 13M5 20V16H7V18H17V10.19L12 5.69L7.21 10H4.22L12 3L22 12H19V20H5Z";var R5="M12 5.69L17 10.19V18H15V12H9V18H7V10.19L12 5.69M12 3L2 12H5V20H11V14H13V20H19V12H22";var F5="M8 3L1 9H3V15H7V11H9V15H13V9H15L8 3M11.5 9V13.5H10.5V9.5H5.5V13.5H4.5V8L8 5L11.5 8V9M9 16V18H15V16L18 19L15 22V20H9V22L6 19L9 16M23 9H21V15H15V10H19L13.54 5.11L16 3L23 9Z";var $5="M19 8C20.11 8 21 8.9 21 10V16.76C21.61 17.31 22 18.11 22 19C22 20.66 20.66 22 19 22C17.34 22 16 20.66 16 19C16 18.11 16.39 17.31 17 16.76V10C17 8.9 17.9 8 19 8M19 9C18.45 9 18 9.45 18 10V11H20V10C20 9.45 19.55 9 19 9M12 5.69L7 10.19V18H14.1L14 19L14.1 20H5V12H2L12 3L16.4 6.96C15.89 7.4 15.5 7.97 15.25 8.61L12 5.69Z";var E5="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z";var z5="M19,13H5V11H19V13Z";var M1="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";var D="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";var N5="M17,13H13V17H11V13H7V11H11V7H13V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z";var I5="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13";var W5="M7.95,3L6.53,5.19L7.95,7.4H7.94L5.95,10.5L4.22,9.6L5.64,7.39L4.22,5.19L6.22,2.09L7.95,3M13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L11.95,10.4L10.22,9.5L11.64,7.3L10.22,5.1L12.22,2L13.95,2.89M20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89M2,22V14A2,2 0 0,1 4,12H20A2,2 0 0,1 22,14V22H20V20H4V22H2M6,14A1,1 0 0,0 5,15V17A1,1 0 0,0 6,18A1,1 0 0,0 7,17V15A1,1 0 0,0 6,14M10,14A1,1 0 0,0 9,15V17A1,1 0 0,0 10,18A1,1 0 0,0 11,17V15A1,1 0 0,0 10,14M14,14A1,1 0 0,0 13,15V17A1,1 0 0,0 14,18A1,1 0 0,0 15,17V15A1,1 0 0,0 14,14M18,14A1,1 0 0,0 17,15V17A1,1 0 0,0 18,18A1,1 0 0,0 19,17V15A1,1 0 0,0 18,14Z";var U5="M3.28,2L2,3.27L4.77,6.04L5.64,7.39L4.22,9.6L5.95,10.5L7.23,8.5L10.73,12H4A2,2 0 0,0 2,14V22H4V20H18.73L20,21.27V22H22V20.73L22,20.72V20.72L3.28,2M7,17A1,1 0 0,1 6,18A1,1 0 0,1 5,17V15A1,1 0 0,1 6,14A1,1 0 0,1 7,15V17M11,17A1,1 0 0,1 10,18A1,1 0 0,1 9,17V15A1,1 0 0,1 10,14A1,1 0 0,1 11,15V17M15,17A1,1 0 0,1 14,18A1,1 0 0,1 13,17V15C13,14.79 13.08,14.61 13.18,14.45L15,16.27V17M16.25,9.5L17.67,7.3L16.25,5.1L18.25,2L20,2.89L18.56,5.1L20,7.3V7.31L18,10.4L16.25,9.5M22,14V18.18L19,15.18V15A1,1 0 0,0 18,14C17.95,14 17.9,14 17.85,14.03L15.82,12H20C21.11,12 22,12.9 22,14M11.64,7.3L10.22,5.1L12.22,2L13.95,2.89L12.53,5.1L13.95,7.3L13.94,7.31L12.84,9L11.44,7.62L11.64,7.3M7.5,3.69L6.1,2.28L6.22,2.09L7.95,3L7.5,3.69Z";var $1="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z";var Q5="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z";var G5="M20.79,13.95L18.46,14.57L16.46,13.44V10.56L18.46,9.43L20.79,10.05L21.31,8.12L19.54,7.65L20,5.88L18.07,5.36L17.45,7.69L15.45,8.82L13,7.38V5.12L14.71,3.41L13.29,2L12,3.29L10.71,2L9.29,3.41L11,5.12V7.38L8.5,8.82L6.5,7.69L5.92,5.36L4,5.88L4.47,7.65L2.7,8.12L3.22,10.05L5.55,9.43L7.55,10.56V13.45L5.55,14.58L3.22,13.96L2.7,15.89L4.47,16.36L4,18.12L5.93,18.64L6.55,16.31L8.55,15.18L11,16.62V18.88L9.29,20.59L10.71,22L12,20.71L13.29,22L14.7,20.59L13,18.88V16.62L15.5,15.17L17.5,16.3L18.12,18.63L20,18.12L19.53,16.35L21.3,15.88L20.79,13.95M9.5,10.56L12,9.11L14.5,10.56V13.44L12,14.89L9.5,13.44V10.56Z";var K5="M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z";var j5="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z";var q5="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z";var X5="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z";var Y5="M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13";var J5={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},C3=e=>(...H)=>({_$litDirective$:e,values:H}),E1=class{constructor(H){}get _$AU(){return this._$AM._$AU}_$AT(H,C,V){this._$Ct=H,this._$AM=C,this._$Ci=V}_$AS(H,C){return this.update(H,C)}update(H,C){return this.render(...C)}};var{I:t0}=h5,H3=e=>e;var V3=()=>document.createComment(""),r1=(e,H,C)=>{let V=e._$AA.parentNode,L=H===void 0?e._$AB:H._$AA;if(C===void 0){let M=V.insertBefore(V3(),L),r=V.insertBefore(V3(),L);C=new t0(M,r,e,e.options)}else{let M=C._$AB.nextSibling,r=C._$AM,o=r!==e;if(o){let i;C._$AQ?.(e),C._$AM=e,C._$AP!==void 0&&(i=e._$AU)!==r._$AU&&C._$AP(i)}if(M!==L||o){let i=C._$AA;for(;i!==M;){let d=H3(i).nextSibling;H3(V).insertBefore(i,L),i=d}}}return C},U=(e,H,C=e)=>(e._$AI(H,C),e),o0={},L3=(e,H=o0)=>e._$AH=H,e3=e=>e._$AH,z1=e=>{e._$AR(),e._$AA.remove()};var M3=(e,H,C)=>{let V=new Map;for(let L=H;L<=C;L++)V.set(e[L],L);return V},v1=C3(class extends E1{constructor(e){if(super(e),e.type!==J5.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,H,C){let V;C===void 0?C=H:H!==void 0&&(V=H);let L=[],M=[],r=0;for(let o of e)L[r]=V?V(o,r):r,M[r]=C(o,r),r++;return{values:M,keys:L}}render(e,H,C){return this.dt(e,H,C).values}update(e,[H,C,V]){let L=e3(e),{values:M,keys:r}=this.dt(H,C,V);if(!Array.isArray(L))return this.ut=r,M;let o=this.ut??=[],i=[],d,v,A=0,u=L.length-1,S=0,O=M.length-1;for(;A<=u&&S<=O;)if(L[A]===null)A++;else if(L[u]===null)u--;else if(o[A]===r[S])i[S]=U(L[A],M[S]),A++,S++;else if(o[u]===r[O])i[O]=U(L[u],M[O]),u--,O--;else if(o[A]===r[O])i[O]=U(L[A],M[O]),r1(e,i[O+1],L[A]),A++,O--;else if(o[u]===r[S])i[S]=U(L[u],M[S]),r1(e,L[A],L[u]),u--,S++;else if(d===void 0&&(d=M3(r,S,O),v=M3(o,A,u)),d.has(o[A]))if(d.has(o[u])){let F=v.get(r[S]),e2=F!==void 0?L[F]:null;if(e2===null){let M5=r1(e,L[A]);U(M5,M[S]),i[S]=M5}else i[S]=U(e2,M[S]),r1(e,L[A],e2),L[F]=null;S++}else z1(L[u]),u--;else z1(L[A]),A++;for(;S<=O;){let F=r1(e,i[O+1]);U(F,M[S]),i[S++]=F}for(;A<=u;){let F=L[A++];F!==null&&z1(F)}return this.ut=r,L3(e,i),z}});var t3=["home-assistant","hc-main"],r3=null;function a0(){return t3.some(e=>customElements.get(e)!==void 0)}function s(e,H){let C=()=>{customElements.get(e)||customElements.define(e,H)};if(a0()){C();return}r3??=Promise.race(t3.map(V=>customElements.whenDefined(V))),r3.then(C)}function i0(){return Intl.DateTimeFormat().resolvedOptions().timeZone}function o3(e){return new Intl.NumberFormat(e).formatToParts(1.5).find(C=>C.type==="decimal")?.value??"."}function a3(e){let H=new Intl.DateTimeFormat(e,{hour:"numeric"}).resolvedOptions().hourCycle;return H==="h11"||H==="h12"}function g(e,H,C){let V=e.locale,L;switch(V?.number_format){case"comma_decimal":case"none":L=H==="cs"&&V?.number_format==="none"?",":".";break;case"decimal_comma":case"space_comma":L=",";break;case"system":L=o3(void 0);break;default:L=o3(H)}let M;switch(V?.time_format){case"12":M=!0;break;case"24":M=!1;break;case"system":M=a3(void 0);break;default:M=a3(H)}let r=C?.time_zone??e.config?.time_zone??i0();return{lang:H,decimalSeparator:L,hour12:M,timeZone:r}}function A0(e,H){return e.toFixed(1).replace(".",H.decimalSeparator)}function k(e,H){return e==null||!Number.isFinite(e)?"\u2014":`${A0(e,H)} \xB0C`}var n0={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};function R(e,H){let C=new Intl.DateTimeFormat("en-US",{timeZone:H,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",weekday:"short",hourCycle:"h23"}).formatToParts(e),V=L=>C.find(M=>M.type===L)?.value??"0";return{year:Number(V("year")),month:Number(V("month")),day:Number(V("day")),hour:Number(V("hour"))%24,minute:Number(V("minute")),weekday:n0[V("weekday")]??0}}function i3(e,H){let C=R(new Date(e),H);return Date.UTC(C.year,C.month-1,C.day,C.hour,C.minute)-Math.floor(e/6e4)*6e4}function n3(e,H,C,V,L,M){let r=Date.UTC(e,H-1,C,V,L),o=r-i3(r,M),i=i3(o,M);return i!==r-o&&(o=r-i),new Date(o)}function d3(e,H){let C=R(e,H.timeZone);if(!H.hour12)return`${String(C.hour).padStart(2,"0")}:${String(C.minute).padStart(2,"0")}`;let V=C.hour<12?"AM":"PM";return`${C.hour%12===0?12:C.hour%12}:${String(C.minute).padStart(2,"0")} ${V}`}var d0={cs:["pond\u011Bl\xED","\xFAter\xFD","st\u0159edy","\u010Dtvrtka","p\xE1tku","soboty","ned\u011Ble"],en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]},m0={cs:"z\xEDtra",en:"tomorrow"},p0={cs:["po","\xFAt","st","\u010Dt","p\xE1","so","ne"],en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]},s0=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function m3(e,H){return H==="cs"?`${e.day}. ${e.month}.`:`${e.day} ${s0[e.month-1]}`}function x1(e,H,C){let V=new Date(e),L=d3(V,C),M=R(V,C.timeZone),r=A3(M)-A3(R(H,C.timeZone));return r<=0?L:r===1?`${m0[C.lang]} ${L}`:r<7?`${d0[C.lang][M.weekday]} ${L}`:`${m3(M,C.lang)} ${L}`}function A3(e){return Math.round(Date.UTC(e.year,e.month-1,e.day)/(24*3600*1e3))}function b(e,H){let C=new Date(e),V=R(C,H.timeZone);return`${p0[H.lang][V.weekday]} ${m3(V,H.lang)} ${d3(C,H)}`}function Q(e,H){return H(`mode.${e}`)}function p3(e,H,C,V,L){let M=e.source==="plan"?V("reason.plan",{mode:Q(e.mode,V)}):e.source==="house_away"&&L?V("reason.zone_away",{zone:L}):V(`reason.${e.source}`);if(!e.valid_until)return M;let r=e.source==="vacation"?b(e.valid_until,C):x1(e.valid_until,H,C);return`${M} ${V("room.until",{until:r})}`}function N1(e,H,C){let V=b(e.start,H);return e.end?C("house.planned",{from:V,to:b(e.end,H)}):C("house.planned_open",{from:V})}function l0(e,H){return H==="\xB0F"?(e-32)*5/9:H==="K"?e-273.15:e}function s3(e,H){let C=H.config?.unit_system?.temperature,V=(M,r)=>{let o=typeof M=="number"?M:Number.parseFloat(String(M));return Number.isFinite(o)?l0(o,r):null};if(e.temperature_entity){let M=H.states[e.temperature_entity];if(M&&M.state!=="unavailable"&&M.state!=="unknown"){let r=e.temperature_entity.startsWith("climate.")?V(M.attributes.current_temperature,C):V(M.state,M.attributes.unit_of_measurement??C);if(r!==null)return Math.round(r*10)/10}}let L=e.trvs.map(M=>H.states[M]).filter(M=>M&&M.state!=="unavailable"&&M.state!=="unknown").map(M=>V(M.attributes.current_temperature,C)).filter(M=>M!==null);return L.length?Math.round(L.reduce((M,r)=>M+r,0)/L.length*10)/10:e.current_temperature}function I1(e){let H=Math.floor(e/60),C=e%60;return H===0?`${C} min`:C===0?`${H} h`:`${H} h ${C} min`}var l3={"app.title":"Topen\xED","nav.home":"P\u0159ehled","nav.plans":"Pl\xE1ny","nav.advanced":"Roz\u0161\xED\u0159en\xE9","nav.temps":"Teploty","common.save":"Ulo\u017Eit","common.cancel":"Zru\u0161it","common.back":"Zp\u011Bt","common.unsaved_title":"Neulo\u017Een\xE9 zm\u011Bny","common.close":"Zav\u0159\xEDt","common.delete":"Smazat","common.edit":"Upravit","common.loading":"Na\u010D\xEDt\xE1m\u2026","common.conflict_title":"Zm\u011Bn\u011Bno jinde","common.conflict_message":"N\u011Bkdo jin\xFD to mezit\xEDm zm\u011Bnil. Ponechat va\u0161i verzi a p\u0159epsat jeho zm\u011Bny?","common.overwrite":"Ponechat moje","common.discard_mine":"Zahodit moje","common.not_loaded":"Pl\xE1nova\u010D topen\xED neb\u011B\u017E\xED. Zkontrolujte integraci v Nastaven\xED.","mode.comfort":"Teplo","mode.eco":"\xDAspora","mode.night":"Noc","mode.away":"Pry\u010D","mode.frost":"Proti mrazu","mode.off":"Vypnuto","mode.manual":"Ru\u010Dn\u011B","mode.boost":"Naplno","house.auto":"Norm\xE1ln\u011B","house.away":"Pry\u010D","house.vacation":"Dovolen\xE1","house.off":"Vypnuto","house.title":"Cel\xFD d\u016Fm","house.mixed":"R\u016Fzn\u011B","house.detail.auto":"M\xEDstnosti top\xED podle sv\xFDch pl\xE1n\u016F","house.detail.away":"M\xEDstnosti maj\xED {temp}","house.detail.off":"Topen\xED je vypnut\xE9","house.banner.away":"Cel\xFD d\u016Fm je v re\u017Eimu Pry\u010D","house.banner.vacation":"Dovolen\xE1 do {until}","house.banner.vacation_open":"Dovolen\xE1 je zapnut\xE1","house.banner.off":"Topen\xED je v cel\xE9m dom\u011B vypnut\xE9","house.banner.away_zone":"Tato \u010D\xE1st domu je v re\u017Eimu Pry\u010D","house.banner.off_zone":"Topen\xED je v t\xE9to \u010D\xE1sti domu vypnut\xE9","house.home_again":"Jsem doma \u2014 Norm\xE1ln\u011B","hints.away":"Cel\xFD d\u016Fm je v re\u017Eimu Pry\u010D. A\u017E se vr\xE1t\xEDte, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.away_zone":"{zone} je v re\u017Eimu Pry\u010D. A\u017E se vr\xE1t\xEDte, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.vacation":"Dovolen\xE1 do {until}. Kdy\u017E se vr\xE1t\xEDte d\u0159\xEDv, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.vacation_open":"Dovolen\xE1 je zapnut\xE1. A\u017E se vr\xE1t\xEDte, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.vacation_zone":"{zone}: dovolen\xE1 do {until}. Kdy\u017E se vr\xE1t\xEDte d\u0159\xEDv, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.vacation_open_zone":"{zone}: dovolen\xE1 je zapnut\xE1. A\u017E se vr\xE1t\xEDte, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.off":"Topen\xED je v cel\xE9m dom\u011B vypnut\xE9. A\u017E budete cht\xEDt znovu topit, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.off_zone":"{zone}: topen\xED je vypnut\xE9. A\u017E budete cht\xEDt znovu topit, p\u0159epn\u011Bte na Norm\xE1ln\u011B.","hints.planned_zone":"{zone}: dovolen\xE1 napl\xE1novan\xE1 od {from} do {to}","hints.planned_open_zone":"{zone}: dovolen\xE1 napl\xE1novan\xE1 od {from}","home.problems":"Probl\xE9m s hlavic\xED: {rooms}. Podrobnosti uk\xE1\u017Ee klepnut\xED na ikonu m\xEDstnosti.","house.heating_on":"Zapnout topen\xED \u2014 Norm\xE1ln\u011B","house.planned":"Napl\xE1novan\xE1 dovolen\xE1: {from} \u2013 {to}","house.planned_open":"Napl\xE1novan\xE1 dovolen\xE1 od {from}","house.cancel_planned":"Zru\u0161it dovolenou","boost.title":"Zatopit naplno","boost.idle":"V\u0161echny m\xEDstnosti naplno na {duration}","boost.running":"Naplno do {until}","boost.start":"Zatopit","boost.stop":"Ukon\u010Dit","boost.confirm_start":"Zatopit ve v\u0161ech m\xEDstnostech naplno na {duration}?","boost.confirm_start_modes":"Zatopit ve v\u0161ech m\xEDstnostech naplno na {duration}? Pry\u010D, dovolen\xE1 a vypnut\xE9 topen\xED skon\u010D\xED.","boost.confirm_start_button":"Ano, zatopit","boost.confirm_stop":"Ukon\u010Dit zat\xE1p\u011Bn\xED naplno? M\xEDstnosti se vr\xE1t\xED ke sv\xFDm pl\xE1n\u016Fm.","boost.confirm_stop_button":"Ano, ukon\u010Dit","house.confirm.away":"P\u0159epnout cel\xFD d\u016Fm na Pry\u010D? V\u0161echny m\xEDstnosti budou na {temp}.","house.confirm.away_zone":"P\u0159epnout z\xF3nu {zone} na Pry\u010D? Jej\xED m\xEDstnosti budou m\xEDt {temp}.","house.confirm.away_button":"Ano, p\u0159epnout na Pry\u010D","house.confirm.off":"Vypnout topen\xED v cel\xE9m dom\u011B?","house.confirm.off_zone":"Vypnout topen\xED v z\xF3n\u011B {zone}?","house.confirm.off_button":"Ano, vypnout","house.confirm.cancel_vacation":"Zru\u0161it napl\xE1novanou dovolenou?","house.confirm.cancel_vacation_button":"Ano, zru\u0161it","room.set_to":"Nastaveno","room.until_next":"do {until} \u2192 {next}","room.until":"do {until}","room.back_to_plan":"Zp\u011Bt na pl\xE1n","room.no_trvs":"Zat\xEDm bez hlavic.","room.problem":"N\u011Bco nen\xED v po\u0159\xE1dku. Klepn\u011Bte pro podrobnosti.","room.off":"Topen\xED je vypnut\xE9","reason.plan":"Pl\xE1n: {mode}","reason.manual":"Ru\u010Dn\u011B zm\u011Bn\u011Bno","reason.house_away":"D\u016Fm: Pry\u010D","reason.zone_away":"{zone}: Pry\u010D","reason.vacation":"Dovolen\xE1","reason.house_off":"Topen\xED vypnuto","reason.boost":"Zat\xE1p\xED se naplno","health.title":"Co se d\u011Bje: {room}","health.unavailable":"Hlavice {name} neodpov\xEDd\xE1. Zkontrolujte baterie.","health.write_failed":"Hlavice {name} nep\u0159ijala novou teplotu. Za p\xE1r minut to zkus\xEDm znovu.","health.mismatch":"Hlavice {name} m\xE1 jinou teplotu, ne\u017E m\xE1 m\xEDt. Zkus\xEDm to opravit.","room.issue.unavailable":"Hlavice neodpov\xEDd\xE1","room.issue.write_failed":"Hlavice nep\u0159ijala teplotu","room.issue.mismatch":"Hlavice m\xE1 jinou teplotu","health.since":"Od {time}.","health.retry":"Zkusit hned","health.valve":"Zobrazit hlavici","health.details":"Podrobnosti jsou v \u010D\xE1sti Roz\u0161\xED\u0159en\xE9 \u2192 Hlavice.","vacation.title":"Dovolen\xE1","vacation.title_zone":"Dovolen\xE1: {zone}","vacation.from":"Odjezd","vacation.to":"N\xE1vrat","vacation.leave_at":"Den odjezdu","vacation.now":"Hned","vacation.later":"Pozd\u011Bji","vacation.temperature":"Teplota b\u011Bhem dovolen\xE9","vacation.start":"Zapnout dovolenou","vacation.plan":"Napl\xE1novat dovolenou","vacation.confirm":"Dovolen\xE1 od {from} do {to}. V\u0161echny m\xEDstnosti budou na {temp}.","vacation.confirm_now":"Dovolen\xE1 od te\u010F do {to}. V\u0161echny m\xEDstnosti budou na {temp}.","vacation.confirm_zone":"Dovolen\xE1 v z\xF3n\u011B {zone} od {from} do {to}. M\xEDstnosti budou m\xEDt {temp}.","vacation.confirm_now_zone":"Dovolen\xE1 v z\xF3n\u011B {zone} od te\u010F do {to}. M\xEDstnosti budou m\xEDt {temp}.","vacation.confirm_button":"Ano, zapnout dovolenou","vacation.error_end":"Vyberte, kdy se vr\xE1t\xEDte.","vacation.error_order":"N\xE1vrat mus\xED b\xFDt a\u017E po odjezdu.","plans.rooms_title":"Podle jak\xE9ho pl\xE1nu top\xED m\xEDstnosti","plans.own_plan":"Vlastn\xED pl\xE1n","plans.used_by":"Pou\u017E\xEDv\xE1: {rooms}","plans.unused":"Tento pl\xE1n nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","plans.new":"Nov\xFD pl\xE1n","plans.name":"N\xE1zev","plans.start_from":"Za\u010D\xEDt podle","plans.create":"Vytvo\u0159it","plans.delete_confirm":"Smazat pl\xE1n {name}?","plans.delete_confirm_used":"Smazat pl\xE1n {name}? Tyto m\xEDstnosti pak budou topit podle pl\xE1nu domu: {rooms}.","plans.edit":"Upravit pl\xE1n","plans.all_plans":"Pl\xE1ny","plans.house_badge":"D\u016Fm","editor.tap_day":"Klepn\u011Bte na den, kter\xFD chcete zm\u011Bnit.","editor.copy_day":"Kop\xEDrovat den do\u2026","editor.copy_title":"Kop\xEDrovat {day} do","editor.workdays":"Pracovn\xED dny","editor.weekend":"V\xEDkend","editor.all_days":"V\u0161echny dny","editor.copy":"Kop\xEDrovat","editor.mode":"Co se m\xE1 d\xEDt","editor.starts":"Za\u010D\xE1tek","editor.ends":"Konec","editor.add_change":"P\u0159idat zm\u011Bnu v {time}","editor.remove":"Odstranit tento \xFAsek","editor.earlier":"O 15 minut d\u0159\xEDve","editor.later":"O 15 minut pozd\u011Bji","editor.preview_title":"Ulo\u017Eit pl\xE1n?","editor.preview_changed":"Zm\u011Bn\u011Bn\xE9 dny jsou ozna\u010Den\xE9 te\u010Dkou.","editor.preview_used":"Pl\xE1n pou\u017E\xEDvaj\xED: {rooms}","editor.preview_unused":"Pl\xE1n zat\xEDm nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","editor.discard":"Zahodit zm\u011Bny?","editor.discard_button":"Zahodit","editor.saved":"Pl\xE1n je ulo\u017Een\xFD.","editor.unsaved":"Zat\xEDm neulo\u017Eeno","editor.parts":"\xDAseky dne","editor.drag_hint":"\u010Casy zm\u011Bn\xEDte posunut\xEDm b\xEDl\xFDch \xFAchyt\u016F, nebo klepn\u011Bte na \xFAsek.","day.0":"Pond\u011Bl\xED","day.1":"\xDAter\xFD","day.2":"St\u0159eda","day.3":"\u010Ctvrtek","day.4":"P\xE1tek","day.5":"Sobota","day.6":"Ned\u011Ble","day.acc.0":"pond\u011Bl\xED","day.acc.1":"\xFAter\xFD","day.acc.2":"st\u0159edu","day.acc.3":"\u010Dtvrtek","day.acc.4":"p\xE1tek","day.acc.5":"sobotu","day.acc.6":"ned\u011Bli","day.short.0":"Po","day.short.1":"\xDAt","day.short.2":"St","day.short.3":"\u010Ct","day.short.4":"P\xE1","day.short.5":"So","day.short.6":"Ne","adv.rooms":"M\xEDstnosti","adv.settings":"Nastaven\xED","adv.health":"Hlavice","adv.log":"Z\xE1znam","adv.rooms_desc":"Hlavice, pl\xE1n a teploty ka\u017Ed\xE9 m\xEDstnosti","adv.settings_desc":"Ru\u010Dn\xED zm\u011Bny, kontroly a testovac\xED re\u017Eim","adv.health_desc":"Co te\u010F d\u011Bl\xE1 ka\u017Ed\xE1 hlavice","adv.log_desc":"Co se v m\xEDstnosti d\u011Blo","adv.zones":"Z\xF3ny","adv.zones_desc":"\u010C\xE1sti domu s vlastn\xEDm re\u017Eimem, nap\u0159\xEDklad patra","adv.zones.add":"P\u0159idat z\xF3nu","adv.zones.from_floors":"Vytvo\u0159it z\xF3ny z pater","adv.zones.from_floors_hint":"Ka\u017Ed\xE1 m\xEDstnost p\u0159ejde do z\xF3ny podle patra sv\xE9 oblasti a z\xF3na dostane n\xE1zev patra. Z\xF3ny, kter\xE9 z\u016Fstanou pr\xE1zdn\xE9, se sma\u017Eou.","adv.zones.from_floors_none":"\u017D\xE1dn\xE1 m\xEDstnost nen\xED v oblasti na pat\u0159e. Nejd\u0159\xEDv v Home Assistantu p\u0159i\u0159a\u010Fte oblasti k patr\u016Fm.","adv.zones.from_floors_button":"Vytvo\u0159it z\xF3ny","adv.zones.name":"N\xE1zev","adv.zones.new_title":"Nov\xE1 z\xF3na","adv.zones.edit_title":"Z\xF3na","adv.zones.rooms":"M\xEDstnosti: {rooms}","adv.zones.no_rooms":"\u017D\xE1dn\xE9 m\xEDstnosti","adv.zones.delete_confirm":"Smazat z\xF3nu {name}? Jej\xED m\xEDstnosti p\u0159ejdou do z\xF3ny {first}.","adv.zones.one_hint":"S jednou z\xF3nou m\xE1 cel\xFD d\u016Fm jeden re\u017Eim. P\u0159idejte z\xF3ny, aby \u010D\xE1sti domu, nap\u0159\xEDklad patra, m\u011Bly vlastn\xED re\u017Eim a dovolenou.","adv.rooms.add":"P\u0159idat m\xEDstnost","adv.rooms.import":"P\u0159idat m\xEDstnosti podle oblast\xED","adv.rooms.import_hint":"Oblasti v Home Assistantu, kter\xE9 maj\xED hlavice:","adv.rooms.import_none":"\u017D\xE1dn\xE1 oblast s voln\xFDmi hlavicemi nebyla nalezena.","adv.rooms.import_button":"P\u0159idat vybran\xE9","adv.rooms.name":"N\xE1zev","adv.rooms.trvs":"Termostatick\xE9 hlavice","adv.rooms.no_climates":"Home Assistant nem\xE1 \u017E\xE1dn\xE9 hlavice (entity climate).","adv.rooms.temperature_entity":"Zobrazen\xE1 teplota","adv.rooms.plan":"Pl\xE1n","adv.rooms.temp_set":"Teploty","adv.rooms.zone":"Z\xF3na","adv.rooms.delete_confirm":"Smazat m\xEDstnost {name}? Jej\xED hlavice u\u017E nebudou \u0159\xEDzen\xE9.","adv.rooms.move_up":"Posunout nahoru","adv.rooms.move_down":"Posunout dol\u016F","adv.rooms.empty":"Zat\xEDm \u017E\xE1dn\xE9 m\xEDstnosti. P\u0159idejte m\xEDstnost nebo m\xEDstnosti podle oblast\xED v Home Assistantu.","adv.rooms.edit_title":"M\xEDstnost","temps.house":"Teploty domu","temps.house_hint":"Plat\xED pro v\u0161echny m\xEDstnosti, pokud nemaj\xED vlastn\xED sadu.","temps.sets_hint":"Sada m\u011Bn\xED jen n\u011Bkter\xE9 teploty. Ostatn\xED plat\xED jako pro d\u016Fm.","temps.as_house":"Jako d\u016Fm","temps.use_house":"Pou\u017E\xEDt hodnotu domu","temps.own":"Vlastn\xED","temps.new":"Nov\xE1 sada","temps.used_by":"Pou\u017E\xEDv\xE1: {rooms}","temps.unused":"Tuto sadu nepou\u017E\xEDv\xE1 \u017E\xE1dn\xE1 m\xEDstnost.","temps.rooms_title":"Jak\xE9 teploty pou\u017E\xEDvaj\xED m\xEDstnosti","temps.delete_confirm":"Smazat sadu {name}?","temps.delete_confirm_used":"Smazat sadu {name}? Tyto m\xEDstnosti pak budou m\xEDt teploty domu: {rooms}.","adv.settings.max_override":"Nejdel\u0161\xED ru\u010Dn\xED zm\u011Bna","adv.settings.max_override_hint":"Zm\u011Bna na hlavici nebo v aplikaci skon\u010D\xED p\u0159i dal\u0161\xED zm\u011Bn\u011B pl\xE1nu, nejpozd\u011Bji ale po t\xE9to dob\u011B.","adv.settings.safety_interval":"Kontrolovat hlavice ka\u017Ed\xFDch","adv.settings.mismatch_alert":"Upozornit na \u0161patnou teplotu po","adv.settings.vacation_mode":"Teplota na dovolen\xE9","adv.settings.boost":"D\xE9lka zatopen\xED naplno","adv.settings.dry_run":"Zku\u0161ebn\xED re\u017Eim: jen po\u010D\xEDtat, hlavic\xEDm nic nepos\xEDlat","adv.settings.saved":"Nastaven\xED je ulo\u017Een\xE9.","adv.health.all_ok":"V\u0161echny hlavice jsou v po\u0159\xE1dku.","adv.health.check_now":"Zkontrolovat v\u0161echny hlavice","adv.health.phase.idle":"V po\u0159\xE1dku","adv.health.phase.writing":"Pos\xEDl\xE1m","adv.health.phase.waiting":"Nedostupn\xE1","adv.health.phase.failed":"Selhalo","adv.health.wanted":"M\xE1 m\xEDt","adv.health.valve":"Hlavice m\xE1","adv.health.last_write":"Naposledy posl\xE1no","adv.health.error":"Chyba","adv.log.room":"M\xEDstnost","adv.log.empty":"Zat\xEDm nic.","adv.rooms.none_trvs":"Bez hlavic","adv.rooms.new_title":"Nov\xE1 m\xEDstnost","adv.rooms.sensor_hint":"Jen pro zobrazen\xED v aplikaci; hlavice d\xE1l pou\u017E\xEDvaj\xED sv\u016Fj senzor.","adv.rooms.sensor_empty":"Kdy\u017E je pr\xE1zdn\xE9: pr\u016Fm\u011Br z hlavic.","temps.save_hint":"Po ulo\u017Een\xED se zm\u011Bny hned projev\xED v m\xEDstnostech.","adv.health.mode":"Re\u017Eim","adv.log.refresh":"Obnovit","adv.settings.hours":"{n} h","adv.settings.minutes":"{n} min","adv.settings.frost":"Proti mrazu","adv.settings.away":"Pry\u010D","adv.dry_run_banner":"Zku\u0161ebn\xED re\u017Eim: hlavic\xEDm se nic nepos\xEDl\xE1.","log.write":"Odesl\xE1no","log.verified":"Hlavice potvrdila","log.retry":"Bez odpov\u011Bdi, zkou\u0161\xEDm znovu","log.failed":"Selhalo","log.dry_run":"Poslal bych (zku\u0161ebn\xED re\u017Eim)","log.manual":"Zm\u011Bn\u011Bno na hlavici","log.manual_ignored":"Zm\u011Bna na hlavici vr\xE1cena (re\u017Eim domu nebo zat\xE1p\u011Bn\xED naplno)","log.override_set":"Zm\u011Bn\u011Bno v aplikaci","log.override_cleared":"Zp\u011Bt na pl\xE1n","log.override_expired":"Ru\u010Dn\xED zm\u011Bna skon\u010Dila","log.unavailable":"Hlavice nedostupn\xE1","log.available":"Hlavice op\u011Bt dostupn\xE1","log.boost_started":"Za\u010Dalo zat\xE1p\u011Bn\xED naplno","log.boost_ended":"Skon\u010Dilo zat\xE1p\u011Bn\xED naplno","error.revision_conflict":"Nastaven\xED mezit\xEDm zm\u011Bnil n\u011Bkdo jin\xFD. Str\xE1nka u\u017E ukazuje nov\xFD stav, zkuste to pros\xEDm znovu.","error.house_mode_active":"Tato \u010D\xE1st domu nen\xED v re\u017Eimu Norm\xE1ln\u011B.","error.boost_active":"Pr\xE1v\u011B se zat\xE1p\xED naplno. Nejd\u0159\xEDv to ukon\u010Dete.","error.boost_duration":"Zatopen\xED naplno trv\xE1 15 minut a\u017E 4 hodiny.","error.duplicate_name":"Tento n\xE1zev u\u017E existuje.","error.name_required":"Zadejte n\xE1zev.","error.name_too_long":"N\xE1zev je p\u0159\xEDli\u0161 dlouh\xFD.","error.trv_in_two_rooms":"Hlavice m\u016F\u017Ee pat\u0159it jen do jedn\xE9 m\xEDstnosti.","error.invalid_trv":"Termostat m\xEDstnosti nelze pou\u017E\xEDt jako hlavici.","error.plan_empty":"Pl\xE1n je pr\xE1zdn\xFD.","error.temperature_range":"Teplota mus\xED b\xFDt mezi 5 a 30 \xB0C.","error.setting_range":"Tato hodnota je mimo povolen\xFD rozsah.","error.vacation_order":"Dovolen\xE1 mus\xED skon\u010Dit a\u017E po sv\xE9m za\u010D\xE1tku.","error.not_loaded":"Pl\xE1nova\u010D topen\xED neb\u011B\u017E\xED.","error.last_zone":"Posledn\xED z\xF3nu nelze smazat.","error.unknown_zone":"Z\xF3na u\u017E neexistuje.","error.unknown":"N\u011Bco se nepovedlo: {message}","card.name":"Pl\xE1nova\u010D topen\xED","card.description":"M\xEDstnosti s teplotami, pl\xE1ny a ru\u010Dn\xEDmi zm\u011Bnami.","card.room":"M\xEDstnost","card.zone":"Z\xF3na","card.whole_house":"Cel\xFD d\u016Fm","card.all_rooms":"V\u0161echny m\xEDstnosti","card.compact":"Kompaktn\xED seznam","card.show_house":"Zobrazit re\u017Eim domu","card.show_rooms":"Zobrazit m\xEDstnosti","card.open_panel":"Otev\u0159\xEDt topen\xED"};var W1={"app.title":"Heating","nav.home":"Overview","nav.plans":"Plans","nav.advanced":"Advanced","nav.temps":"Temperatures","common.save":"Save","common.cancel":"Cancel","common.back":"Back","common.unsaved_title":"Unsaved changes","common.close":"Close","common.delete":"Delete","common.edit":"Change","common.loading":"Loading\u2026","common.conflict_title":"Changed elsewhere","common.conflict_message":"Somebody else changed this meanwhile. Keep your version and overwrite theirs?","common.overwrite":"Keep mine","common.discard_mine":"Discard mine","common.not_loaded":"The heating scheduler is not running. Check the integration in Settings.","mode.comfort":"Warm","mode.eco":"Saving","mode.night":"Night","mode.away":"Away","mode.frost":"Frost guard","mode.off":"Off","mode.manual":"By hand","mode.boost":"Boost","house.auto":"Normal","house.away":"Away","house.vacation":"Holiday","house.off":"Off","house.title":"Whole house","house.mixed":"Mixed","house.detail.auto":"The rooms follow their plans","house.detail.away":"The rooms are kept at {temp}","house.detail.off":"The heating is off","house.banner.away":"The whole house is set to Away","house.banner.vacation":"Holiday until {until}","house.banner.vacation_open":"Holiday is on","house.banner.off":"Heating is off in the whole house","house.banner.away_zone":"This part of the house is set to Away","house.banner.off_zone":"Heating is off in this part of the house","house.home_again":"I'm home \u2014 Normal","hints.away":"The whole house is set to Away. When you are back, switch to Normal.","hints.away_zone":"{zone} is set to Away. When you are back, switch to Normal.","hints.vacation":"Holiday until {until}. If you are back earlier, switch to Normal.","hints.vacation_open":"Holiday is on. When you are back, switch to Normal.","hints.vacation_zone":"{zone}: holiday until {until}. If you are back earlier, switch to Normal.","hints.vacation_open_zone":"{zone}: holiday is on. When you are back, switch to Normal.","hints.off":"Heating is off in the whole house. To heat again, switch to Normal.","hints.off_zone":"{zone}: heating is off. To heat again, switch to Normal.","hints.planned_zone":"{zone}: holiday planned from {from} to {to}","hints.planned_open_zone":"{zone}: holiday planned from {from}","home.problems":"Valve problem: {rooms}. Tap the room's icon for details.","house.heating_on":"Turn heating on \u2014 Normal","house.planned":"Holiday planned: {from} \u2013 {to}","house.planned_open":"Holiday planned from {from}","house.cancel_planned":"Cancel holiday","boost.title":"Boost","boost.idle":"Every room at full heat for {duration}","boost.running":"Full heat until {until}","boost.start":"Start","boost.stop":"Stop","boost.confirm_start":"Heat every room at full power for {duration}?","boost.confirm_start_modes":"Heat every room at full power for {duration}? Away, Holiday and Off end.","boost.confirm_start_button":"Yes, heat","boost.confirm_stop":"Stop heating at full power? The rooms go back to their plans.","boost.confirm_stop_button":"Yes, stop","house.confirm.away":"Switch the whole house to Away? All rooms will be kept at {temp}.","house.confirm.away_zone":"Switch {zone} to Away? Its rooms will be kept at {temp}.","house.confirm.away_button":"Yes, switch to Away","house.confirm.off":"Turn off the heating in the whole house?","house.confirm.off_zone":"Turn off the heating in {zone}?","house.confirm.off_button":"Yes, turn off","house.confirm.cancel_vacation":"Cancel the planned holiday?","house.confirm.cancel_vacation_button":"Yes, cancel it","room.set_to":"Set to","room.until_next":"until {until} \u2192 {next}","room.until":"until {until}","room.back_to_plan":"Back to plan","room.no_trvs":"No radiator valves yet.","room.problem":"Something is wrong. Tap for details.","room.off":"Heating is off","reason.plan":"Plan: {mode}","reason.manual":"Changed by hand","reason.house_away":"House: Away","reason.zone_away":"{zone}: Away","reason.vacation":"Holiday","reason.house_off":"Heating off","reason.boost":"Boost","health.title":"What is wrong in {room}","health.unavailable":"The valve {name} does not respond. Check its batteries.","health.write_failed":"The valve {name} did not take the new temperature. It will be tried again in a few minutes.","health.mismatch":"The valve {name} has a different temperature than it should. It will be corrected.","room.issue.unavailable":"A valve does not respond","room.issue.write_failed":"A valve did not take the temperature","room.issue.mismatch":"A valve has a different temperature","health.since":"Since {time}.","health.retry":"Try again now","health.valve":"Show valve","health.details":"Details are in Advanced \u2192 Valves.","vacation.title":"Holiday","vacation.title_zone":"Holiday: {zone}","vacation.from":"Leaving","vacation.to":"Coming back","vacation.leave_at":"Leaving on","vacation.now":"Now","vacation.later":"Later","vacation.temperature":"Temperature while away","vacation.start":"Turn holiday on","vacation.plan":"Plan the holiday","vacation.confirm":"Holiday from {from} to {to}. All rooms will be kept at {temp}.","vacation.confirm_now":"Holiday from now to {to}. All rooms will be kept at {temp}.","vacation.confirm_zone":"Holiday in {zone} from {from} to {to}. Its rooms will be kept at {temp}.","vacation.confirm_now_zone":"Holiday in {zone} from now to {to}. Its rooms will be kept at {temp}.","vacation.confirm_button":"Yes, turn holiday on","vacation.error_end":"Choose when you come back.","vacation.error_order":"The return must be after the start.","plans.rooms_title":"Which plan each room follows","plans.own_plan":"Own plan","plans.used_by":"Used by: {rooms}","plans.unused":"No room uses this plan.","plans.new":"New plan","plans.name":"Name","plans.start_from":"Start from","plans.create":"Create","plans.delete_confirm":"Delete the plan {name}?","plans.delete_confirm_used":"Delete the plan {name}? These rooms will then follow the house plan: {rooms}.","plans.edit":"Change plan","plans.all_plans":"Plans","plans.house_badge":"House","editor.tap_day":"Tap a day to change it.","editor.copy_day":"Copy this day to\u2026","editor.copy_title":"Copy {day} to","editor.workdays":"Workdays","editor.weekend":"Weekend","editor.all_days":"All days","editor.copy":"Copy","editor.mode":"What should happen","editor.starts":"Starts","editor.ends":"Ends","editor.add_change":"Add a change at {time}","editor.remove":"Remove this part","editor.earlier":"15 minutes earlier","editor.later":"15 minutes later","editor.preview_title":"Save this plan?","editor.preview_changed":"Changed days are marked with a dot.","editor.preview_used":"This plan is used by: {rooms}","editor.preview_unused":"No room uses this plan yet.","editor.discard":"Discard your changes?","editor.discard_button":"Discard","editor.saved":"The plan is saved.","editor.unsaved":"Not saved yet","editor.parts":"Parts of the day","editor.drag_hint":"Drag the white handles to change times, or tap a part.","day.0":"Monday","day.1":"Tuesday","day.2":"Wednesday","day.3":"Thursday","day.4":"Friday","day.5":"Saturday","day.6":"Sunday","day.acc.0":"Monday","day.acc.1":"Tuesday","day.acc.2":"Wednesday","day.acc.3":"Thursday","day.acc.4":"Friday","day.acc.5":"Saturday","day.acc.6":"Sunday","day.short.0":"Mo","day.short.1":"Tu","day.short.2":"We","day.short.3":"Th","day.short.4":"Fr","day.short.5":"Sa","day.short.6":"Su","adv.rooms":"Rooms","adv.settings":"Settings","adv.health":"Valves","adv.log":"Log","adv.rooms_desc":"Valves, plan and temperatures of each room","adv.settings_desc":"Manual changes, checks and test mode","adv.health_desc":"What each valve does now","adv.log_desc":"What happened in a room","adv.zones":"Zones","adv.zones_desc":"Parts of the house with their own mode, e.g. floors","adv.zones.add":"Add zone","adv.zones.from_floors":"Create zones from floors","adv.zones.from_floors_hint":"Each room goes to the zone of its area's floor, and the zone gets the floor's name. Zones left empty are removed.","adv.zones.from_floors_none":"No room is in an area on a floor. Put the areas on floors in Home Assistant first.","adv.zones.from_floors_button":"Create zones","adv.zones.name":"Name","adv.zones.new_title":"New zone","adv.zones.edit_title":"Zone","adv.zones.rooms":"Rooms: {rooms}","adv.zones.no_rooms":"No rooms","adv.zones.delete_confirm":"Delete the zone {name}? Its rooms move to {first}.","adv.zones.one_hint":"With one zone, the whole house has one mode. Add zones to give parts of the house, such as floors, their own mode and holiday.","adv.rooms.add":"Add room","adv.rooms.import":"Add rooms from areas","adv.rooms.import_hint":"Areas in Home Assistant that have radiator valves:","adv.rooms.import_none":"No area with unassigned radiator valves was found.","adv.rooms.import_button":"Add selected","adv.rooms.name":"Name","adv.rooms.trvs":"Radiator valves","adv.rooms.no_climates":"Home Assistant has no radiator valves (climate entities).","adv.rooms.temperature_entity":"Temperature shown","adv.rooms.plan":"Plan","adv.rooms.temp_set":"Temperatures","adv.rooms.zone":"Zone","adv.rooms.delete_confirm":"Delete the room {name}? Its valves will no longer be controlled.","adv.rooms.move_up":"Move up","adv.rooms.move_down":"Move down","adv.rooms.empty":"No rooms yet. Add a room, or add rooms from Home Assistant areas.","adv.rooms.edit_title":"Room","temps.house":"House temperatures","temps.house_hint":"Every room uses these, unless it has its own set.","temps.sets_hint":"A set changes only some temperatures. The others come from the house.","temps.as_house":"As house","temps.use_house":"Use the house value","temps.own":"Own","temps.new":"New set","temps.used_by":"Used by: {rooms}","temps.unused":"No room uses this set.","temps.rooms_title":"Which temperatures each room uses","temps.delete_confirm":"Delete the set {name}?","temps.delete_confirm_used":"Delete the set {name}? These rooms will then use the house temperatures: {rooms}.","adv.settings.max_override":"Longest manual change","adv.settings.max_override_hint":"A change on a valve or in the app ends at the next change of the plan, but never later than this.","adv.settings.safety_interval":"Check the valves every","adv.settings.mismatch_alert":"Warn about a wrong temperature after","adv.settings.vacation_mode":"Temperature during a holiday","adv.settings.boost":"Boost length","adv.settings.dry_run":"Test mode: compute only, send nothing to the valves","adv.settings.saved":"Settings saved.","adv.health.all_ok":"All valves are fine.","adv.health.check_now":"Check all valves now","adv.health.phase.idle":"OK","adv.health.phase.writing":"Sending","adv.health.phase.waiting":"Offline","adv.health.phase.failed":"Failed","adv.health.wanted":"Wanted","adv.health.valve":"Valve","adv.health.last_write":"Last sent","adv.health.error":"Error","adv.log.room":"Room","adv.log.empty":"Nothing recorded yet.","adv.rooms.none_trvs":"No valves","adv.rooms.new_title":"New room","adv.rooms.sensor_hint":"Shown in the app only; the valves keep their own sensor.","adv.rooms.sensor_empty":"When empty: the average of the valves.","temps.save_hint":"Changes apply to the rooms at once after saving.","adv.health.mode":"Mode","adv.log.refresh":"Refresh","adv.settings.hours":"{n} h","adv.settings.minutes":"{n} min","adv.settings.frost":"Frost guard","adv.settings.away":"Away","adv.dry_run_banner":"Test mode is on: nothing is sent to the valves.","log.write":"Sent","log.verified":"Confirmed by the valve","log.retry":"No answer, trying again","log.failed":"Failed","log.dry_run":"Would send (test mode)","log.manual":"Changed on the valve","log.manual_ignored":"Change on the valve undone (house mode or boost)","log.override_set":"Changed in the app","log.override_cleared":"Back to plan","log.override_expired":"Manual change ended","log.unavailable":"Valve offline","log.available":"Valve back online","log.boost_started":"Boost started","log.boost_ended":"Boost ended","error.revision_conflict":"Somebody else changed the settings meanwhile. The page shows the new state now; please try again.","error.house_mode_active":"This part of the house is not in Normal mode.","error.boost_active":"Heating at full power is on. Stop it first.","error.boost_duration":"A boost lasts from 15 minutes to 4 hours.","error.duplicate_name":"This name is already used.","error.name_required":"Enter a name.","error.name_too_long":"The name is too long.","error.trv_in_two_rooms":"A valve can belong to one room only.","error.invalid_trv":"A room thermostat cannot be used as a valve.","error.plan_empty":"The plan is empty.","error.temperature_range":"The temperature must be between 5 and 30 \xB0C.","error.setting_range":"This value is out of range.","error.vacation_order":"The holiday must end after it starts.","error.not_loaded":"The heating scheduler is not running.","error.last_zone":"The last zone cannot be deleted.","error.unknown_zone":"The zone no longer exists.","error.unknown":"Something went wrong: {message}","card.name":"Heating Scheduler","card.description":"Rooms with their temperatures, plans and manual changes.","card.room":"Room","card.zone":"Zone","card.whole_house":"Whole house","card.all_rooms":"All rooms","card.compact":"Compact list","card.show_house":"Show the house mode","card.show_rooms":"Show the rooms","card.open_panel":"Open Heating"};var v0={cs:l3,en:W1};function n(e){return(e?.locale?.language??e?.language??"").toLowerCase().startsWith("en")?"en":"cs"}function p(e){let H=v0[e];return(C,V)=>{let L=H[C]??W1[C]??C;if(V)for(let[M,r]of Object.entries(V))L=L.split(`{${M}}`).join(String(r));return L}}var U1=Object.keys(W1);var P={comfort:"var(--deep-orange-color, #ff6f22)",eco:"var(--green-color, #4caf50)",night:"var(--indigo-color, #3f51b5)",away:"var(--blue-grey-color, #607d8b)",frost:"var(--cyan-color, #00bcd4)",off:"var(--grey-color, #9e9e9e)",manual:"var(--purple-color, #9c27b0)",boost:"var(--red-color, #f44336)"},B={comfort:Y5,eco:E5,night:X5,away:p2,frost:G5,off:U5,manual:B5,boost:T5},Q1={auto:"var(--primary-color, #009ac7)",away:P.away,vacation:"var(--teal-color, #009688)",off:P.off},u1={auto:$5,away:p2,vacation:f5,off:I5},v3=F5;function x3(e,H){let C=H.temp_sets.find(L=>L.id==="house"),V=H.temp_sets.find(L=>L.id===e.temp_set_id);return{...C?.temperatures??{},...V&&V.id!=="house"?V.temperatures:{}}}function C1(e,H){return e.temp_sets.find(C=>C.id==="house")?.temperatures[H]}var c=m`
  :host {
    font-family: var(--ha-font-family-body, Roboto, Noto, sans-serif);
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.6);
    color: var(--primary-text-color, #212121);
    -webkit-font-smoothing: var(--ha-font-smoothing, antialiased);
    -webkit-tap-highlight-color: transparent;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  button {
    font: inherit;
    color: inherit;
  }
  button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
  .muted {
    color: var(--secondary-text-color);
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
`;var u3=["hass-tabs-subpage","ha-card","ha-alert","ha-button","ha-icon-button","ha-svg-icon","ha-dialog","ha-dialog-header","ha-dialog-footer","ha-tile-container","ha-tile-icon","ha-tile-info","ha-tile-badge","ha-control-button","ha-control-button-group","ha-control-number-buttons","ha-control-select"];async function s2(e,H=1e4){let C=e.filter(V=>!customElements.get(V));if(C.length){let V;await Promise.race([Promise.all(C.map(L=>customElements.whenDefined(L))),new Promise(L=>V=setTimeout(L,H))]),clearTimeout(V)}return e.filter(V=>!customElements.get(V))}function t1(e,H,C){e.dispatchEvent(new CustomEvent(H,{bubbles:!0,composed:!0,detail:C}))}function c3(e,H){t1(e,"hass-notification",{message:H})}function w(e,H,C){t1(e,"show-dialog",{dialogTag:H,dialogImport:()=>customElements.whenDefined(H),dialogParams:C})}async function G1(){return window.loadCardHelpers||await s2(["ha-panel-lovelace"]),window.loadCardHelpers?window.loadCardHelpers():null}var y=class extends l{static{this.properties={hass:{attribute:!1},args:{state:!0},open:{state:!0}}}constructor(){super(),this.open=!1}connectedCallback(){super.connectedCallback(),this.style.setProperty("--ha-dialog-scrim-backdrop-filter","none"),this.style.setProperty("--mdc-dialog-scrim-color","rgba(0, 0, 0, 0.32)")}showDialog(H){if(this.args===void 0){this.start(H);return}this.dialogClosed(),this.args=void 0,this.updateComplete.then(()=>this.start(H))}start(H){this.dialogOpened(H),this.args=H,this.open=!0}closeDialog(){return this.open=!1,!0}dialogOpened(H){}dialogClosed(){}onClosed(H){H.target!==H.currentTarget||!H.target.isConnected||(this.dialogClosed(),this.args=void 0,t1(this,"dialog-closed",{dialog:this.localName}))}};async function l2(){for(let e=0;e<40&&history.state?.dialog==="dialog-box";e+=1)await new Promise(H=>setTimeout(H,50))}async function f(e,H){let C=await G1();if(!C)return window.confirm(`${H.heading}

${H.message}`);let V=await C.showConfirmationDialog(e,{title:H.heading,text:H.message,confirmText:H.confirm,dismissText:H.cancel,destructive:H.danger});return await l2(),V}function G(e,H){return f(e,{heading:H("common.conflict_title"),message:H("common.conflict_message"),confirm:H("common.overwrite"),cancel:H("common.discard_mine")})}async function K1(e,H){let C=await G1();if(!C)return window.prompt(H.heading,H.value);let V=await C.showPromptDialog(e,{title:H.heading,inputLabel:H.label,defaultValue:H.value,confirmText:H.confirm,dismissText:H.cancel});return await l2(),V}async function Z3(e,H,C){let V=await G1();if(!V){window.alert(`${H}

${C}`);return}await V.showAlertDialog(e,{title:H,text:C}),await l2()}var v2=class{constructor(H){this.snapshot=null;this.listeners=new Set;this.unsubscribe=null;this.retry=null;this.hass=H}setHass(H){this.hass=H}subscribe(H){return this.listeners.add(H),this.listeners.size===1&&this.start(),H(this.snapshot),()=>{this.listeners.delete(H),this.listeners.size===0&&this.stop()}}start(){this.unsubscribe=this.hass.connection.subscribeMessage(H=>{this.snapshot=H;for(let C of this.listeners)C(H)},{type:"heating_scheduler/subscribe"}),this.unsubscribe.catch(()=>{this.unsubscribe=null,this.retry=setTimeout(()=>{this.retry=null,this.listeners.size&&this.start()},1e4)})}stop(){this.retry&&clearTimeout(this.retry),this.retry=null;let H=this.unsubscribe;this.unsubscribe=null,H?.then(C=>C()).catch(()=>{})}call(H,C={}){return this.hass.callWS({type:`heating_scheduler/${H}`,...C})}},h3=new WeakMap;function x(e){let H=h3.get(e.connection);return H||(H=new v2(e),h3.set(e.connection,H)),H.setHass(e),H}function Z(e,H){let C=e?.code,V=`error.${C}`;if(C&&U1.includes(V))return H(V);let L=e?.message??String(e);return H("error.unknown",{message:L})}function h(e,H){c3(e,H)}function o1(e,H){return e.zones.find(C=>C.id===H.zone_id)??e.zones[0]}function a1(e){let H=new Set(e.zones.map(C=>C.house.effective));return H.size===1?[...H][0]:null}function K(e){let[H,...C]=e.zones;return H&&C.every(L=>JSON.stringify(L.house)===JSON.stringify(H.house))?H.house:null}function H1(e,H){return e.rooms.filter(C=>o1(e,C).id===H.id)}function S3(e,H,C,V){let L=H.indexOf(C),M=L<0?void 0:H[L+V];if(M===void 0)return null;let r=[...e],o=r.indexOf(C),i=r.indexOf(M);return[r[o],r[i]]=[r[i],r[o]],r}function q1(e){return String(e).padStart(2,"0")}function j1(e,H){let C=R(e,H);return`${C.year}-${q1(C.month)}-${q1(C.day)}`}function f3(e,H){let C=R(e,H);return`${q1(C.hour)}:${q1(C.minute)}`}var x0={date:{}},u0={time:{no_second:!0}},x2=class extends y{constructor(){super(...arguments);this.label=C=>C.name==="leave"?this.t("vacation.from"):this.t("vacation.temperature")}static{this.properties={data:{state:!0},error:{state:!0}}}static{this.styles=m`
    ha-alert {
      display: block;
      margin-bottom: var(--ha-space-4, 16px);
    }
    .when {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--ha-space-2, 8px);
      margin: var(--ha-space-6, 24px) 0;
    }
    .date {
      flex: 1 1 180px;
    }
    .time {
      flex: 0 0 auto;
    }
  `}dialogOpened(C){let V=C.snapshot.time_zone;this.data={leave:"now",start_date:j1(new Date,V),start_time:"08:00",end_date:j1(new Date(Date.now()+24*3600*1e3),V),end_time:"12:00",mode:C.snapshot.settings.vacation_mode};let M=(C.zone?C.zone.house:K(C.snapshot))?.vacation;if(M){let r=new Date(M.start);this.data={...this.data,leave:M.active?"now":"later",...M.active?{}:{start_date:j1(r,V),start_time:f3(r,V)},...M.end?{end_date:j1(new Date(M.end),V),end_time:f3(new Date(M.end),V)}:{},mode:M.mode}}this.error=""}async fail(C){this.error=C,await this.updateComplete,this.shadowRoot?.querySelector("ha-alert")?.scrollIntoView({block:"nearest",behavior:"smooth"})}get t(){return p(n(this.hass))}instant(C,V){let L=/^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2})/.exec(`${C??""} ${V??""}`);if(!L||!this.args)return null;let[M,r,o,i,d]=L.slice(1).map(Number);return n3(M,r,o,i,d,this.args.snapshot.time_zone)}leaveSchema(){let C=this.t;return[{name:"leave",selector:{select:{mode:"box",options:[{value:"now",label:C("vacation.now")},{value:"later",label:C("vacation.later")}]}}}]}modeSchema(){let C=this.t,V=this.args.snapshot,L=g(this.hass,n(this.hass),V),M=r=>k(C1(V,r),L);return[{name:"mode",selector:{select:{mode:"box",options:[{value:"frost",label:C("mode.frost"),description:M("frost")},{value:"away",label:C("mode.away"),description:M("away")}]}}}]}changed(C){this.data={...this.data,...C},this.error=""}when(C){let V=C==="start"?"start_date":"end_date",L=C==="start"?"start_time":"end_time";return t`<div class="when">
      <ha-selector
        class="date"
        .hass=${this.hass}
        .selector=${x0}
        .label=${C==="start"?this.t("vacation.leave_at"):this.t("vacation.to")}
        .value=${this.data[V]}
        .required=${!0}
        @value-changed=${M=>this.changed({[V]:M.detail.value})}
      ></ha-selector>
      <ha-selector
        class="time"
        .hass=${this.hass}
        .selector=${u0}
        .value=${this.data[L]}
        .required=${!0}
        @value-changed=${M=>this.changed({[L]:M.detail.value})}
      ></ha-selector>
    </div>`}async submit(){let C=this.t,V=this.args.snapshot,L=g(this.hass,n(this.hass),V),M=this.instant(this.data.end_date,this.data.end_time);if(!M){this.fail(C("vacation.error_end"));return}let r=this.data.leave==="later"?this.instant(this.data.start_date,this.data.start_time):null,o=r&&r.getTime()>Date.now()?r:null;if(M.getTime()<=(o??new Date).getTime()){this.fail(C("vacation.error_order"));return}let i=k(C1(V,this.data.mode),L),d=b(M.toISOString(),L),v=this.args.zone,A=o?b(o.toISOString(),L):"",u=v?o?C("vacation.confirm_zone",{zone:v.name,from:A,to:d,temp:i}):C("vacation.confirm_now_zone",{zone:v.name,to:d,temp:i}):o?C("vacation.confirm",{from:A,to:d,temp:i}):C("vacation.confirm_now",{to:d,temp:i});if(await f(this,{heading:C("vacation.title"),message:u,confirm:C("vacation.confirm_button"),cancel:C("common.back")}))try{await x(this.hass).call("vacation/set",{start:o?o.toISOString():null,end:M.toISOString(),mode:this.data.mode,zone_id:v?.id}),this.closeDialog()}catch(O){h(this,Z(O,C))}}render(){if(!this.args||!this.hass)return a;let C=this.t;return t`
      <ha-dialog
        .open=${this.open}
        header-title=${this.args.zone?C("vacation.title_zone",{zone:this.args.zone.name}):C("vacation.title")}
        @closed=${this.onClosed}
      >
        ${this.error?t`<ha-alert alert-type="error">${this.error}</ha-alert>`:a}
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.leaveSchema()}
          .computeLabel=${this.label}
          @value-changed=${V=>this.changed(V.detail.value)}
        ></ha-form>
        ${this.data.leave==="later"?this.when("start"):a} ${this.when("end")}
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.modeSchema()}
          .computeLabel=${this.label}
          @value-changed=${V=>this.changed(V.detail.value)}
        ></ha-form>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.closeDialog()}>
            ${C("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${this.submit}>
            ${this.data.leave==="later"?C("vacation.plan"):C("vacation.start")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-holiday-dialog",x2);function g3(e,H,C){w(e,"hs-holiday-dialog",{snapshot:H,zone:C})}async function i1(e,H,C,V){try{await x(H).call(C,V)}catch(L){h(e,Z(L,p(n(H))))}}async function X1(e,H,C,V,L){let M=p(n(H));if(L==="vacation"){g3(e,C,V);return}if(L==="away"){let r=k(C1(C,"away"),g(H,n(H),C));if(!await f(e,{heading:M("house.away"),message:V?M("house.confirm.away_zone",{zone:V.name,temp:r}):M("house.confirm.away",{temp:r}),confirm:M("house.confirm.away_button"),cancel:M("common.cancel")}))return}L==="off"&&!await f(e,{heading:M("house.off"),message:V?M("house.confirm.off_zone",{zone:V.name}):M("house.confirm.off"),confirm:M("house.confirm.off_button"),cancel:M("common.cancel"),danger:!0})||await i1(e,H,"house_mode/set",{mode:L,zone_id:V?.id})}async function Y1(e,H,C){let V=p(n(H));await f(e,{heading:V("house.vacation"),message:V("house.confirm.cancel_vacation"),confirm:V("house.confirm.cancel_vacation_button"),cancel:V("common.back")})&&await i1(e,H,"vacation/cancel",{zone_id:C?.id})}var u2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[c,m`
      :host {
        display: block;
      }
      ha-card {
        height: 100%;
      }
      ha-tile-icon {
        --tile-icon-color: var(--tile-color);
      }
      .features {
        display: grid;
      }
      ha-control-button-group {
        --control-button-group-thickness: var(--feature-height, 42px);
      }
      ha-control-button {
        --control-button-background-color: var(--tile-color);
      }
    `]}get t(){return p(n(this.hass))}get running(){let H=this.snapshot.boost_until;return H!==null&&new Date(H).getTime()>Date.now()}get duration(){return I1(this.snapshot.settings.boost_minutes)}async toggle(){if(!this.busy){this.busy=!0;try{let H=this.t,C=this.running,V=this.snapshot.zones.some(M=>M.house.effective!=="auto");await f(this,{heading:H("boost.title"),message:C?H("boost.confirm_stop"):H(V?"boost.confirm_start_modes":"boost.confirm_start",{duration:this.duration}),confirm:H(C?"boost.confirm_stop_button":"boost.confirm_start_button"),cancel:H("common.cancel")})&&await i1(this,this.hass,C?"boost/stop":"boost/start",{})}finally{this.busy=!1}}}render(){if(!this.snapshot||!this.hass)return a;let H=this.t,C=this.running,V=g(this.hass,n(this.hass),this.snapshot),L=C?H("boost.running",{until:x1(this.snapshot.boost_until,new Date,V)}):H("boost.idle",{duration:this.duration}),M=C?P.boost:"var(--state-inactive-color, #9e9e9e)";return t`
      <ha-card style="--tile-color:${M}">
        <ha-tile-container .interactive=${!0} .actionHandlerOptions=${{}} @action=${this.toggle}>
          <ha-tile-icon slot="icon" .iconPath=${B.boost}></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${H("boost.title")}</span>
            <span slot="secondary">${L}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-button-group>
              <ha-control-button .disabled=${this.busy} .label=${H("boost.title")} @click=${this.toggle}>
                ${H(C?"boost.stop":"boost.start")}
              </ha-control-button>
            </ha-control-button-group>
          </div>
        </ha-tile-container>
      </ha-card>
    `}};s("hs-boost-card",u2);var O3=["comfort","eco","night","away","frost","off"],b3=["comfort","eco","night","away","frost"],J1=["auto","away","vacation","off"];var C2=m`
  ha-alert {
    display: block;
  }
  .hint {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
  }
  .hint ha-button {
    margin-inline-start: auto;
  }
`;function c1(e,H,C,V){return t`<ha-alert alert-type="info">
    <div class="hint">
      <span>${e}</span>
      <ha-button appearance="plain" ?disabled=${V} @click=${C}>${H}</ha-button>
    </div>
  </ha-alert>`}var c2=class extends y{constructor(){super();this.unsubscribe=null;this.snapshot=null,this.busy=!1}static{this.properties={snapshot:{state:!0},busy:{state:!0}}}static{this.styles=[C2,m`
      p {
        margin: 0;
        text-align: center;
      }
      .state {
        font-size: 36px;
        font-weight: var(--ha-font-weight-normal, 400);
        line-height: var(--ha-line-height-condensed, 1.2);
      }
      .detail {
        margin-bottom: var(--ha-space-5, 20px);
        padding: var(--ha-space-1, 4px) 0;
        font-size: var(--ha-font-size-l, 16px);
        font-weight: var(--ha-font-weight-medium, 500);
        line-height: var(--ha-line-height-normal, 1.5);
        letter-spacing: 0.1px;
      }
      .controls {
        display: flex;
        justify-content: center;
      }
      ha-control-select {
        height: 45vh;
        max-height: max(320px, var(--modes-count, 1) * 80px);
        min-height: max(200px, var(--modes-count, 1) * 80px);
        --control-select-thickness: 130px;
        --control-select-border-radius: var(--ha-border-radius-6xl, 36px);
        --control-select-background: var(--disabled-color);
        --control-select-background-opacity: 0.2;
      }
      ha-alert {
        margin-top: var(--ha-space-6, 24px);
      }
    `]}dialogOpened(C){this.snapshot=C.snapshot}willUpdate(C){super.willUpdate(C),this.open&&this.hass&&!this.unsubscribe&&(this.unsubscribe=x(this.hass).subscribe(V=>{V&&(this.zone(V)===void 0?this.closeDialog():this.snapshot=V)}))}dialogClosed(){this.unsubscribe?.(),this.unsubscribe=null}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}get t(){return p(n(this.hass))}zone(C){let V=this.args?.zoneId;return V?C.zones.find(L=>L.id===V):null}detail(C,V,L){let M=this.t,r=g(this.hass,n(this.hass),C);if(!V||!L)return C.zones.map(o=>`${o.name}: ${M(`house.${o.house.effective}`)}`).join(" \xB7 ");switch(L){case"vacation":{let o=V.vacation?.end;return o?M("house.banner.vacation",{until:b(o,r)}):M("house.banner.vacation_open")}case"away":return M("house.detail.away",{temp:k(C1(C,"away"),r)});case"off":return M("house.detail.off");default:return M("house.detail.auto")}}async selected(C,V,L){let M=L.currentTarget,r=L.detail.value,o=V?V.house.effective:a1(C);if(M.value=o??void 0,r!==o||r==="vacation"){this.busy=!0;try{await X1(this,this.hass,C,V,r)}finally{this.busy=!1}}let i=this.snapshot??C,d=this.zone(i);M.value=(d?d.house.effective:a1(i))??void 0,this.requestUpdate()}planned(C,V,L){let M=V?.vacation;if(!M||M.active)return a;let r=g(this.hass,n(this.hass),C);return c1(N1(M,r,this.t),this.t("house.cancel_planned"),async()=>{this.busy=!0;try{await Y1(this,this.hass,L)}finally{this.busy=!1}},this.busy)}render(){let C=this.snapshot;if(!this.args||!this.hass||!C)return a;let V=this.zone(C);if(V===void 0)return a;let L=this.t,M=V?V.house.effective:a1(C),r=V?V.house:K(C),o=V?V.name:L("house.title"),i=J1.map(v=>({value:v,label:L(`house.${v}`),path:u1[v]})),d=M?Q1[M]:"var(--state-inactive-color, #9e9e9e)";return t`
      <ha-dialog
        .open=${this.open}
        header-title=${o}
        header-subtitle=${L("app.title")}
        header-subtitle-position="above"
        @closed=${this.onClosed}
      >
        <p class="state">${L(M?`house.${M}`:"house.mixed")}</p>
        <p class="detail">${this.detail(C,r,M)}</p>
        <div class="controls">
          <ha-control-select
            vertical
            .options=${i}
            .value=${M??void 0}
            .label=${o}
            .disabled=${this.busy}
            style="--control-select-color:${d};--modes-count:${i.length}"
            @value-changed=${v=>this.selected(C,V,v)}
          ></ha-control-select>
        </div>
        ${this.planned(C,r,V)}
      </ha-dialog>
    `}};s("hs-house-dialog",c2);var Z2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},zone:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.zone=null,this.busy=!1}static{this.styles=[c,m`
      :host {
        display: block;
      }
      ha-card {
        height: 100%;
      }
      ha-tile-icon {
        --tile-icon-color: var(--tile-color);
      }
      .features {
        display: grid;
        gap: var(--ha-card-feature-gap, 12px);
      }
      ha-control-select {
        --control-select-color: var(--tile-color);
        --control-select-padding: 0;
        --control-select-thickness: var(--feature-height, 42px);
        --control-select-border-radius: var(--ha-border-radius-lg, 12px);
        --control-select-button-border-radius: var(--ha-border-radius-lg, 12px);
      }
    `]}get t(){return p(n(this.hass))}get effective(){return this.zone?this.zone.house.effective:a1(this.snapshot)}get house(){return this.zone?this.zone.house:K(this.snapshot)}async run(H){this.busy=!0;try{await H()}finally{this.busy=!1}}async selected(H){let C=H.currentTarget,V=H.detail.value;C.value=this.effective??void 0,(V!==this.effective||V==="vacation")&&await this.run(()=>X1(this,this.hass,this.snapshot,this.zone,V)),C.value=this.effective??void 0,this.requestUpdate()}openDialog(){w(this,"hs-house-dialog",{zoneId:this.zone?.id??null,snapshot:this.snapshot})}status(){let H=this.t,C=this.house,V=g(this.hass,n(this.hass),this.snapshot);if(!C)return this.snapshot.zones.map(L=>`${L.name}: ${H(`house.${L.house.effective}`)}`).join(" \xB7 ");if(C.effective==="vacation"){let L=C.vacation?.end;return L?H("house.banner.vacation",{until:b(L,V)}):H("house.banner.vacation_open")}return C.effective==="away"?H(this.zone?"house.banner.away_zone":"house.banner.away"):C.effective==="off"?H(this.zone?"house.banner.off_zone":"house.banner.off"):H("house.auto")}render(){if(!this.snapshot||!this.hass)return a;let H=this.t,C=this.effective,V=J1.map(r=>({value:r,label:H(`house.${r}`),path:u1[r]})),L=C?Q1[C]:"var(--state-inactive-color, #9e9e9e)",M=this.zone?this.zone.name:H("house.title");return t`
      <ha-card style="--tile-color:${L}">
        <ha-tile-container .interactive=${!0} .actionHandlerOptions=${{}} @action=${this.openDialog}>
          <ha-tile-icon slot="icon" .iconPath=${C?u1[C]:v3}></ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${M}</span>
            <span slot="secondary">${this.status()}</span>
          </ha-tile-info>
          <div slot="features" class="features">
            <ha-control-select
              .options=${V}
              .value=${C??void 0}
              .label=${M}
              .disabled=${this.busy}
              @value-changed=${this.selected}
            ></ha-control-select>
          </div>
        </ha-tile-container>
      </ha-card>
    `}};s("hs-house-card",Z2);var h2=class extends l{constructor(){super();this.shown=[];this.zone=null,this.busy=!1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},zone:{attribute:!1},busy:{state:!0}}}static{this.styles=[C2,m`
      :host {
        display: grid;
        gap: var(--ha-space-2, 8px);
      }
      :host([hidden]) {
        display: none;
      }
    `]}get t(){return p(n(this.hass))}async run(C){this.busy=!0;try{await C()}finally{this.busy=!1}}hints(C,V){let L=this.t,M=g(this.hass,n(this.hass),this.snapshot),r=[],o=C.effective;if(o!=="auto"){let d=C.vacation?.end,v=d?b(d,M):"",A=V?.name??"",u;o==="vacation"?u=V?L(d?"hints.vacation_zone":"hints.vacation_open_zone",{zone:A,until:v}):L(d?"hints.vacation":"hints.vacation_open",{until:v}):o==="off"?u=V?L("hints.off_zone",{zone:A}):L("hints.off"):u=V?L("hints.away_zone",{zone:A}):L("hints.away"),r.push(c1(u,L(o==="off"?"house.heating_on":"house.home_again"),()=>this.run(()=>i1(this,this.hass,"house_mode/set",{mode:"auto",zone_id:V?.id})),this.busy))}let i=C.vacation;if(i&&!i.active){let d=b(i.start,M),v=V?i.end?L("hints.planned_zone",{zone:V.name,from:d,to:b(i.end,M)}):L("hints.planned_open_zone",{zone:V.name,from:d}):N1(i,M,L);r.push(c1(v,L("house.cancel_planned"),()=>this.run(()=>Y1(this,this.hass,V)),this.busy))}return r}willUpdate(C){let V=this.snapshot;if(!V||!this.hass)this.shown=[];else if(this.zone)this.shown=this.hints(this.zone.house,V.zones.length>1?this.zone:null);else{let L=K(V);this.shown=L?this.hints(L,null):V.zones.flatMap(M=>this.hints(M.house,M))}this.hidden=this.shown.length===0}render(){return this.shown.length?t`${this.shown}`:a}};s("hs-house-hints",h2);var S2=class extends y{static{this.styles=m`
    ha-alert {
      display: block;
      margin-bottom: var(--ha-space-3, 12px);
    }
    ha-alert ha-button::part(base) {
      /* The alert makes its action as narrow as the longest word, and HA lets button labels wrap. */
      white-space: nowrap;
    }
    .since {
      display: block;
      color: var(--secondary-text-color);
    }
    p {
      margin: var(--ha-space-2, 8px) 0 0;
      color: var(--secondary-text-color);
    }
  `}async retry(){let H=p(n(this.hass));try{await x(this.hass).call("reconcile"),this.closeDialog()}catch(C){h(this,Z(C,H))}}valveName(H){let C=this.hass.states[H]?.attributes.friendly_name;return typeof C=="string"?C:H}render(){let H=this.args?.room;if(!H||!this.hass)return a;let C=n(this.hass),V=p(C),L=g(this.hass,C);return t`
      <ha-dialog
        .open=${this.open}
        header-title=${V("health.title",{room:H.name})}
        @closed=${this.onClosed}
      >
        ${H.issues.map(M=>t`<ha-alert alert-type="warning">
            ${V(`health.${M.kind}`,{name:this.valveName(M.entity_id)})}
            ${M.since?t`<span class="since">${V("health.since",{time:b(M.since,L)})}</span>`:a}
            <ha-button
              slot="action"
              appearance="plain"
              size="small"
              @click=${()=>t1(this,"hass-more-info",{entityId:M.entity_id})}
            >
              ${V("health.valve")}
            </ha-button>
          </ha-alert>`)}
        <p>${V("health.details")}</p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.closeDialog()}>
            ${V("common.close")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${this.retry}>${V("health.retry")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-problem-dialog",S2);function y3(e,H){w(e,"hs-problem-dialog",{room:H})}var f2=.5,w3=5,k3=30,c0=1e3,Z0={minimumFractionDigits:1,maximumFractionDigits:1},g2=class extends l{constructor(){super();this.timer=null;this.sending=!1;this.sentAt=0;this.pendingRoom=null;this.pending=null,this.compact=!1}static{this.properties={hass:{attribute:!1},room:{attribute:!1},snapshot:{attribute:!1},compact:{type:Boolean,reflect:!0},pending:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: block;
      }
      ha-card {
        height: 100%;
      }
      ha-tile-icon {
        --tile-icon-color: var(--tile-color);
      }
      .problem {
        color: var(--warning-color);
      }
      ha-tile-badge {
        position: absolute;
        top: 3px;
        right: 3px;
        inset-inline-end: 3px;
        inset-inline-start: initial;
        --tile-badge-background-color: var(--orange-color, #ff9800);
      }
      .features {
        --feature-height: 42px;
        --feature-border-radius: var(--ha-card-features-border-radius, var(--ha-border-radius-lg, 12px));
        --feature-button-spacing: 12px;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: var(--ha-card-feature-gap, 12px);
      }
      ha-control-button-group {
        --control-button-group-spacing: var(--feature-button-spacing);
        --control-button-group-thickness: var(--feature-height);
      }
      ha-control-number-buttons {
        --control-number-buttons-border-radius: var(--feature-border-radius);
        --control-number-buttons-focus-color: var(--tile-color);
      }
      ha-control-button {
        --control-button-border-radius: var(--feature-border-radius);
        --control-button-focus-color: var(--tile-color);
        --control-button-padding: 0 12px;
        --mdc-icon-size: 20px;
      }
      ha-control-button span {
        margin-inline-start: 8px;
      }
      .inline {
        --feature-height: 36px;
      }
    `]}disconnectedCallback(){super.disconnectedCallback(),this.timer&&(clearTimeout(this.timer),this.timer=null,this.send())}willUpdate(C){C.has("room")&&this.pendingRoom!==null&&this.room.id!==this.pendingRoom&&(this.timer&&(clearTimeout(this.timer),this.timer=null,this.send()),this.pending=null),C.has("room")&&this.pending!==null&&!this.timer&&!this.sending&&(this.room.target?.temperature===this.pending||Date.now()-this.sentAt>4e3)&&(this.pending=null)}get t(){return p(n(this.hass))}changed(C){let V=Math.min(k3,Math.max(w3,Math.round(C.detail.value/f2)*f2));this.pending===null&&(this.pendingRoom=this.room.id),this.pending=V,this.timer&&clearTimeout(this.timer),this.timer=setTimeout(()=>{this.timer=null,this.send()},c0)}async send(){let C=this.pending,V=this.pendingRoom??this.room.id;if(C!==null){this.sending=!0;try{await x(this.hass).call("override/set",{room_id:V,temperature:C}),this.sentAt=Date.now()}catch(L){this.pending=null,h(this,Z(L,this.t))}finally{this.sending=!1}}}async backToPlan(){this.timer&&(clearTimeout(this.timer),this.timer=null),this.pending=null;try{await x(this.hass).call("override/clear",{room_id:this.room.id})}catch(C){h(this,Z(C,this.t))}}showProblems(){y3(this,this.room)}status(){let C=this.room,V=C.target,L=this.t,M=g(this.hass,n(this.hass),this.snapshot),r=[],o=s3(C,this.hass);o!==null&&r.push(k(o,M));let i=C.issues[0];if(i)r.push(L(`room.issue.${i.kind}`));else if(C.trvs.length===0)r.push(L("room.no_trvs"));else if(this.pending!==null)r.push(Q("manual",L));else if(this.compact){let d=V?.source==="manual";r.push(Q(d?"manual":V?.mode??"off",L))}else if(V?.source==="plan"){let d=new Date,v=Q(V.mode,L);r.push(V.valid_until?`${v} ${L("room.until",{until:x1(V.valid_until,d,M)})}`:v);let A=V.next;if(V.valid_until&&A){let u=A.temperature===null?Q(A.mode,L):`${Q(A.mode,L)} ${k(A.temperature,M)}`;r[r.length-1]+=` \u2192 ${u}`}}else if(V){let d=this.snapshot.zones.length>1?o1(this.snapshot,C).name:void 0;r.push(p3(V,new Date,M,L,d))}return r.join(" \xB7 ")}control(C){let V=this.t,L=this.room.target;if(this.pending===null&&L&&L.temperature===null)return t`<ha-control-button-group>
        <ha-control-button disabled .label=${V("room.off")}>${V("room.off")}</ha-control-button>
      </ha-control-button-group>`;let M=x3(this.room,this.snapshot).comfort??21;return t`<ha-control-button-group>
      <ha-control-number-buttons
        .value=${this.pending??L?.temperature??M}
        .min=${w3}
        .max=${k3}
        .step=${f2}
        .unit=${"\xB0C"}
        .formatOptions=${Z0}
        .locale=${this.hass.locale}
        .label=${V("room.set_to")}
        .disabled=${!C}
        @value-changed=${this.changed}
      ></ha-control-number-buttons>
    </ha-control-button-group>`}render(){let C=this.room;if(!C||!this.snapshot||!this.hass)return a;let V=this.t,L=C.target,M=o1(this.snapshot,C).house.effective==="auto"&&L!==null&&L.source!=="boost",r=this.pending!==null||L?.source==="manual",o=r?"manual":L?.mode??"off",i=C.issues.length>0,d=this.control(M);return t`
      <ha-card style="--tile-color:${P[o]}">
        <ha-tile-container .featurePosition=${this.compact?"inline":"bottom"}>
          <ha-tile-icon
            slot="icon"
            .iconPath=${B[o]}
            .interactive=${i}
            @action=${this.showProblems}
            title=${i?V("room.problem"):Q(o,V)}
          >
            ${i?t`<ha-tile-badge><ha-svg-icon .path=${P5}></ha-svg-icon></ha-tile-badge>`:a}
          </ha-tile-icon>
          <ha-tile-info slot="info">
            <span slot="primary">${C.name}</span>
            <span slot="secondary" class=${C.issues.length?"problem":""}>${this.status()}</span>
          </ha-tile-info>
          ${this.compact?t`<div slot="features-inline" class="features inline">${d}</div>`:a}
          ${!this.compact||r&&M?t`<div slot="features" class="features">
                ${this.compact?a:d}
                ${r&&M?t`<ha-control-button-group>
                      <ha-control-button .label=${V("room.back_to_plan")} @click=${this.backToPlan}>
                        <ha-svg-icon .path=${O5}></ha-svg-icon>
                        <span>${V("room.back_to_plan")}</span>
                      </ha-control-button>
                    </ha-control-button-group>`:a}
              </div>`:a}
        </ha-tile-container>
      </ha-card>
    `}};s("hs-room-card",g2);var O2="all",b2="house:all",y2=class extends l{constructor(){super();this.unsubscribe=null;this.snapshot=null}static{this.properties={hass:{attribute:!1},config:{state:!0},snapshot:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: block;
      }
      .stack {
        display: grid;
        /* minmax(0, …): the compact tiles must not make the card wider than the dashboard column. */
        grid-template-columns: minmax(0, 1fr);
        gap: var(--ha-space-2, 8px);
      }
      hs-house-hints[hidden] {
        display: none;
      }
      .status {
        padding: var(--ha-space-4, 16px);
        color: var(--secondary-text-color);
      }
    `]}setConfig(C){if(!C||typeof C!="object")throw new Error("Invalid configuration");if(C.room!==void 0&&typeof C.room!="string")throw new Error("room must be a room id");this.config={...C}}getCardSize(){let C=this.config?.show_rooms===!1?0:this.config?.room?1:this.snapshot?.rooms.length??2;return(this.showHouse?this.config?.zone?3:6:0)+C*(this.config?.compact?3:5)}get showHouse(){return!!this.config?.show_house||this.config?.show_rooms===!1}connectedCallback(){super.connectedCallback(),this.hass&&!this.unsubscribe&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}willUpdate(C){C.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe()}subscribe(){this.unsubscribe=x(this.hass).subscribe(C=>this.snapshot=C)}render(){if(!this.hass||!this.config)return a;let C=p(n(this.hass)),V=this.snapshot;if(!V)return t`<ha-card class="status">${C("common.loading")}</ha-card>`;let L=V.zones.find(r=>r.id===this.config.zone)??null,M=this.config.show_rooms===!1?[]:this.config.room?V.rooms.filter(r=>r.id===this.config.room):L?H1(V,L):V.rooms;return t`
      <div class="stack">
        ${this.showHouse?t`<hs-house-hints .hass=${this.hass} .snapshot=${V} .zone=${L}></hs-house-hints>
              <hs-house-card .hass=${this.hass} .snapshot=${V} .zone=${L}></hs-house-card>
              ${L?a:t`<hs-boost-card .hass=${this.hass} .snapshot=${V}></hs-boost-card>`}`:a}
        ${v1(M,r=>r.id,r=>t`<hs-room-card
              .hass=${this.hass}
              .room=${r}
              .snapshot=${V}
              ?compact=${this.config.compact??!1}
            ></hs-room-card>`)}
      </div>
    `}},w2=class extends l{constructor(){super();this.unsubscribe=null;this.label=C=>this.t(`card.${C.name}`);this.snapshot=null}static{this.properties={hass:{attribute:!1},config:{state:!0},snapshot:{state:!0}}}setConfig(C){this.config={...C}}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null}willUpdate(C){C.has("hass")&&this.hass&&!this.unsubscribe&&(this.unsubscribe=x(this.hass).subscribe(V=>this.snapshot=V))}get t(){return p(n(this.hass))}schema(){let C=this.snapshot?.rooms??[],V=this.snapshot?.zones??[];return[...V.length>1?[{name:"zone",selector:{select:{mode:"dropdown",options:[{value:b2,label:this.t("card.whole_house")},...V.map(M=>({value:M.id,label:M.name}))]}}}]:[],{name:"room",selector:{select:{mode:"dropdown",options:[{value:O2,label:this.t("card.all_rooms")},...C.map(M=>({value:M.id,label:M.name}))]}}},{name:"show_house",selector:{boolean:{}}},{name:"show_rooms",selector:{boolean:{}}},{name:"compact",selector:{boolean:{}}}]}changed(C){let V=C.detail.value,L={...this.config,room:V.room===O2?void 0:V.room,zone:V.zone===b2?void 0:V.zone,show_house:V.show_house?!0:void 0,show_rooms:V.show_rooms===!1?!1:void 0,compact:V.compact?!0:void 0};for(let M of Object.keys(L))(L[M]===void 0||L[M]==="")&&delete L[M];this.config=L,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:L},bubbles:!0,composed:!0}))}render(){if(!this.hass||!this.config)return a;let C={room:this.config.room??O2,zone:this.config.zone??b2,show_house:this.config.show_house??!1,show_rooms:this.config.show_rooms??!0,compact:this.config.compact??!1};return t`<ha-form
      .hass=${this.hass}
      .data=${C}
      .schema=${this.schema()}
      .computeLabel=${this.label}
      @value-changed=${this.changed}
    ></ha-form>`}};s("hs-card",y2);s("hs-card-editor",w2);var h0="heating-scheduler",P3={dial:{path:"M4.22 21.19A11 11 0 0 1 19.78 5.63L17.83 7.58A8.25 8.25 0 0 0 6.17 19.24A1.38 1.38 0 0 1 4.22 21.19ZM17.56 7.89A2.32 2.32 0 1 1 22.2 7.89A2.32 2.32 0 1 1 17.56 7.89ZM18.42 7.89A1.46 1.46 0 1 0 21.35 7.89A1.46 1.46 0 1 0 18.42 7.89ZM14.81 13.54C14.7 13.39 14.56 13.27 14.43 13.14C14.1 12.84 13.72 12.63 13.41 12.32C12.67 11.6 12.51 10.4 12.98 9.49C12.51 9.6 12.1 9.86 11.75 10.14C10.47 11.17 9.96 12.98 10.57 14.54C10.59 14.59 10.61 14.64 10.61 14.7C10.61 14.81 10.53 14.91 10.43 14.95C10.32 15 10.2 14.97 10.11 14.89C10.08 14.87 10.06 14.84 10.04 14.81C9.48 14.1 9.39 13.09 9.77 12.28C8.94 12.95 8.49 14.09 8.56 15.16C8.59 15.41 8.62 15.65 8.7 15.9C8.77 16.2 8.9 16.49 9.05 16.75C9.58 17.61 10.51 18.22 11.5 18.35C12.56 18.48 13.69 18.29 14.5 17.55C15.4 16.73 15.72 15.42 15.26 14.29L15.19 14.16C15.09 13.94 14.81 13.54 14.81 13.54M13.25 16.66C13.11 16.77 12.88 16.9 12.71 16.95C12.15 17.15 11.6 16.87 11.27 16.55C11.86 16.41 12.21 15.97 12.32 15.53C12.4 15.14 12.24 14.81 12.18 14.43C12.12 14.07 12.13 13.75 12.26 13.41C12.36 13.6 12.45 13.79 12.57 13.94C12.95 14.43 13.55 14.65 13.68 15.32C13.7 15.39 13.71 15.46 13.71 15.53C13.72 15.94 13.55 16.38 13.25 16.66H13.25Z",secondaryPath:"M21.97 8.76A11 11 0 0 1 19.78 21.19A1.38 1.38 0 0 1 17.83 19.24A8.25 8.25 0 0 0 19.48 9.92L21.97 8.76Z"}};function T3(){window.customIcons??={},window.customIcons[h0]??={getIcon:async e=>P3[e]??{path:""},getIconList:async()=>Object.keys(P3).map(e=>({name:e}))}}T3();var S0="heating-scheduler",f0="heating-scheduler-panel.js",g0={cs:{name:"Topen\xED",description:"M\xEDstnosti a re\u017Eim domu z pl\xE1nova\u010De topen\xED."},en:{name:"Heating",description:"Rooms and house mode of the heating scheduler."}};function O0(e){let H=document.querySelector("home-assistant");return(e??H?.hass)?.panels?.[S0]?.config?._panel_custom?.module_url??new URL(f0,import.meta.url).href}var H2=null;function B3(e){return H2??=import(O0(e)).then(()=>customElements.whenDefined("hs-card")),H2.catch(()=>H2=null),H2}var k2=class extends HTMLElement{constructor(){super(...arguments);this.creating=!1}setConfig(C){if(!C||typeof C!="object")throw new Error("Invalid configuration");if(C.room!==void 0&&typeof C.room!="string")throw new Error("room must be a room id");if(C.zone!==void 0&&typeof C.zone!="string")throw new Error("zone must be a zone id");this.config=C,this.inner?.setConfig(C)}set hass(C){this.hassValue=C,this.inner?this.inner.hass=C:this.create()}get hass(){return this.hassValue}async create(){if(this.creating)return;this.creating=!0;let C=this.shadowRoot??this.attachShadow({mode:"open"});try{await B3(this.hassValue)}catch(L){C.textContent=`Heating Scheduler: ${String(L)}`,this.creating=!1;return}let V=document.createElement("hs-card");this.config&&V.setConfig(this.config),V.hass=this.hassValue,this.inner=V,C.replaceChildren(V)}connectedCallback(){this.style.display="block"}getCardSize(){return this.inner?.getCardSize?this.inner.getCardSize():this.config?.room||this.config?.show_rooms===!1?3:6}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}static async getConfigElement(){return await B3(),document.createElement("hs-card-editor")}static getStubConfig(){return{show_house:!0}}};s("heating-scheduler-card",k2);var b0=g0[(document.documentElement.lang||navigator.language).startsWith("en")?"en":"cs"];window.customCards=window.customCards??[];window.customCards.some(e=>e.type==="heating-scheduler-card")||window.customCards.push({type:"heating-scheduler-card",...b0,preview:!0});var y0={idle:"var(--success-color, #43a047)",writing:"var(--info-color, #039be5)",waiting:"var(--disabled-color, #bdbdbd)",failed:"var(--error-color, #db4437)"};function _3(e){return e.available?e.phase:"waiting"}var P2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }
      .top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-4, 16px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      p {
        margin: 0;
      }
      .card-content {
        padding: 0 var(--ha-space-4, 16px) var(--ha-space-4, 16px);
      }
      .phase {
        display: inline-flex;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      ha-alert {
        display: block;
        margin: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
      }
    `]}get t(){return p(n(this.hass))}async check(){this.busy=!0;try{await x(this.hass).call("reconcile")}catch(H){h(this,Z(H,this.t))}finally{this.busy=!1}}render(){if(!this.snapshot||!this.hass)return a;let H=this.t,C=g(this.hass,n(this.hass),this.snapshot),V=this.snapshot.rooms.every(r=>r.issues.length===0&&r.trv_status.every(o=>o.available)),L=r=>r?this.hass.localize?.(`component.climate.entity_component._.state.${r}`)||r:"\u2014",M=r=>{let o=this.hass.states[r]?.attributes.friendly_name;return typeof o=="string"?o:r};return t`
      <div class="top">
        <ha-button .disabled=${this.busy} .loading=${this.busy} @click=${this.check}>
          <ha-svg-icon slot="start" .path=${$1}></ha-svg-icon>${H("adv.health.check_now")}
        </ha-button>
        ${V?t`<span class="muted">${H("adv.health.all_ok")}</span>`:a}
      </div>
      ${this.snapshot.rooms.map(r=>t`<ha-card .header=${r.name}>
          ${r.trv_status.length===0?t`<div class="card-content muted">${H("adv.rooms.none_trvs")}</div>`:a}
          ${r.trv_status.map(o=>t`<ha-md-list-item
                type="button"
                @click=${()=>this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:o.entity_id},bubbles:!0,composed:!0}))}
              >
                <span slot="headline">${M(o.entity_id)}</span>
                <span slot="supporting-text">
                  ${H("adv.health.wanted")} ${k(o.desired,C)} · ${H("adv.health.valve")}
                  ${k(o.setpoint,C)} · ${H("adv.health.mode")} ${o.available?L(o.hvac_mode):"\u2014"}
                </span>
                <span slot="supporting-text">
                  ${H("adv.health.last_write")}: ${o.last_write?b(o.last_write,C):"\u2014"}
                </span>
                <span slot="end" class="phase">
                  <span class="dot" style="background:${y0[_3(o)]}"></span>
                  ${H(`adv.health.phase.${_3(o)}`)}
                </span>
              </ha-md-list-item>
              ${r.issues.filter(i=>i.entity_id===o.entity_id).map(i=>t`<ha-alert alert-type="warning">${H(`health.${i.kind}`,{name:M(o.entity_id)})}</ha-alert>`)}
              ${o.last_error?t`<ha-alert alert-type="error">${H("adv.health.error")}: ${o.last_error}</ha-alert>`:a}`)}
        </ha-card>`)}
    `}};s("hs-adv-health",P2);var T2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},roomId:{state:!0},entries:{state:!0},loading:{state:!0}}}constructor(){super(),this.roomId="",this.entries=[],this.loading=!1}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }
      .top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2, 8px);
      }
      ha-select {
        min-width: 200px;
      }
      .muted {
        color: var(--secondary-text-color);
      }
      p {
        margin: 0;
      }
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        display: grid;
        grid-template-columns: minmax(120px, auto) 1fr;
        gap: 0 var(--ha-space-4, 16px);
        padding: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
        border-top: 1px solid var(--divider-color);
      }
      li:first-child {
        border-top: none;
      }
      .what {
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .detail {
        grid-column: 2;
        font-size: var(--ha-font-size-s, 12px);
      }
      @media (max-width: 480px) {
        li {
          grid-template-columns: 1fr;
        }
        .detail {
          grid-column: 1;
        }
      }
    `]}get t(){return p(n(this.hass))}connectedCallback(){super.connectedCallback(),!this.roomId&&this.snapshot?.rooms.length&&(this.roomId=this.snapshot.rooms[0].id,this.load())}async load(){if(this.roomId){this.loading=!0;try{let H=await x(this.hass).call("log",{room_id:this.roomId});this.entries=H.entries}catch(H){h(this,Z(H,this.t))}finally{this.loading=!1}}}label(H){let C=`log.${H}`;return U1.includes(C)?this.t(C):H}render(){if(!this.snapshot||!this.hass)return a;let H=this.t,C=g(this.hass,n(this.hass),this.snapshot),V=L=>{if(!L)return"";let M=this.hass.states[L]?.attributes.friendly_name;return typeof M=="string"?M:L};return t`
      <div class="top">
        <ha-select
          .label=${H("adv.log.room")}
          .options=${this.snapshot.rooms.map(L=>({value:L.id,label:L.name}))}
          .value=${this.roomId}
          @selected=${L=>{!L.detail.value||L.detail.value===this.roomId||(this.roomId=L.detail.value,this.load())}}
        ></ha-select>
        <ha-button appearance="plain" .disabled=${this.loading} @click=${this.load}>
          <ha-svg-icon slot="start" .path=${$1}></ha-svg-icon>${H("adv.log.refresh")}
        </ha-button>
      </div>
      ${this.entries.length===0?t`<p class="muted">${H("adv.log.empty")}</p>`:t`<ha-card><ol>
            ${this.entries.map(L=>t`<li>
                <span class="muted">${b(L.at,C)}</span>
                <span>
                  <span class="what">${this.label(L.kind)}</span>
                  ${L.value!==null?t` · ${k(L.value,C)}`:a}
                  ${L.hvac_mode?t` · ${L.hvac_mode}`:a}
                  ${L.entity_id?t` · ${V(L.entity_id)}`:a}
                </span>
                ${L.mode||L.detail?t`<span class="detail muted">
                      ${L.mode?H(`mode.${L.mode}`):""}${L.mode&&L.detail?" \xB7 ":""}${L.detail??""}
                    </span>`:a}
              </li>`)}
          </ol></ha-card>`}
    `}};s("hs-adv-log",T2);function N(e,H={}){let C={...e,...H};return{id:C.id,name:C.name,trvs:C.trvs,plan_id:C.plan_id,temp_set_id:C.temp_set_id,temperature_entity:C.temperature_entity,area_id:C.area_id,zone_id:C.zone_id}}function V1(e,H){let C=new Set(H.map(V=>V.trim().toLowerCase()));if(!C.has(e.trim().toLowerCase()))return e;for(let V=2;;V+=1){let L=`${e} ${V}`;if(!C.has(L.toLowerCase()))return L}}var w0={name:"adv.rooms.name",trvs:"adv.rooms.trvs",temperature_entity:"adv.rooms.temperature_entity",plan_id:"adv.rooms.plan",temp_set_id:"adv.rooms.temp_set",zone_id:"adv.rooms.zone"},B2=class extends y{constructor(){super(...arguments);this.unsubscribe=null;this.label=C=>this.t(w0[C.name]);this.helper=C=>{let V=this.t;if(C.name==="temperature_entity")return`${V("adv.rooms.sensor_empty")} ${V("adv.rooms.sensor_hint")}`;if(C.name==="trvs"&&this.args?.candidates.climates.length===0)return V("adv.rooms.no_climates")}}static{this.properties={snapshot:{state:!0},room:{state:!0},data:{state:!0},error:{state:!0},saving:{state:!0}}}static{this.styles=m`
    ha-alert {
      display: block;
      margin-top: var(--ha-space-4, 16px);
    }
  `}dialogOpened(C){this.snapshot=C.snapshot,this.room=C.room,this.prepare(),this.unsubscribe?.(),this.unsubscribe=x(this.hass).subscribe(V=>{V&&(this.snapshot=V)})}dialogClosed(){this.unsubscribe?.(),this.unsubscribe=null}prepare(){let C=this.room;this.data={name:C?.name??"",trvs:[...C?.trvs??[]],temperature_entity:C?.temperature_entity??void 0,plan_id:C?.plan_id??"house",temp_set_id:C?.temp_set_id??"house",zone_id:C?.zone_id??this.snapshot.zones[0]?.id??"house"},this.error="",this.saving=!1}get t(){return p(n(this.hass))}changedElsewhere(){if(!this.room)return null;let C=this.snapshot.rooms.find(M=>M.id===this.room.id);return C?["name","trvs","plan_id","temp_set_id","temperature_entity","area_id","zone_id"].every(M=>JSON.stringify(C[M])===JSON.stringify(this.room[M]))?null:C:null}async save(){let C=this.t,V=this.changedElsewhere();if(V){if(!await G(this,C)){this.room=V,this.prepare();return}this.room=V}this.saving=!0,this.error="";let L=this.room??{id:"",name:"",trvs:[],plan_id:"house",temp_set_id:"house",temperature_entity:null,area_id:null,zone_id:this.data.zone_id,current_temperature:null,target:null,override:null,issues:[],trv_status:[]},M=N(L,{name:this.data.name.trim(),trvs:this.data.trvs,temperature_entity:this.data.temperature_entity||null,plan_id:this.data.plan_id,temp_set_id:this.data.temp_set_id,zone_id:this.data.zone_id});try{await x(this.hass).call("room/save",{revision:this.snapshot.revision,room:{...M,id:this.room?M.id:null}}),this.closeDialog()}catch(r){this.error=Z(r,C)}finally{this.saving=!1}}schema(C){let V=C.climates.filter(r=>!r.room_id||r.room_id===this.room?.id).map(r=>r.entity_id),L=[...C.temperature_entities.map(r=>r.entity_id),...C.climates.map(r=>r.entity_id)],M=this.snapshot.zones.length>1?[{name:"zone_id",required:!0,selector:{select:{mode:"dropdown",options:this.snapshot.zones.map(r=>({value:r.id,label:r.name}))}}}]:[];return[{name:"name",required:!0,selector:{text:{}}},...M,{name:"trvs",selector:{entity:{multiple:!0,include_entities:V}}},{name:"temperature_entity",selector:{entity:{include_entities:L}}},{name:"plan_id",required:!0,selector:{select:{mode:"dropdown",options:this.snapshot.plans.map(r=>({value:r.id,label:r.name}))}}},{name:"temp_set_id",required:!0,selector:{select:{mode:"dropdown",options:this.snapshot.temp_sets.map(r=>({value:r.id,label:r.name}))}}}]}render(){if(!this.args||!this.hass||!this.snapshot)return a;let C=this.t;return t`
      <ha-dialog
        .open=${this.open}
        header-title=${this.room?C("adv.rooms.edit_title"):C("adv.rooms.new_title")}
        @closed=${this.onClosed}
      >
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${this.schema(this.args.candidates)}
          .computeLabel=${this.label}
          .computeHelper=${this.helper}
          @value-changed=${V=>this.data={...this.data,...V.detail.value}}
        ></ha-form>
        ${this.error?t`<ha-alert alert-type="error">${this.error}</ha-alert>`:a}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.closeDialog()}>
            ${C("common.cancel")}
          </ha-button>
          <ha-button
            slot="primaryAction"
            .disabled=${this.saving||!this.data.name.trim()}
            .loading=${this.saving}
            @click=${this.save}
          >
            ${C("common.save")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-room-dialog",B2);function D3(e,H,C,V){w(e,"hs-room-dialog",{snapshot:H,candidates:C,room:V})}var _2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},candidates:{state:!0},busy:{state:!0}}}constructor(){super(),this.candidates=null,this.busy=!1}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2, 8px);
      }
      ha-card {
        overflow: hidden;
      }
      .empty {
        margin: 0;
        padding: var(--ha-space-4, 16px);
        color: var(--secondary-text-color);
      }
      /* A zone's heading, as HA's floor headings on its Areas page. */
      h2 {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        margin: var(--ha-space-2, 8px) 0;
        padding-inline-start: var(--ha-space-2, 8px);
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m, 14px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
    `]}get t(){return p(n(this.hass))}async loadCandidates(){try{return this.candidates=await x(this.hass).call("candidates"),this.candidates}catch(H){return h(this,Z(H,this.t)),null}}async edit(H){let C=await this.loadCandidates();C&&D3(this,this.snapshot,C,H)}group(H){let C=this.snapshot;return C.zones.length>1?H1(C,o1(C,H)):C.rooms}async move(H,C){let V=M=>M.map(r=>r.id),L=S3(V(this.snapshot.rooms),V(this.group(H)),H.id,C);L&&await this.call("rooms/reorder",{revision:this.snapshot.revision,order:L})}async deleteRoom(H){let C=this.t;await f(this,{heading:C("common.delete"),message:C("adv.rooms.delete_confirm",{name:H.name}),confirm:C("common.delete"),cancel:C("common.cancel"),danger:!0})&&await this.call("room/delete",{revision:this.snapshot.revision,room_id:H.id})}async call(H,C){this.busy=!0;try{await x(this.hass).call(H,C)}catch(V){h(this,Z(V,this.t))}finally{this.busy=!1}}async openImport(){if(!await this.loadCandidates())return;let C=this.freeAreas(),V=await new Promise(L=>w(this,"hs-import-rooms-dialog",{areas:C,resolve:L}));V.length&&await this.runImport(new Set(V))}freeAreas(){let H=new Set(this.snapshot.rooms.flatMap(C=>C.trvs));return(this.candidates?.areas??[]).map(C=>({...C,climates:C.climates.filter(V=>!H.has(V))})).filter(C=>C.climates.length>0)}async runImport(H){let C=x(this.hass),V=this.snapshot.revision,L=this.snapshot.rooms.map(r=>r.name),M=new Set(this.snapshot.rooms.flatMap(r=>r.trvs));this.busy=!0;try{for(let r of this.freeAreas()){if(!H.has(r.area_id))continue;let o=V1(r.name,L);L.push(o);let i=r.climates.filter(A=>!M.has(A)),d=N({id:"",name:o,trvs:i,plan_id:"house",temp_set_id:"house",temperature_entity:r.temperature_entity,area_id:r.area_id},{});V=(await C.call("room/save",{revision:V,room:{...d,id:null}})).revision}}catch(r){h(this,Z(r,this.t))}finally{this.busy=!1}}menu(H,C){C==="up"?this.move(H,-1):C==="down"?this.move(H,1):C==="edit"?this.edit(H):C==="delete"&&this.deleteRoom(H)}valveNames(H){return H.trvs.length?H.trvs.map(C=>{let V=this.hass.states[C]?.attributes.friendly_name;return typeof V=="string"?V:C}).join(", "):this.t("adv.rooms.none_trvs")}row(H,C,V){let L=this.t,M=this.snapshot.plans.find(o=>o.id===H.plan_id)?.name??H.plan_id,r=this.snapshot.temp_sets.find(o=>o.id===H.temp_set_id)?.name??H.temp_set_id;return t`<ha-md-list-item type="button" @click=${()=>this.edit(H)}>
      <span slot="headline">${H.name}</span>
      <span slot="supporting-text">${L("adv.rooms.trvs")}: ${this.valveNames(H)}</span>
      <span slot="supporting-text">
        ${L("adv.rooms.plan")}: ${M} · ${L("adv.rooms.temp_set")}: ${r}
      </span>
      <ha-dropdown
        slot="end"
        @click=${o=>o.stopPropagation()}
        @wa-select=${o=>this.menu(H,o.detail.item.value)}
      >
        <ha-icon-button slot="trigger" .path=${F1} .label=${H.name}></ha-icon-button>
        <ha-dropdown-item value="edit">
          <ha-svg-icon slot="icon" .path=${M1}></ha-svg-icon>${L("common.edit")}
        </ha-dropdown-item>
        <ha-dropdown-item value="up" .disabled=${this.busy||C===0}>
          <ha-svg-icon slot="icon" .path=${R1}></ha-svg-icon>${L("adv.rooms.move_up")}
        </ha-dropdown-item>
        <ha-dropdown-item value="down" .disabled=${this.busy||C===V-1}>
          <ha-svg-icon slot="icon" .path=${_1}></ha-svg-icon>${L("adv.rooms.move_down")}
        </ha-dropdown-item>
        <ha-dropdown-item value="delete" variant="danger" .disabled=${this.busy}>
          <ha-svg-icon slot="icon" .path=${_}></ha-svg-icon>${L("common.delete")}
        </ha-dropdown-item>
      </ha-dropdown>
    </ha-md-list-item>`}list(H,C){return t`<ha-card>
      ${H.length?H.map((V,L)=>this.row(V,L,H.length)):t`<p class="empty">${C}</p>`}
    </ha-card>`}render(){if(!this.snapshot||!this.hass)return a;let H=this.t,C=this.snapshot;return t`
      <div class="actions">
        <ha-button .disabled=${this.busy} @click=${()=>this.edit(null)}>
          <ha-svg-icon slot="start" .path=${D}></ha-svg-icon>${H("adv.rooms.add")}
        </ha-button>
        <ha-button appearance="plain" .disabled=${this.busy} @click=${this.openImport}>
          <ha-svg-icon slot="start" .path=${D5}></ha-svg-icon>${H("adv.rooms.import")}
        </ha-button>
      </div>
      ${C.zones.length>1&&C.rooms.length?C.zones.map(V=>t`<section>
              <h2><ha-svg-icon .path=${e1}></ha-svg-icon>${V.name}</h2>
              ${this.list(H1(C,V),H("adv.zones.no_rooms"))}
            </section>`):this.list(C.rooms,H("adv.rooms.empty"))}
    `}};s("hs-adv-rooms",_2);var D2=class extends y{constructor(){super(...arguments);this.result=[]}static{this.properties={chosen:{state:!0}}}static{this.styles=m`
    p {
      margin-top: 0;
    }
  `}dialogOpened(C){this.chosen=C.areas.map(V=>V.area_id),this.result=[]}dialogClosed(){this.args?.resolve(this.result)}add(){this.result=this.chosen,this.closeDialog()}render(){if(!this.args)return a;let C=p(n(this.hass)),V=this.args.areas,L=[{name:"areas",selector:{select:{multiple:!0,mode:"list",options:V.map(M=>({value:M.area_id,label:`${M.name} (${M.climates.length})`}))}}}];return t`
      <ha-dialog .open=${this.open} header-title=${C("adv.rooms.import")} @closed=${this.onClosed}>
        ${V.length?t`<p>${C("adv.rooms.import_hint")}</p>
              <ha-form
                .hass=${this.hass}
                .data=${{areas:this.chosen}}
                .schema=${L}
                .computeLabel=${()=>""}
                @value-changed=${M=>this.chosen=M.detail.value.areas??[]}
              ></ha-form>`:t`<p>${C("adv.rooms.import_none")}</p>`}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.closeDialog()}>
            ${C("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${this.chosen.length===0} @click=${this.add}>
            ${C("adv.rooms.import_button")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-import-rooms-dialog",D2);var R2="hs-unsaved";function A1(e,H){e.dispatchEvent(new CustomEvent(R2,{detail:H,bubbles:!0,composed:!0}))}var k0=[1,2,3,4,6,8,12,24];function F2(e,H){return Object.keys(e).every(C=>e[C]===H[C])}var P0=[1,2,5,10,15,30,60],T0=[10,20,30,60,120,240],B0=[30,60,90,120,180,240],$2=class extends l{constructor(){super();this.revision=-1;this.base=null;this.reportedUnsaved=!1;this.busy=!1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},draft:{state:!0},busy:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: block;
      }
      ha-settings-row {
        border-top: 1px solid var(--divider-color);
      }
      ha-settings-row:first-child {
        border-top: none;
      }
      ha-select {
        min-width: 140px;
      }
      ha-card {
        container-type: inline-size;
      }
      /* HA gives a row's label and its control half the width each. In a narrow card the control
         goes under the label, as in HA's own narrow layout. */
      @container (max-width: 500px) {
        ha-settings-row {
          flex-direction: column;
          align-items: stretch;
          padding-bottom: var(--ha-space-3, 12px);
          --settings-row-content-padding-block: 0;
        }
      }
      .card-actions {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
    `]}get t(){return p(n(this.hass))}willUpdate(C){C.has("snapshot")&&this.snapshot&&this.snapshot.revision!==this.revision&&(this.revision=this.snapshot.revision,(!this.base||!this.draft||F2(this.draft,this.base))&&(this.draft={...this.snapshot.settings},this.base={...this.snapshot.settings}))}set(C,V){this.draft={...this.draft,[C]:V}}get dirty(){return this.base!==null&&!F2(this.draft,this.base)}updated(){let C=this.dirty;C!==this.reportedUnsaved&&(this.reportedUnsaved=C,A1(this,C))}async save(){let C=this.snapshot.settings;if(this.base&&!F2(C,this.base)&&!await G(this,this.t)){this.draft={...C},this.base={...C};return}let V={...this.draft};this.busy=!0;try{await x(this.hass).call("settings/save",{revision:this.snapshot.revision,settings:V}),this.base=V,h(this,this.t("adv.settings.saved"))}catch(L){h(this,Z(L,this.t))}finally{this.busy=!1}}choice(C,V,L,M,r,o){let i=this.t,v=(V.includes(L)?V:[...V,L].sort((A,u)=>A-u)).map(A=>({value:String(A),label:M==="duration"?I1(A):i(M==="hours"?"adv.settings.hours":"adv.settings.minutes",{n:A})}));return t`<ha-settings-row>
      <span slot="heading">${C}</span>
      ${o?t`<span slot="description">${o}</span>`:a}
      <ha-select
        .options=${v}
        .value=${String(L)}
        @selected=${A=>{A.detail.value!==void 0&&r(Number(A.detail.value))}}
      ></ha-select>
    </ha-settings-row>`}render(){if(!this.snapshot||!this.hass||!this.draft)return a;let C=this.t,V=this.draft;return t`
      <ha-card>
        ${this.choice(C("adv.settings.max_override"),k0,V.max_override_minutes/60,"hours",L=>this.set("max_override_minutes",Math.round(L*60)),C("adv.settings.max_override_hint"))}
        ${this.choice(C("adv.settings.safety_interval"),P0,V.safety_interval_minutes,"minutes",L=>this.set("safety_interval_minutes",L))}
        ${this.choice(C("adv.settings.mismatch_alert"),T0,V.mismatch_alert_minutes,"minutes",L=>this.set("mismatch_alert_minutes",L))}
        ${this.choice(C("adv.settings.boost"),B0,V.boost_minutes,"duration",L=>this.set("boost_minutes",L))}
        <ha-settings-row>
          <span slot="heading">${C("adv.settings.vacation_mode")}</span>
          <ha-select
            .options=${[{value:"frost",label:C("adv.settings.frost")},{value:"away",label:C("adv.settings.away")}]}
            .value=${V.vacation_mode}
            @selected=${L=>{L.detail.value&&this.set("vacation_mode",L.detail.value)}}
          ></ha-select>
        </ha-settings-row>
        <ha-settings-row>
          <span slot="heading">${C("adv.settings.dry_run")}</span>
          <ha-switch
            .checked=${V.dry_run}
            @change=${L=>this.set("dry_run",L.target.checked)}
          ></ha-switch>
        </ha-settings-row>
        <div class="card-actions">
          <ha-button .disabled=${this.busy||!this.dirty} .loading=${this.busy} @click=${this.save}>
            ${C("common.save")}
          </ha-button>
        </div>
      </ha-card>
    `}};s("hs-adv-settings",$2);var E2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2, 8px);
      }
      p {
        margin: 0;
      }
      ha-card {
        overflow: hidden;
      }
    `]}get t(){return p(n(this.hass))}async call(H,C){this.busy=!0;try{await x(this.hass).call(H,{revision:this.snapshot.revision,...C})}catch(V){h(this,Z(V,this.t))}finally{this.busy=!1}}roomNames(H){let C=H.rooms.map(V=>this.snapshot.rooms.find(L=>L.id===V)?.name).filter(Boolean).join(", ");return C?this.t("adv.zones.rooms",{rooms:C}):this.t("adv.zones.no_rooms")}async edit(H){let C=this.t,L=(await K1(this,{heading:C(H?"adv.zones.edit_title":"adv.zones.new_title"),label:C("adv.zones.name"),value:H?.name??"",confirm:C("common.save"),cancel:C("common.cancel")}))?.trim();!L||L===H?.name||await this.call("zone/save",{zone:H?{id:H.id,name:L}:{name:L}})}async move(H,C){let V=this.snapshot.zones.map(r=>r.id),L=V.indexOf(H.id),M=L+C;M<0||M>=V.length||([V[L],V[M]]=[V[M],V[L]],await this.call("zones/reorder",{order:V}))}async deleteZone(H){let C=this.t,V=this.snapshot.zones.find(M=>M.id!==H.id);if(!V)return;await f(this,{heading:C("common.delete"),message:C("adv.zones.delete_confirm",{name:H.name,first:V.name}),confirm:C("common.delete"),cancel:C("common.cancel"),danger:!0})&&await this.call("zone/delete",{zone_id:H.id})}menu(H,C){C==="edit"?this.edit(H):C==="up"?this.move(H,-1):C==="down"?this.move(H,1):C==="delete"&&this.deleteZone(H)}async fromFloors(){let H;try{H=await x(this.hass).call("candidates")}catch(r){h(this,Z(r,this.t));return}let C=this.t;if(!H.floors.length){await Z3(this,C("adv.zones.from_floors"),C("adv.zones.from_floors_none"));return}let V=r=>this.snapshot.rooms.find(o=>o.id===r)?.name??r,L=H.floors.map(r=>`${r.name}: ${r.rooms.map(V).join(", ")}`);await f(this,{heading:C("adv.zones.from_floors"),message:`${C("adv.zones.from_floors_hint")} ${L.join(" \xB7 ")}`,confirm:C("adv.zones.from_floors_button"),cancel:C("common.cancel")})&&await this.call("zones/from_floors",{})}render(){if(!this.snapshot||!this.hass)return a;let H=this.t,C=this.snapshot.zones;return t`
      <div class="actions">
        <ha-button .disabled=${this.busy} @click=${()=>this.edit(null)}>
          <ha-svg-icon slot="start" .path=${D}></ha-svg-icon>${H("adv.zones.add")}
        </ha-button>
        <ha-button appearance="plain" .disabled=${this.busy} @click=${this.fromFloors}>
          <ha-svg-icon slot="start" .path=${e1}></ha-svg-icon>${H("adv.zones.from_floors")}
        </ha-button>
      </div>
      ${C.length<2?t`<p class="muted">${H("adv.zones.one_hint")}</p>`:a}
      <ha-card>
        ${C.map((V,L)=>t`<ha-md-list-item type="button" @click=${()=>this.edit(V)}>
            <span slot="headline">${V.name}</span>
            <span slot="supporting-text">${this.roomNames(V)}</span>
            <ha-dropdown
              slot="end"
              @click=${M=>M.stopPropagation()}
              @wa-select=${M=>this.menu(V,M.detail.item.value)}
            >
              <ha-icon-button slot="trigger" .path=${F1} .label=${V.name}></ha-icon-button>
              <ha-dropdown-item value="edit">
                <ha-svg-icon slot="icon" .path=${M1}></ha-svg-icon>${H("common.edit")}
              </ha-dropdown-item>
              <ha-dropdown-item value="up" .disabled=${this.busy||L===0}>
                <ha-svg-icon slot="icon" .path=${R1}></ha-svg-icon>${H("adv.rooms.move_up")}
              </ha-dropdown-item>
              <ha-dropdown-item value="down" .disabled=${this.busy||L===C.length-1}>
                <ha-svg-icon slot="icon" .path=${_1}></ha-svg-icon>${H("adv.rooms.move_down")}
              </ha-dropdown-item>
              <ha-dropdown-item value="delete" variant="danger" .disabled=${this.busy||C.length<2}>
                <ha-svg-icon slot="icon" .path=${_}></ha-svg-icon>${H("common.delete")}
              </ha-dropdown-item>
            </ha-dropdown>
          </ha-md-list-item>`)}
      </ha-card>
    `}};s("hs-adv-zones",E2);var R3=[{id:"rooms",label:"adv.rooms",description:"adv.rooms_desc",icon:R5,color:"#3f51b5"},{id:"zones",label:"adv.zones",description:"adv.zones_desc",icon:e1,color:"#009688"},{id:"settings",label:"adv.settings",description:"adv.settings_desc",icon:w5,color:"#607d8b"},{id:"health",label:"adv.health",description:"adv.health_desc",icon:W5,color:"#4caf50"},{id:"log",label:"adv.log",description:"adv.log_desc",icon:_5,color:"#9c27b0"}],z2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},section:{attribute:!1}}}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
        max-width: 760px;
        margin: 0 auto;
      }
      ha-alert {
        display: block;
      }
      .list {
        overflow: hidden;
      }
      .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        color: #fff;
      }
      .back {
        align-self: flex-start;
      }
      h1 {
        margin: 0;
        font-size: var(--ha-font-size-2xl, 24px);
        font-weight: var(--ha-font-weight-normal, 400);
      }
    `]}navigate(H){let C=H?`/advanced/${H}`:"/advanced";this.dispatchEvent(new CustomEvent("hs-navigate",{detail:C,bubbles:!0,composed:!0}))}content(){switch(this.section){case"rooms":return t`<hs-adv-rooms .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-rooms>`;case"zones":return t`<hs-adv-zones .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-zones>`;case"settings":return t`<hs-adv-settings .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-settings>`;case"health":return t`<hs-adv-health .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-health>`;default:return t`<hs-adv-log .hass=${this.hass} .snapshot=${this.snapshot}></hs-adv-log>`}}render(){if(!this.snapshot||!this.hass)return a;let H=p(n(this.hass)),C=R3.find(V=>V.id===this.section);return t`
      ${this.snapshot.settings.dry_run?t`<ha-alert alert-type="warning">${H("adv.dry_run_banner")}</ha-alert>`:a}
      ${C?t`<ha-button class="back" appearance="plain" @click=${()=>this.navigate("")}>
              <ha-svg-icon slot="start" .path=${B1}></ha-svg-icon>${H("nav.advanced")}
            </ha-button>
            <h1>${H(C.label)}</h1>
            ${this.content()}`:t`<ha-card class="list">
            ${R3.map(V=>t`<ha-md-list-item type="button" @click=${()=>this.navigate(V.id)}>
                <div slot="start" class="icon" style="background-color:${V.color}">
                  <ha-svg-icon .path=${V.icon}></ha-svg-icon>
                </div>
                <span slot="headline">${H(V.label)}</span>
                <span slot="supporting-text">${H(V.description)}</span>
                <ha-svg-icon slot="end" .path=${D1}></ha-svg-icon>
              </ha-md-list-item>`)}
          </ha-card>`}
    `}};s("hs-advanced-view",z2);var N2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1}}}static{this.styles=[c,m`
      :host {
        display: block;
      }
      .zones {
        display: grid;
        gap: var(--ha-space-6, 24px);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        align-items: start;
        gap: var(--ha-space-2, 8px);
      }
      ha-alert,
      hs-house-hints {
        display: block;
        margin-bottom: var(--ha-space-4, 16px);
      }
      hs-house-hints[hidden] {
        display: none;
      }
      .empty {
        padding: var(--ha-space-4, 16px);
      }
      .empty p {
        margin: 0 0 var(--ha-space-4, 16px);
      }
    `]}addRooms(){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/advanced/rooms",bubbles:!0,composed:!0}))}rooms(H){return v1(H,C=>C.id,C=>t`<hs-room-card .hass=${this.hass} .room=${C} .snapshot=${this.snapshot}></hs-room-card>`)}render(){if(!this.snapshot)return a;let H=p(n(this.hass)),C=this.snapshot,V=C.rooms.filter(r=>r.issues.length>0).map(r=>r.name),L=t`${C.settings.dry_run?t`<ha-alert alert-type="warning">${H("adv.dry_run_banner")}</ha-alert>`:a}
    ${V.length?t`<ha-alert alert-type="warning">${H("home.problems",{rooms:V.join(", ")})}</ha-alert>`:a}
    <hs-house-hints .hass=${this.hass} .snapshot=${C}></hs-house-hints>`;if(C.rooms.length===0)return t`${L}
        <div class="grid">
          <hs-house-card .hass=${this.hass} .snapshot=${C}></hs-house-card>
          <ha-card class="empty">
            <p>${H("adv.rooms.empty")}</p>
            <ha-button @click=${this.addRooms}>${H("adv.rooms.add")}</ha-button>
          </ha-card>
        </div>`;let M=t`<hs-boost-card .hass=${this.hass} .snapshot=${C}></hs-boost-card>`;return C.zones.length<2?t`${L}
        <div class="grid">
          <hs-house-card .hass=${this.hass} .snapshot=${C}></hs-house-card>
          ${M} ${this.rooms(C.rooms)}
        </div>`:t`${L}
      <div class="zones">
        <div class="grid">
          <hs-house-card .hass=${this.hass} .snapshot=${C}></hs-house-card>
          ${M}
        </div>
        ${v1(C.zones,r=>r.id,r=>t`<div class="grid">
            <hs-house-card .hass=${this.hass} .snapshot=${C} .zone=${r}></hs-house-card>
            ${this.rooms(H1(C,r))}
          </div>`)}
      </div>`}};s("hs-home-view",N2);function _0(e){let[H,C]=e.split(":").map(Number);return(H??0)*60+(C??0)}function T(e){let H=Math.floor(e/60);return`${String(H).padStart(2,"0")}:${String(e%60).padStart(2,"0")}`}function $3(e){return Math.round(e/15)*15}function I(e){let H=new Map;for(let L of e)H.set(L.start,L.mode);let C=[...H.entries()].sort((L,M)=>L[0]-M[0]),V=[];for(let[L,M]of C)V.length&&V[V.length-1].mode===M||V.push({start:L,mode:M});return V.length&&V[0].start!==0&&(V[0]={start:0,mode:V[0].mode}),V}function D0(e){let H=e.map(L=>[...L].sort((M,r)=>M.start-r.start)),C=L=>{for(let M=1;M<=7;M+=1){let r=H[(L-M+7)%7];if(r.length)return r[r.length-1].mode}return null},V=H.map((L,M)=>C(M));return H.map((L,M)=>{if(L.length&&L[0].start===0)return F3(L);let r=V[M]??L[0]?.mode??"comfort";return F3([{start:0,mode:r},...L])})}function F3(e){return I(e)}function Z1(e){return D0(e.days.map(H=>H.map(C=>({start:_0(C.start),mode:C.mode}))))}function E3(e){return e.map(H=>H.map(C=>({start:T(C.start),mode:C.mode})))}function W(e){return e.map((H,C)=>({index:C,start:H.start,end:e[C+1]?.start??1440,mode:H.mode}))}function I2(e,H){let C=W(e);return C.find(V=>H>=V.start&&H<V.end)??C[C.length-1]}function z3(e,H,C){return I(e.map((V,L)=>L===H?{...V,mode:C}:V))}function h1(e,H,C){if(H<=0||H>=e.length)return e;let V=e[H-1].start+15,L=(e[H+1]?.start??1440)-15,M=Math.min(L,Math.max(V,$3(C)));return e.map((r,o)=>o===H?{...r,start:M}:r)}function W2(e,H){return e.end-e.start<30?null:Math.min(e.end-15,Math.max(e.start+15,$3(H)))}function N3(e,H,C){let V=I2(e,H),L=W2(V,H);if(L===null)return{day:e,index:V.index};let M=[...e.slice(0,V.index+1),{start:L,mode:C},...e.slice(V.index+1)];if(C===V.mode)return{day:M,index:V.index+1};let r=I(M);return{day:r,index:r.findIndex(o=>o.start===L)}}function I3(e,H){if(e.length<=1||H<0||H>=e.length)return e;if(H===0){let[,C,...V]=e;return I([{start:0,mode:C.mode},...V])}return I(e.filter((C,V)=>V!==H))}function W3(e,H,C){return e.map((V,L)=>C.includes(L)?e[H].map(M=>({...M})):V)}function V2(e,H){return e.length===H.length&&e.every((C,V)=>C.start===H[V].start&&C.mode===H[V].mode)}function U3(e){switch(e){case"comfort":return"eco";case"night":case"eco":case"away":case"frost":case"off":return"comfort"}}var Q3=[0,1,2,3,4],G3=[5,6],U2=[0,1,2,3,4,5,6];function L2(e){return e/1440*100}var G2=class extends l{constructor(){super();this.moved=!1;this.interactive=!1,this.labels=!1,this.dragIndex=null,this.handleLabel=(C,V)=>V}static{this.properties={day:{attribute:!1},interactive:{type:Boolean},labels:{type:Boolean},handleLabel:{attribute:!1},dragIndex:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: block;
        --bar-height: 36px;
      }
      .bar {
        position: relative;
        height: var(--bar-height);
        border-radius: var(--bar-radius, var(--ha-border-radius-md, 8px));
        overflow: visible;
        background: var(--divider-color, #ccc);
      }
      .clip {
        position: absolute;
        inset: 0;
        border-radius: var(--bar-radius, var(--ha-border-radius-md, 8px));
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
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid var(--card-background-color, #fff);
        --mdc-icon-size: 16px;
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
        width: 10px;
        height: calc(100% - 12px);
        border-radius: var(--ha-border-radius-pill, 9999px);
        background: #fff;
        border: 1px solid rgba(0, 0, 0, 0.4);
        box-shadow: var(--ha-box-shadow-s, 0 1px 3px rgba(0, 0, 0, 0.3));
      }
      .handle:focus-visible .grip,
      .handle.active .grip {
        outline: 2px solid var(--primary-color);
      }
      .tip {
        position: absolute;
        bottom: calc(100% + 14px);
        transform: translateX(-50%);
        padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
        border-radius: var(--ha-border-radius-sm, 4px);
        background: var(--ha-tooltip-background-color, #616161);
        color: var(--ha-tooltip-text-color, #fff);
        font-size: var(--ha-font-size-m, 14px);
        font-weight: var(--ha-font-weight-medium, 500);
        pointer-events: none;
        white-space: nowrap;
        z-index: 2;
      }
    `]}updated(C){C.has("interactive")&&this.toggleAttribute("interactive",this.interactive)}get bar(){return this.renderRoot.querySelector(".bar")}minuteAt(C){let V=this.bar.getBoundingClientRect();return Math.min(1440,Math.max(0,(C-V.left)/V.width*1440))}emitMove(C,V,L){this.dispatchEvent(new CustomEvent("boundary-move",{detail:{index:C,minute:V,done:L}}))}onPointerDown(C,V){C.preventDefault(),C.stopPropagation(),C.currentTarget.setPointerCapture(C.pointerId),this.dragIndex=V,this.moved=!1}onPointerMove(C){this.dragIndex!==null&&(this.moved=!0,this.emitMove(this.dragIndex,this.minuteAt(C.clientX),!1))}onPointerUp(C){if(this.dragIndex===null)return;let V=this.dragIndex;this.dragIndex=null,this.moved&&this.emitMove(V,this.minuteAt(C.clientX),!0),C.stopPropagation()}onKey(C,V){let L=C.key==="ArrowLeft"?-15:C.key==="ArrowRight"?15:0;L&&(C.preventDefault(),this.emitMove(V,this.day[V].start+L,!0))}onBarClick(C){if(!this.interactive||this.moved){this.moved=!1;return}let V=this.minuteAt(C.clientX),L=W(this.day).find(M=>V>=M.start&&V<M.end);L&&this.dispatchEvent(new CustomEvent("segment-tap",{detail:{index:L.index,minute:V}}))}render(){if(!this.day)return a;let C=W(this.day),V=this.dragIndex!==null?this.day[this.dragIndex]:void 0;return t`
      <div class="bar" @click=${this.onBarClick}>
        <div class="clip">
          ${C.map(L=>{let M=L2(L.end-L.start);return t`<div
              class="seg"
              style="left:${L2(L.start)}%;width:${M}%;background:${P[L.mode]}"
            >
              ${this.labels&&M>=7?t`<ha-svg-icon .path=${B[L.mode]}></ha-svg-icon>`:a}
              ${this.labels&&M>=17?T(L.start):a}
            </div>`})}
        </div>
        ${this.interactive?C.slice(1).map(L=>t`<button
                class="handle ${this.dragIndex===L.index?"active":""}"
                style="left:${L2(L.start)}%"
                aria-label=${this.handleLabel(L.index,T(L.start))}
                @pointerdown=${M=>this.onPointerDown(M,L.index)}
                @pointermove=${this.onPointerMove}
                @pointerup=${this.onPointerUp}
                @pointercancel=${this.onPointerUp}
                @click=${M=>M.stopPropagation()}
                @keydown=${M=>this.onKey(M,L.index)}
              >
                <span class="grip"></span>
              </button>`):a}
        ${V?t`<div class="tip" style="left:${L2(V.start)}%">${T(V.start)}</div>`:a}
      </div>
    `}};s("hs-day-bar",G2);var K2=class extends y{static{this.properties={day:{state:!0},index:{state:!0},minute:{state:!0}}}static{this.styles=m`
    .label {
      margin: 0 0 var(--ha-space-2, 8px);
      color: var(--secondary-text-color);
    }
    .modes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-6, 24px);
      --control-button-border-radius: var(--ha-border-radius-lg, 12px);
    }
    .modes ha-control-button {
      width: 100%;
      height: 56px;
      --control-button-icon-color: var(--mode-color);
      --control-button-focus-color: var(--mode-color);
      --control-button-padding: var(--ha-space-1, 4px);
      font-size: var(--ha-font-size-m, 14px);
    }
    .modes ha-control-button.selected {
      --control-button-background-color: var(--mode-color);
      --control-button-background-opacity: 1;
      --control-button-icon-color: #fff;
      color: #fff;
    }
    .option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .times {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--ha-space-4, 16px);
      margin-bottom: var(--ha-space-6, 24px);
    }
    .stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 42px;
      border-radius: var(--ha-border-radius-lg, 12px);
      background: rgba(var(--rgb-disabled-color, 189, 189, 189), 0.2);
      font-weight: var(--ha-font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
      --ha-icon-button-size: 42px;
      --mdc-icon-size: 16px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
    }
  `}dialogOpened(H){this.day=H.day,this.index=H.index,this.minute=H.minute}get t(){return p(n(this.hass))}change(H,C=this.index){this.day=H,this.index=Math.max(0,Math.min(C,H.length-1)),this.args?.onChange(H)}setMode(H){let C=this.day[this.index].start,V=z3(this.day,this.index,H);this.change(V,I2(V,C).index)}moveStart(H){this.change(h1(this.day,this.index,this.day[this.index].start+H))}moveEnd(H){let C=this.index+1;this.change(h1(this.day,C,this.day[C].start+H))}addChange(H){let C=W(this.day)[this.index],V=N3(this.day,H,U3(C.mode));this.minute=null,this.change(V.day,V.index)}removePart(){this.change(I3(this.day,this.index),Math.max(0,this.index-1)),this.closeDialog()}stepper(H,C,V){let L=this.t;return t`<div>
      <p class="label">${H}</p>
      <div class="stepper">
        <ha-icon-button .path=${z5} .label=${L("editor.earlier")} @click=${()=>V(-15)}></ha-icon-button>
        <span>${T(C)}</span>
        <ha-icon-button .path=${D} .label=${L("editor.later")} @click=${()=>V(15)}></ha-icon-button>
      </div>
    </div>`}render(){if(!this.args||!this.day)return a;let H=this.t,C=W(this.day)[this.index];if(!C)return a;let V=W2(C,this.minute??(C.start+C.end)/2),L=C.index===0,M=C.index===this.day.length-1;return t`
      <ha-dialog
        .open=${this.open}
        header-title=${`${this.args.dayName} ${T(C.start)} \u2013 ${T(C.end)}`}
        @closed=${this.onClosed}
      >
        <p class="label">${H("editor.mode")}</p>
        <div class="modes">
          ${O3.map(r=>t`<ha-control-button
              class=${C.mode===r?"selected":""}
              style="--mode-color:${P[r]}"
              .label=${H(`mode.${r}`)}
              aria-pressed=${C.mode===r?"true":"false"}
              @click=${()=>this.setMode(r)}
            >
              <span class="option">
                <ha-svg-icon .path=${B[r]}></ha-svg-icon>
                ${H(`mode.${r}`)}
              </span>
            </ha-control-button>`)}
        </div>
        ${L&&M?a:t`<div class="times">
              ${L?a:this.stepper(H("editor.starts"),C.start,r=>this.moveStart(r))}
              ${M?a:this.stepper(H("editor.ends"),C.end,r=>this.moveEnd(r))}
            </div>`}
        <div class="actions">
          ${V!==null?t`<ha-button appearance="outlined" @click=${()=>this.addChange(V)}>
                <ha-svg-icon slot="start" .path=${N5}></ha-svg-icon>
                ${H("editor.add_change",{time:T(V)})}
              </ha-button>`:a}
          ${this.day.length>1?t`<ha-button appearance="plain" variant="danger" @click=${this.removePart}>
                <ha-svg-icon slot="start" .path=${_}></ha-svg-icon>
                ${H("editor.remove")}
              </ha-button>`:a}
        </div>
        <ha-dialog-footer slot="footer">
          <ha-button slot="primaryAction" @click=${()=>this.closeDialog()}>${H("common.close")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-block-sheet",K2);function K3(e,H){w(e,"hs-block-sheet",H)}var j2=class extends y{constructor(){super(...arguments);this.result=[]}static{this.properties={chosen:{state:!0}}}static{this.styles=m`
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2, 8px);
      margin-bottom: var(--ha-space-2, 8px);
    }
    ha-md-list-item {
      --md-list-item-leading-space: 0;
    }
    ha-svg-icon[slot="start"] {
      color: var(--secondary-text-color);
    }
    .chosen ha-svg-icon[slot="start"] {
      color: var(--primary-color);
    }
  `}dialogOpened(){this.chosen=[],this.result=[]}dialogClosed(){this.args?.resolve(this.result)}get t(){return p(n(this.hass))}pick(C){let V=this.args?.source;this.chosen=C.filter(L=>L!==V)}toggle(C){this.chosen=this.chosen.includes(C)?this.chosen.filter(V=>V!==C):[...this.chosen,C]}copy(){this.result=[...this.chosen].sort(),this.closeDialog()}render(){if(!this.args)return a;let C=this.t,V=this.args.source;return t`
      <ha-dialog
        .open=${this.open}
        header-title=${C("editor.copy_title",{day:C(`day.acc.${V}`)})}
        @closed=${this.onClosed}
      >
        <div class="quick">
          <ha-button appearance="outlined" @click=${()=>this.pick(Q3)}>
            ${C("editor.workdays")}
          </ha-button>
          <ha-button appearance="outlined" @click=${()=>this.pick(G3)}>
            ${C("editor.weekend")}
          </ha-button>
          <ha-button appearance="outlined" @click=${()=>this.pick(U2)}>
            ${C("editor.all_days")}
          </ha-button>
        </div>
        ${U2.map(L=>{let M=L===V||this.chosen.includes(L);return t`<ha-md-list-item
            type="button"
            class=${M?"chosen":""}
            aria-pressed=${M?"true":"false"}
            ?disabled=${L===V}
            @click=${()=>this.toggle(L)}
          >
            <ha-svg-icon slot="start" .path=${M?y5:b5}></ha-svg-icon>
            <span slot="headline">${C(`day.${L}`)}</span>
          </ha-md-list-item>`})}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.closeDialog()}>
            ${C("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${this.chosen.length===0} @click=${this.copy}>
            ${C("editor.copy")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-copy-dialog",j2);function j3(e,H){return new Promise(C=>w(e,"hs-copy-dialog",{source:H,resolve:C}))}var R0=[0,6,12,18,24],q2=class extends l{static{this.properties={days:{attribute:!1},t:{attribute:!1},selected:{type:Number},changed:{attribute:!1},readonly:{type:Boolean},compact:{type:Boolean}}}constructor(){super(),this.selected=-1,this.changed=new Set,this.readonly=!1,this.compact=!1}static{this.styles=[c,m`
      :host {
        display: block;
      }
      .rows {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-1, 4px);
      }
      .day {
        display: grid;
        grid-template-columns: 36px 1fr;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        width: 100%;
        min-height: 40px;
        padding: var(--ha-space-1, 4px) var(--ha-space-2, 8px);
        border: 2px solid transparent;
        border-radius: var(--ha-border-radius-md, 8px);
        background: transparent;
        text-align: left;
        cursor: pointer;
      }
      .day[aria-pressed="true"] {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color, 0, 154, 199), 0.08);
      }
      :host([readonly]) .day {
        cursor: default;
      }
      .label {
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
        display: flex;
        align-items: center;
        gap: var(--ha-space-1, 4px);
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--warning-color);
      }
      hs-day-bar {
        --bar-height: 24px;
      }
      :host([compact]) .day {
        min-height: 20px;
        padding: 1px var(--ha-space-2, 8px);
      }
      :host([compact]) hs-day-bar {
        --bar-height: 12px;
        --bar-radius: var(--ha-border-radius-sm, 4px);
      }
      .axis {
        display: grid;
        grid-template-columns: 36px 1fr;
        gap: var(--ha-space-2, 8px);
        padding: 0 var(--ha-space-2, 8px);
        font-size: var(--ha-font-size-xs, 10px);
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
    `]}select(H){this.readonly||this.dispatchEvent(new CustomEvent("day-select",{detail:H}))}render(){return!this.days||!this.t?a:t`
      <div class="rows" role="group">
        ${this.days.map((H,C)=>t`<button
            class="day"
            aria-pressed=${C===this.selected?"true":"false"}
            aria-label=${this.t(`day.${C}`)}
            ?disabled=${this.readonly}
            @click=${()=>this.select(C)}
          >
            <span class="label">
              ${this.t(`day.short.${C}`)}
              ${this.changed.has(C)?t`<span class="dot" aria-hidden="true"></span>`:a}
            </span>
            <hs-day-bar .day=${H}></hs-day-bar>
          </button>`)}
      </div>
      ${this.compact?a:t`<div class="axis muted" aria-hidden="true">
            <span></span>
            <div class="ticks">
              ${R0.map(H=>t`<span style="left:${H/24*100}%">${H}</span>`)}
            </div>
          </div>`}
    `}};s("hs-week-view",q2);var X2=class extends l{constructor(){super();this.loadedId=null;this.baseName="";this.original=[];this.reportedUnsaved=!1;this.days=[],this.name="",this.saving=!1,this.selected=-1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},plan:{attribute:!1},days:{state:!0},name:{state:!0},selected:{state:!0},saving:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4, 16px);
        /* A flex item with auto margins shrinks to its content without a width. */
        width: 100%;
        box-sizing: border-box;
        max-width: 760px;
        margin: 0 auto;
      }
      .back {
        align-self: flex-start;
      }
      .card-content {
        padding: var(--ha-space-4, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      h2 {
        margin: 0;
        font-size: var(--ha-font-size-l, 16px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .big {
        --bar-height: 48px;
        margin-top: 40px;
      }
      .axis {
        position: relative;
        height: 16px;
        font-size: var(--ha-font-size-xs, 10px);
        color: var(--secondary-text-color);
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
        margin: 0 calc(-1 * var(--ha-space-4, 16px));
      }
      .parts ha-md-list-item ha-svg-icon[slot="start"] {
        color: var(--mode-color);
      }
      .card-actions {
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
      .footer {
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: flex-end;
        gap: var(--ha-space-2, 8px);
        padding: var(--ha-space-3, 12px) 0;
        background: var(--primary-background-color);
        border-top: 1px solid var(--divider-color);
        z-index: 3;
      }
      .unsaved {
        margin-inline-end: auto;
        align-self: center;
        color: var(--warning-color);
      }
    `]}get t(){return p(n(this.hass))}get dirty(){return this.name.trim()!==this.baseName||this.days.some((C,V)=>!V2(I(C),this.original[V]??[]))}updated(){let C=this.dirty;C!==this.reportedUnsaved&&(this.reportedUnsaved=C,A1(this,C))}willUpdate(C){(this.plan&&this.plan.id!==this.loadedId||C.has("plan")&&this.plan&&!this.dirty)&&this.load()}load(){this.loadedId=this.plan.id,this.baseName=this.plan.name,this.original=Z1(this.plan),this.days=this.original.map(C=>C.map(V=>({...V}))),this.name=this.plan.name,this.selected<0&&(this.selected=R(new Date,this.snapshot.time_zone).weekday)}setDay(C,V){this.days=this.days.map((L,M)=>M===C?V:L)}onMove(C){let{index:V,minute:L}=C.detail;this.setDay(this.selected,h1(this.days[this.selected],V,L))}openSheet(C,V){let L=this.selected;K3(this,{day:this.days[L],index:C,minute:V,dayName:this.t(`day.${L}`),onChange:M=>this.setDay(L,M)})}async copyDay(){let C=await j3(this,this.selected);C.length&&(this.days=W3(this.days,this.selected,C))}changedDays(){return new Set(this.days.map((C,V)=>V2(I(C),this.original[V]??[])?-1:V).filter(C=>C>=0))}roomNames(C){return C.map(V=>this.snapshot.rooms.find(L=>L.id===V)?.name).filter(Boolean).join(", ")}changedElsewhere(){let C=Z1(this.plan);return this.plan.name!==this.baseName||C.some((V,L)=>!V2(V,this.original[L]??[]))}async confirmSave(){let C=this.plan.used_by??[],V=this.t;await new Promise(M=>w(this,"hs-save-plan-dialog",{days:this.days,changed:this.changedDays(),used:C.length?V("editor.preview_used",{rooms:this.roomNames(C)}):V("editor.preview_unused"),resolve:M}))&&await this.save()}async save(){if(this.changedElsewhere()&&!await G(this,this.t)){this.load();return}let C=this.name.trim(),V=this.days.map(L=>I(L));this.saving=!0;try{await x(this.hass).call("plan/save",{revision:this.snapshot.revision,plan:{id:this.plan.id,name:C,days:E3(V)}}),this.baseName=C,this.original=V,h(this,this.t("editor.saved"))}catch(L){h(this,Z(L,this.t))}finally{this.saving=!1}}async leave(){if(this.dirty){let C=this.t;if(!await f(this,{heading:C("editor.unsaved"),message:C("editor.discard"),confirm:C("editor.discard_button"),cancel:C("common.back"),danger:!0}))return}this.dispatchEvent(new CustomEvent("hs-navigate",{detail:"/plans",bubbles:!0,composed:!0}))}cancel(){if(!this.dirty){this.leave();return}(async()=>{let C=this.t;await f(this,{heading:C("editor.unsaved"),message:C("editor.discard"),confirm:C("editor.discard_button"),cancel:C("common.back"),danger:!0})&&this.load()})()}render(){if(!this.plan||!this.days.length)return a;let C=this.t,V=this.days[this.selected]??this.days[0],L=this.plan.used_by??[],M=this.dirty;return t`
      <ha-button class="back" appearance="plain" @click=${this.leave}>
        <ha-svg-icon slot="start" .path=${B1}></ha-svg-icon>${C("plans.all_plans")}
      </ha-button>
      <ha-card>
        <div class="card-content">
          <ha-input
            .label=${C("plans.name")}
            .value=${this.name}
            maxlength="60"
            @input=${r=>this.name=r.target.value}
          ></ha-input>
          <span class="muted">
            ${L.length?C("plans.used_by",{rooms:this.roomNames(L)}):C("plans.unused")}
          </span>
        </div>
      </ha-card>
      <ha-card>
        <div class="card-content">
          <span class="muted">${C("editor.tap_day")}</span>
          <hs-week-view
            .days=${this.days}
            .t=${C}
            .selected=${this.selected}
            .changed=${this.changedDays()}
            @day-select=${r=>this.selected=r.detail}
          ></hs-week-view>
        </div>
      </ha-card>
      <ha-card aria-live="polite">
        <div class="card-content">
          <h2>${C(`day.${this.selected}`)}</h2>
          <span class="muted">${C("editor.drag_hint")}</span>
          <hs-day-bar
            class="big"
            interactive
            labels
            .day=${V}
            .handleLabel=${(r,o)=>`${C("editor.starts")} ${o}`}
            @boundary-move=${this.onMove}
            @segment-tap=${r=>this.openSheet(r.detail.index,r.detail.minute)}
          ></hs-day-bar>
          <div class="axis" aria-hidden="true">
            ${[0,6,12,18,24].map(r=>t`<span style="left:${r/24*100}%">${r}:00</span>`)}
          </div>
          <div class="parts" role="list" aria-label=${C("editor.parts")}>
            ${W(V).map(r=>t`<ha-md-list-item
                type="button"
                role="listitem"
                style="--mode-color:${P[r.mode]}"
                @click=${()=>this.openSheet(r.index,null)}
              >
                <ha-svg-icon slot="start" .path=${B[r.mode]}></ha-svg-icon>
                <span slot="headline">${T(r.start)} – ${T(r.end)}</span>
                <span slot="supporting-text">${C(`mode.${r.mode}`)}</span>
                <ha-svg-icon slot="end" .path=${D1}></ha-svg-icon>
              </ha-md-list-item>`)}
          </div>
        </div>
        <div class="card-actions">
          <ha-button appearance="plain" @click=${this.copyDay}>
            <ha-svg-icon slot="start" .path=${k5}></ha-svg-icon>${C("editor.copy_day")}
          </ha-button>
        </div>
      </ha-card>
      <div class="footer">
        ${M?t`<span class="unsaved">${C("editor.unsaved")}</span>`:a}
        <ha-button appearance="plain" .disabled=${!M||this.saving} @click=${this.cancel}>
          ${C("common.cancel")}
        </ha-button>
        <ha-button .disabled=${!M||this.saving} .loading=${this.saving} @click=${this.confirmSave}>
          ${C("common.save")}
        </ha-button>
      </div>
    `}};s("hs-plan-editor",X2);var Y2=class extends y{constructor(){super(...arguments);this.confirmed=!1}static{this.styles=m`
    p {
      color: var(--secondary-text-color);
      margin: 0 0 var(--ha-space-3, 12px);
    }
    hs-week-view + p {
      margin: var(--ha-space-3, 12px) 0 0;
    }
  `}dialogOpened(){this.confirmed=!1}dialogClosed(){this.args?.resolve(this.confirmed)}answer(C){this.confirmed=C,this.closeDialog()}render(){let C=this.args;if(!C)return a;let V=p(n(this.hass));return t`
      <ha-dialog .open=${this.open} header-title=${V("editor.preview_title")} @closed=${this.onClosed}>
        <p>${V("editor.preview_changed")}</p>
        <hs-week-view readonly .days=${C.days} .t=${V} .changed=${C.changed}></hs-week-view>
        <p>${C.used}</p>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.answer(!1)}>
            ${V("common.back")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${()=>this.answer(!0)}>${V("common.save")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-save-plan-dialog",Y2);var J2=class extends l{static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},planId:{attribute:!1},busy:{state:!0}}}constructor(){super(),this.busy=!1}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-6, 24px);
      }
      .plans {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        align-items: start;
        gap: var(--ha-space-2, 8px);
      }
      .card-content {
        padding: 0 var(--ha-space-4, 16px) var(--ha-space-4, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      .card-actions {
        display: flex;
        gap: var(--ha-space-2, 8px);
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
      .new {
        align-self: flex-start;
      }
      ha-settings-row {
        border-top: 1px solid var(--divider-color);
      }
      ha-settings-row:first-of-type {
        border-top: none;
      }
      .assign {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: var(--ha-space-2, 8px);
      }
      ha-select {
        width: 220px;
        max-width: 100%;
      }
      .rooms {
        container-type: inline-size;
      }
      /* HA gives a row's label and its control half the width each. In a narrow card the control
         goes under the label, as in HA's own narrow layout. */
      @container (max-width: 760px) {
        ha-settings-row {
          flex-direction: column;
          align-items: stretch;
          padding-bottom: var(--ha-space-3, 12px);
          --settings-row-content-padding-block: 0;
        }
      }
      .own {
        min-width: 130px;
      }
    `]}get t(){return p(n(this.hass))}roomNames(H=[]){return H.map(C=>this.snapshot.rooms.find(V=>V.id===C)?.name).filter(Boolean).join(", ")}navigate(H){this.dispatchEvent(new CustomEvent("hs-navigate",{detail:H,bubbles:!0,composed:!0}))}async run(H){this.busy=!0;try{return await H()}catch(C){return h(this,Z(C,this.t)),null}finally{this.busy=!1}}sharesPlan(H){return H.plan_id==="house"?!0:(this.snapshot.plans.find(V=>V.id===H.plan_id)?.used_by??[]).length>1}async assign(H,C){await this.run(()=>x(this.hass).call("room/save",{revision:this.snapshot.revision,room:N(H,{plan_id:C})}))}async ownPlan(H){let C=this.snapshot.plans.find(o=>o.id===H.plan_id);if(!C)return;let V=x(this.hass),L=this.snapshot.revision,M=V1(H.name,this.snapshot.plans.map(o=>o.name)),r=await this.run(async()=>{let o=await V.call("plan/save",{revision:L,plan:{name:M,days:C.days}});return await V.call("room/save",{revision:o.revision,room:N(H,{plan_id:o.plan_id})}),o.plan_id});r&&this.navigate(`/plans/${r}`)}async deletePlan(H){let C=this.t,V=H.used_by??[];await f(this,{heading:C("common.delete"),message:V.length?C("plans.delete_confirm_used",{name:H.name,rooms:this.roomNames(V)}):C("plans.delete_confirm",{name:H.name}),confirm:C("common.delete"),cancel:C("common.cancel"),danger:!0})&&await this.run(()=>x(this.hass).call("plan/delete",{revision:this.snapshot.revision,plan_id:H.id}))}async openNew(){let H=await new Promise(L=>w(this,"hs-new-plan-dialog",{name:V1(this.t("plans.new"),this.snapshot.plans.map(M=>M.name)),plans:this.snapshot.plans,resolve:L})),C=this.snapshot.plans.find(L=>L.id===H?.source);if(!H||!C||!H.name.trim())return;let V=await this.run(()=>x(this.hass).call("plan/save",{revision:this.snapshot.revision,plan:{name:H.name.trim(),days:C.days}}));V&&this.navigate(`/plans/${V.plan_id}`)}render(){if(!this.snapshot||!this.hass)return a;let H=this.t;if(this.planId){let V=this.snapshot.plans.find(L=>L.id===this.planId);if(V)return t`<hs-plan-editor .hass=${this.hass} .snapshot=${this.snapshot} .plan=${V}></hs-plan-editor>`}let C=this.snapshot.plans.map(V=>({value:V.id,label:V.name}));return t`
      <div class="plans">
        ${this.snapshot.plans.map(V=>t`<ha-card .header=${V.name}>
            <div class="card-content">
              <span class="muted">
                ${V.id==="house"?`${H("plans.house_badge")} \xB7 `:""}${V.used_by?.length?H("plans.used_by",{rooms:this.roomNames(V.used_by)}):H("plans.unused")}
              </span>
              <hs-week-view compact readonly .days=${Z1(V)} .t=${H}></hs-week-view>
            </div>
            <div class="card-actions">
              <ha-button appearance="plain" @click=${()=>this.navigate(`/plans/${V.id}`)}>
                <ha-svg-icon slot="start" .path=${M1}></ha-svg-icon>${H("plans.edit")}
              </ha-button>
              ${V.id==="house"?a:t`<ha-button
                    appearance="plain"
                    variant="danger"
                    .disabled=${this.busy}
                    @click=${()=>this.deletePlan(V)}
                  >
                    <ha-svg-icon slot="start" .path=${_}></ha-svg-icon>${H("common.delete")}
                  </ha-button>`}
            </div>
          </ha-card>`)}
      </div>
      <ha-button class="new" @click=${this.openNew}>
        <ha-svg-icon slot="start" .path=${D}></ha-svg-icon>${H("plans.new")}
      </ha-button>
      ${this.snapshot.rooms.length?t`<ha-card class="rooms" .header=${H("plans.rooms_title")}>
            ${this.snapshot.rooms.map(V=>t`<ha-settings-row>
                <span slot="heading">${V.name}</span>
                <div class="assign">
                  <ha-select
                    .label=${H("adv.rooms.plan")}
                    .options=${C}
                    .value=${V.plan_id}
                    .disabled=${this.busy}
                    @selected=${L=>{L.detail.value&&L.detail.value!==V.plan_id&&this.assign(V,L.detail.value)}}
                  ></ha-select>
                  ${this.sharesPlan(V)?t`<ha-button
                        class="own"
                        appearance="plain"
                        .disabled=${this.busy}
                        @click=${()=>this.ownPlan(V)}
                      >
                        ${H("plans.own_plan")}
                      </ha-button>`:t`<span class="own"></span>`}
                </div>
              </ha-settings-row>`)}
          </ha-card>`:a}
    `}};s("hs-plans-view",J2);var C5=class extends y{constructor(){super(...arguments);this.result=null}static{this.properties={data:{state:!0}}}dialogOpened(C){this.data={name:C.name,source:"house"},this.result=null}dialogClosed(){this.args?.resolve(this.result)}get t(){return p(n(this.hass))}create(){this.data.name.trim()&&(this.result=this.data,this.closeDialog())}render(){if(!this.args)return a;let C=this.t,V=[{name:"name",required:!0,selector:{text:{}}},{name:"source",required:!0,selector:{select:{mode:"dropdown",options:this.args.plans.map(M=>({value:M.id,label:M.name}))}}}],L={name:C("plans.name"),source:C("plans.start_from")};return t`
      <ha-dialog .open=${this.open} header-title=${C("plans.new")} @closed=${this.onClosed}>
        <ha-form
          .hass=${this.hass}
          .data=${this.data}
          .schema=${V}
          .computeLabel=${M=>L[M.name]??M.name}
          @value-changed=${M=>this.data={...this.data,...M.detail.value}}
        ></ha-form>
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this.closeDialog()}>
            ${C("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" .disabled=${!this.data.name.trim()} @click=${this.create}>
            ${C("plans.create")}
          </ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `}};s("hs-new-plan-dialog",C5);function H5(e,H){let C=new Set([...Object.keys(e.temperatures),...Object.keys(H.temperatures)]);return e.name.trim()===H.name.trim()&&[...C].every(V=>e.temperatures[V]===H.temperatures[V])}function F0(e){return Math.min(30,Math.max(5,Math.round(e*2)/2))}var V5=class extends l{constructor(){super();this.revision=-1;this.base={};this.reportedUnsaved=!1;this.drafts={},this.busy=!1}static{this.properties={hass:{attribute:!1},snapshot:{attribute:!1},drafts:{state:!0},busy:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-6, 24px);
      }
      .sets {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr));
        align-items: start;
        gap: var(--ha-space-2, 8px);
      }
      .card-content {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3, 12px);
        padding: 0 var(--ha-space-4, 16px) var(--ha-space-2, 8px);
      }
      .muted {
        color: var(--secondary-text-color);
      }
      p {
        margin: 0;
      }
      ha-settings-row {
        border-top: 1px solid var(--divider-color);
        --settings-row-prefix-display: flex;
      }
      ha-svg-icon[slot="prefix"] {
        align-self: center;
        color: var(--mode-color);
        margin-inline-end: var(--ha-space-4, 16px);
      }
      .value {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--ha-space-1, 4px);
      }
      .value ha-icon-button {
        /* As high as the − / + buttons, so a row with it is as high as the others. */
        --ha-icon-button-size: 42px;
      }
      ha-control-number-buttons {
        width: 160px;
        height: 42px;
        --control-number-buttons-border-radius: var(--ha-border-radius-lg, 12px);
      }
      .card-actions {
        display: flex;
        justify-content: space-between;
        gap: var(--ha-space-2, 8px);
        border-top: 1px solid var(--divider-color);
        padding: var(--ha-space-2, 8px);
      }
      .new {
        align-self: flex-start;
      }
      .rooms ha-settings-row:first-of-type {
        border-top: none;
      }
      ha-select {
        width: 220px;
        max-width: 100%;
      }
      ha-card {
        container-type: inline-size;
      }
      /* HA gives a row's label and its control half the width each. In a narrow card the control
         goes under the label, as in HA's own narrow layout. */
      @container (max-width: 480px) {
        ha-settings-row {
          flex-direction: column;
          align-items: stretch;
          padding-bottom: var(--ha-space-3, 12px);
          --settings-row-content-padding-block: 0;
        }
      }
    `]}get t(){return p(n(this.hass))}willUpdate(C){if(C.has("snapshot")&&this.snapshot&&this.snapshot.revision!==this.revision){this.revision=this.snapshot.revision;let V={},L={};for(let M of this.snapshot.temp_sets){let r={name:M.name,temperatures:{...M.temperatures}},o=this.drafts[M.id],i=this.base[M.id];o&&i&&!H5(o,i)?(V[M.id]=o,L[M.id]=i):(V[M.id]=r,L[M.id]=r)}this.drafts=V,this.base=L}}house(){return this.snapshot.temp_sets.find(C=>C.id==="house")?.temperatures??{}}dirty(C){let V=this.drafts[C.id],L=this.base[C.id];return!!(V&&L&&!H5(V,L))}updated(){let C=!!this.snapshot?.temp_sets.some(V=>this.dirty(V));C!==this.reportedUnsaved&&(this.reportedUnsaved=C,A1(this,C))}patch(C,V){this.drafts={...this.drafts,[C]:V(this.drafts[C])}}setValue(C,V,L){this.patch(C,M=>{let r={...M.temperatures};return L===void 0?delete r[V]:r[V]=F0(L),{...M,temperatures:r}})}roomNames(C=[]){return C.map(V=>this.snapshot.rooms.find(L=>L.id===V)?.name).filter(Boolean).join(", ")}async assign(C,V){await this.run("room/save",{room:N(C,{temp_set_id:V})})}async run(C,V){this.busy=!0;try{return await x(this.hass).call(C,{revision:this.snapshot.revision,...V}),!0}catch(L){return h(this,Z(L,this.t)),!1}finally{this.busy=!1}}async save(C){let V=this.drafts[C.id],L=this.base[C.id],M={name:C.name,temperatures:C.temperatures};if(L&&!H5(M,L)&&!await G(this,this.t)){this.drafts={...this.drafts,[C.id]:M},this.base={...this.base,[C.id]:M};return}await this.run("temp_set/save",{temp_set:{id:C.id,name:V.name.trim(),temperatures:V.temperatures}})&&(this.base={...this.base,[C.id]:{...V,name:V.name.trim()}})}async deleteSet(C){let V=this.t,L=this.roomNames(C.used_by);await f(this,{heading:V("common.delete"),message:L?V("temps.delete_confirm_used",{name:C.name,rooms:L}):V("temps.delete_confirm",{name:C.name}),confirm:V("common.delete"),cancel:V("common.cancel"),danger:!0})&&await this.run("temp_set/delete",{temp_set_id:C.id})}async createSet(){let C=this.t,L=(await K1(this,{heading:C("temps.new"),label:C("plans.name"),value:V1(C("temps.new"),this.snapshot.temp_sets.map(M=>M.name)),confirm:C("plans.create"),cancel:C("common.cancel")}))?.trim();L&&await this.run("temp_set/save",{temp_set:{name:L,temperatures:{}}})}number(C,V,L){return t`<ha-control-number-buttons
      .value=${L}
      .min=${5}
      .max=${30}
      .step=${.5}
      .unit=${"\xB0C"}
      .formatOptions=${{minimumFractionDigits:1,maximumFractionDigits:1}}
      .locale=${this.hass.locale}
      .label=${this.t(`mode.${V}`)}
      @value-changed=${M=>this.setValue(C,V,M.detail.value)}
    ></ha-control-number-buttons>`}renderSet(C){let V=this.t,L=this.drafts[C.id];if(!L)return a;let M=this.house(),r=C.id==="house";return t`<ha-card .header=${r?V("temps.house"):C.name}>
      <div class="card-content">
        ${r?t`<p class="muted">${V("temps.house_hint")}</p>`:t`<p class="muted">
                ${C.used_by?.length?V("temps.used_by",{rooms:this.roomNames(C.used_by)}):V("temps.unused")}
              </p>
              <ha-input
                .label=${V("plans.name")}
                .value=${L.name}
                maxlength="60"
                @input=${o=>this.patch(C.id,i=>({...i,name:o.target.value}))}
              ></ha-input>`}
      </div>
      ${b3.map(o=>{let i=L.temperatures[o],d=M[o]??20;return t`<ha-settings-row style="--mode-color:${P[o]}">
          <ha-svg-icon slot="prefix" .path=${B[o]}></ha-svg-icon>
          <span slot="heading">${V(`mode.${o}`)}</span>
          ${r?a:t`<span slot="description">${V(i===void 0?"temps.as_house":"temps.own")}</span>`}
          <div class="value">
            ${r||i===void 0?a:t`<ha-icon-button
                  .path=${Q5}
                  .label=${V("temps.use_house")}
                  title=${V("temps.use_house")}
                  @click=${()=>this.setValue(C.id,o,void 0)}
                ></ha-icon-button>`}
            ${this.number(C.id,o,i??d)}
          </div>
        </ha-settings-row>`})}
      <div class="card-actions">
        ${r?t`<span></span>`:t`<ha-button appearance="plain" variant="danger" .disabled=${this.busy} @click=${()=>this.deleteSet(C)}>
              <ha-svg-icon slot="start" .path=${_}></ha-svg-icon>${V("common.delete")}
            </ha-button>`}
        <ha-button .disabled=${this.busy||!this.dirty(C)} @click=${()=>{this.save(C)}}>
          ${V("common.save")}
        </ha-button>
      </div>
    </ha-card>`}render(){if(!this.snapshot||!this.hass)return a;let C=this.t,[V,...L]=[...this.snapshot.temp_sets.filter(r=>r.id==="house"),...this.snapshot.temp_sets.filter(r=>r.id!=="house")],M=this.snapshot.temp_sets.map(r=>({value:r.id,label:r.id==="house"?C("temps.house"):r.name}));return t`
      <p class="muted">${C("temps.sets_hint")} ${C("temps.save_hint")}</p>
      <div class="sets">${V?this.renderSet(V):a} ${L.map(r=>this.renderSet(r))}</div>
      <ha-button class="new" .disabled=${this.busy} @click=${this.createSet}>
        <ha-svg-icon slot="start" .path=${D}></ha-svg-icon>${C("temps.new")}
      </ha-button>
      ${this.snapshot.rooms.length?t`<ha-card class="rooms" .header=${C("temps.rooms_title")}>
            ${this.snapshot.rooms.map(r=>t`<ha-settings-row>
                <span slot="heading">${r.name}</span>
                <ha-select
                  .label=${C("adv.rooms.temp_set")}
                  .options=${M}
                  .value=${r.temp_set_id}
                  .disabled=${this.busy}
                  @selected=${o=>{o.detail.value&&o.detail.value!==r.temp_set_id&&this.assign(r,o.detail.value)}}
                ></ha-select>
              </ha-settings-row>`)}
          </ha-card>`:a}
    `}};s("hs-temps-view",V5);function L5(e){return e.startsWith("/plans")?"plans":e.startsWith("/temperatures")?"temperatures":e.startsWith("/advanced")?"advanced":"home"}var e5=class extends l{constructor(){super();this.unsubscribe=null;this.timers=[];this.clock=null;this.unsaved=new Set;this.shownPath=null;this.snapshot=null,this.waitedTooLong=!1,this.ready=!1,this.tick=0,this.addEventListener("hs-navigate",C=>this.navigate(C.detail)),this.addEventListener(R2,C=>{let V=C.composedPath()[0];C.detail?this.unsaved.add(V):this.unsaved.delete(V)}),s2(u3).then(C=>{C.length&&console.warn(`Heating Scheduler: Home Assistant did not load ${C.join(", ")}`),this.ready=!0})}static{this.properties={hass:{attribute:!1},narrow:{type:Boolean},route:{attribute:!1},panel:{attribute:!1},snapshot:{state:!0},waitedTooLong:{state:!0},ready:{state:!0},tick:{state:!0}}}static{this.styles=[c,m`
      :host {
        display: block;
        height: 100%;
      }
      .content {
        max-width: 1280px;
        margin: 0 auto;
        padding: var(--ha-space-4, 16px);
        box-sizing: border-box;
      }
      .status {
        padding: var(--ha-space-8, 32px) var(--ha-space-4, 16px);
        text-align: center;
        color: var(--secondary-text-color);
      }
    `]}connectedCallback(){super.connectedCallback(),this.clock=setInterval(()=>this.tick+=1,3e4),this.hass&&this.subscribe()}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.(),this.unsubscribe=null,this.clock&&clearInterval(this.clock);for(let C of this.timers)clearTimeout(C);this.timers=[]}willUpdate(C){C.has("hass")&&this.hass&&!this.unsubscribe&&this.isConnected&&this.subscribe(),C.has("route")&&this.routeChanged()}hasUnsaved(){for(let C of this.unsaved)C.isConnected||this.unsaved.delete(C);return this.unsaved.size>0}routeChanged(){let C=this.route?.path??"",V=this.shownPath;if(V!==null&&L5(C)!==L5(V)&&this.hasUnsaved()){Promise.resolve().then(()=>{history.replaceState(null,"",`${this.urlPrefix}${V}`),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!0}}))}),this.askToLeave(C);return}this.shownPath=C}async askToLeave(C){let V=p(n(this.hass));await f(this,{heading:V("common.unsaved_title"),message:V("editor.discard"),confirm:V("editor.discard_button"),cancel:V("common.back"),danger:!0})&&(this.unsaved.clear(),this.navigate(C))}subscribe(){this.unsubscribe=x(this.hass).subscribe(C=>{this.snapshot=C}),this.timers.push(setTimeout(()=>this.waitedTooLong=this.snapshot===null,8e3))}get urlPrefix(){return this.route?.prefix??"/heating-scheduler"}navigate(C){history.pushState(null,"",`${this.urlPrefix}${C}`),window.dispatchEvent(new CustomEvent("location-changed",{detail:{replace:!1}}))}get path(){return this.shownPath??this.route?.path??""}get tab(){return L5(this.path)}view(){let C=p(n(this.hass));if(!this.snapshot)return t`<div class="status">${this.waitedTooLong?C("common.not_loaded"):C("common.loading")}</div>`;let V=this.path.split("/").filter(Boolean);switch(this.tab){case"plans":return t`<hs-plans-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .planId=${V[1]??null}
        ></hs-plans-view>`;case"temperatures":return t`<hs-temps-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-temps-view>`;case"advanced":return t`<hs-advanced-view
          .hass=${this.hass}
          .snapshot=${this.snapshot}
          .section=${V[1]??""}
        ></hs-advanced-view>`;default:return t`<hs-home-view .hass=${this.hass} .snapshot=${this.snapshot}></hs-home-view>`}}render(){if(!this.hass||!this.ready)return a;let C=p(n(this.hass)),V=this.urlPrefix,L=[{path:`${V}/overview`,name:C("nav.home"),iconPath:q5},{path:`${V}/plans`,name:C("nav.plans"),iconPath:g5},{path:`${V}/temperatures`,name:C("nav.temps"),iconPath:K5},{path:`${V}/advanced`,name:C("nav.advanced"),iconPath:j5}],M={prefix:V,path:this.tab==="home"?"/overview":this.path};return t`
      <hass-tabs-subpage .hass=${this.hass} .route=${M} .tabs=${L} main-page>
        <span slot="header">${C("app.title")}</span>
        <div class="content" data-tick=${this.tick}>${this.view()}</div>
      </hass-tabs-subpage>
    `}};s("heating-scheduler-panel",e5);export{e5 as HeatingSchedulerPanel};
