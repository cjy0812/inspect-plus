import{d as $e,as as St,h as u,ay as Cn,bg as Sn,o as Ze,r as D,bh as ft,ar as Ve,bi as Vt,ac as We,ab as jt,ag as vt,ae as kn,T as Ut,a as A,X as G,b as ge,c as Re,W as xt,bj as Wt,b2 as Ot,N as _n,a6 as Fn,am as On,u as kt,Z as Kt,e as Ke,i as W,g as _t,aq as se,bk as Rn,an as Tn,j as Le,al as Ge,$ as Rt,bl as Mn,K as Ue,w as yt,bm as In,aT as Pn,aU as zn,bn as Tt,ap as Mt,b1 as $n,bo as Nn,bp as Bn,bq as An,br as Dn,at as Fe,n as Ae,aV as we,l as En,a_ as Ln,aY as Vn,m as jn,v as It,x as Oe,z as C,y as M,A as x,aQ as Un,D as w,L as ot,G as Wn,I as Q,E as Kn,_ as Hn,C as pt,F as qn,H as ce,J as re,B as lt,M as ht,O as Gn,S as Yn}from"./index-DpSxqACn.js";import{V as Zn,N as Jn,a as Qn,c as Xn,_ as Pt,b as zt,l as eo}from"./error-WTtG8qIT.js";import{_ as at,u as to,b as no}from"./snapshotGroup-CYYIRY6i.js";import{i as Ye,u as He,a as oo,_ as lo,c as io,b as ao,d as gt,p as qe,o as ro,n as so,w as $t,k as uo,s as Nt,j as co}from"./dayjs.min-Bh5nZooB.js";import{e as fo,a as it,b as je,p as vo}from"./snapshot-CyfOpMMX.js";import{i as po,j as ho,k as Ft,m as go,_ as Ht,B as bo,V as mo,n as wo,o as Ct,u as xo,g as bt,b as Bt,a as yo}from"./node-BsFAV10a.js";import{N as Co,u as So,_ as ko}from"./Input-BdV2n3Or.js";const ze="v-hidden",_o=po("[v-hidden]",{display:"none!important"}),At=$e({name:"Overflow",props:{getCounter:Function,getTail:Function,updateCounter:Function,onUpdateCount:Function,onUpdateOverflow:Function},setup(e,{slots:s}){const i=D(null),c=D(null);function f(m){const{value:r}=i,{getCounter:g,getTail:O}=e;let h;if(g!==void 0?h=g():h=c.value,!r||!h)return;h.hasAttribute(ze)&&h.removeAttribute(ze);const{children:L}=r;if(m.showAllItemsBeforeCalculate)for(const T of L)T.hasAttribute(ze)&&T.removeAttribute(ze);const S=r.offsetWidth,F=[],y=s.tail?O==null?void 0:O():null;let j=y?y.offsetWidth:0,Z=!1;const z=r.children.length-(s.tail?1:0);for(let T=0;T<z-1;++T){if(T<0)continue;const V=L[T];if(Z){V.hasAttribute(ze)||V.setAttribute(ze,"");continue}else V.hasAttribute(ze)&&V.removeAttribute(ze);const K=V.offsetWidth;if(j+=K,F[T]=K,j>S){const{updateCounter:ne}=e;for(let J=T;J>=0;--J){const fe=z-1-J;ne!==void 0?ne(fe):h.textContent=`${fe}`;const ve=h.offsetWidth;if(j-=F[J],j+ve<=S||J===0){Z=!0,T=J-1,y&&(T===-1?(y.style.maxWidth=`${S-ve}px`,y.style.boxSizing="border-box"):y.style.maxWidth="");const{onUpdateCount:oe}=e;oe&&oe(fe);break}}}}const{onUpdateOverflow:R}=e;Z?R!==void 0&&R(!0):(R!==void 0&&R(!1),h.setAttribute(ze,""))}const b=Sn();return _o.mount({id:"vueuc/overflow",head:!0,anchorMetaName:ho,ssr:b}),Ze(()=>f({showAllItemsBeforeCalculate:!1})),{selfRef:i,counterRef:c,sync:f}},render(){const{$slots:e}=this;return St(()=>this.sync({showAllItemsBeforeCalculate:!1})),u("div",{class:"v-overflow",ref:"selfRef"},[Cn(e,"default"),e.counter?e.counter():u("span",{style:{display:"inline-block"},ref:"counterRef"}),e.tail?e.tail():null])}});function qt(e,s){s&&(Ze(()=>{const{value:i}=e;i&&ft.registerHandler(i,s)}),Ve(e,(i,c)=>{c&&ft.unregisterHandler(c)},{deep:!1}),Vt(()=>{const{value:i}=e;i&&ft.unregisterHandler(i)}))}function Dt(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function mt(e){const s=e.filter(i=>i!==void 0);if(s.length!==0)return s.length===1?s[0]:i=>{e.forEach(c=>{c&&c(i)})}}const Fo=$e({name:"Checkmark",render(){return u("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},u("g",{fill:"none"},u("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}}),Oo=$e({props:{onFocus:Function,onBlur:Function},setup(e){return()=>u("div",{style:"width: 0; height: 0",tabindex:0,onFocus:e.onFocus,onBlur:e.onBlur})}}),Et=$e({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:s,labelFieldRef:i,nodePropsRef:c}=jt(Ft);return{labelField:i,nodeProps:c,renderLabel:e,renderOption:s}},render(){const{clsPrefix:e,renderLabel:s,renderOption:i,nodeProps:c,tmNode:{rawNode:f}}=this,b=c==null?void 0:c(f),m=s?s(f,!1):We(f[this.labelField],f,!1),r=u("div",Object.assign({},b,{class:[`${e}-base-select-group-header`,b==null?void 0:b.class]}),m);return f.render?f.render({node:r,option:f}):i?i({node:r,option:f,selected:!1}):r}});function Ro(e,s){return u(Ut,{name:"fade-in-scale-up-transition"},{default:()=>e?u(kn,{clsPrefix:s,class:`${s}-base-select-option__check`},{default:()=>u(Fo)}):null})}const Lt=$e({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:s,pendingTmNodeRef:i,multipleRef:c,valueSetRef:f,renderLabelRef:b,renderOptionRef:m,labelFieldRef:r,valueFieldRef:g,showCheckmarkRef:O,nodePropsRef:h,handleOptionClick:L,handleOptionMouseEnter:S}=jt(Ft),F=vt(()=>{const{value:z}=i;return z?e.tmNode.key===z.key:!1});function y(z){const{tmNode:R}=e;R.disabled||L(z,R)}function j(z){const{tmNode:R}=e;R.disabled||S(z,R)}function Z(z){const{tmNode:R}=e,{value:T}=F;R.disabled||T||S(z,R)}return{multiple:c,isGrouped:vt(()=>{const{tmNode:z}=e,{parent:R}=z;return R&&R.rawNode.type==="group"}),showCheckmark:O,nodeProps:h,isPending:F,isSelected:vt(()=>{const{value:z}=s,{value:R}=c;if(z===null)return!1;const T=e.tmNode.rawNode[g.value];if(R){const{value:V}=f;return V.has(T)}else return z===T}),labelField:r,renderLabel:b,renderOption:m,handleMouseMove:Z,handleMouseEnter:j,handleClick:y}},render(){const{clsPrefix:e,tmNode:{rawNode:s},isSelected:i,isPending:c,isGrouped:f,showCheckmark:b,nodeProps:m,renderOption:r,renderLabel:g,handleClick:O,handleMouseEnter:h,handleMouseMove:L}=this,S=Ro(i,e),F=g?[g(s,i),b&&S]:[We(s[this.labelField],s,i),b&&S],y=m==null?void 0:m(s),j=u("div",Object.assign({},y,{class:[`${e}-base-select-option`,s.class,y==null?void 0:y.class,{[`${e}-base-select-option--disabled`]:s.disabled,[`${e}-base-select-option--selected`]:i,[`${e}-base-select-option--grouped`]:f,[`${e}-base-select-option--pending`]:c,[`${e}-base-select-option--show-checkmark`]:b}],style:[(y==null?void 0:y.style)||"",s.style||""],onClick:mt([O,y==null?void 0:y.onClick]),onMouseenter:mt([h,y==null?void 0:y.onMouseenter]),onMousemove:mt([L,y==null?void 0:y.onMousemove])}),u("div",{class:`${e}-base-select-option__content`},F));return s.render?s.render({node:j,option:s,selected:i}):r?r({node:j,option:s,selected:i}):j}}),To=A("base-select-menu",`
 line-height: 1.5;
 outline: none;
 z-index: 0;
 position: relative;
 border-radius: var(--n-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-color);
`,[A("scrollbar",`
 max-height: var(--n-height);
 `),A("virtual-list",`
 max-height: var(--n-height);
 `),A("base-select-option",`
 min-height: var(--n-option-height);
 font-size: var(--n-option-font-size);
 display: flex;
 align-items: center;
 `,[G("content",`
 z-index: 1;
 white-space: nowrap;
 text-overflow: ellipsis;
 overflow: hidden;
 `)]),A("base-select-group-header",`
 min-height: var(--n-option-height);
 font-size: .93em;
 display: flex;
 align-items: center;
 `),A("base-select-menu-option-wrapper",`
 position: relative;
 width: 100%;
 `),G("loading, empty",`
 display: flex;
 padding: 12px 32px;
 flex: 1;
 justify-content: center;
 `),G("loading",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 `),G("header",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-bottom: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),G("action",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-top: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),A("base-select-group-header",`
 position: relative;
 cursor: default;
 padding: var(--n-option-padding);
 color: var(--n-group-header-text-color);
 `),A("base-select-option",`
 cursor: pointer;
 position: relative;
 padding: var(--n-option-padding);
 transition:
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 box-sizing: border-box;
 color: var(--n-option-text-color);
 opacity: 1;
 `,[ge("show-checkmark",`
 padding-right: calc(var(--n-option-padding-right) + 20px);
 `),Re("&::before",`
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),Re("&:active",`
 color: var(--n-option-text-color-pressed);
 `),ge("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),ge("pending",[Re("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),ge("selected",`
 color: var(--n-option-text-color-active);
 `,[Re("&::before",`
 background-color: var(--n-option-color-active);
 `),ge("pending",[Re("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),ge("disabled",`
 cursor: not-allowed;
 `,[xt("selected",`
 color: var(--n-option-text-color-disabled);
 `),ge("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),G("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[Wt({enterScale:"0.5"})])])]),Mo=$e({name:"InternalSelectMenu",props:Object.assign(Object.assign({},Ke.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,onToggle:Function}),setup(e){const{mergedClsPrefixRef:s,mergedRtlRef:i}=kt(e),c=Kt("InternalSelectMenu",i,s),f=Ke("InternalSelectMenu","-internal-select-menu",To,Rn,e,se(e,"clsPrefix")),b=D(null),m=D(null),r=D(null),g=W(()=>e.treeMate.getFlattenedNodes()),O=W(()=>Qn(g.value)),h=D(null);function L(){const{treeMate:a}=e;let p=null;const{value:E}=e;E===null?p=a.getFirstAvailableNode():(e.multiple?p=a.getNode((E||[])[(E||[]).length-1]):p=a.getNode(E),(!p||p.disabled)&&(p=a.getFirstAvailableNode())),pe(p||null)}function S(){const{value:a}=h;a&&!e.treeMate.getNode(a.key)&&(h.value=null)}let F;Ve(()=>e.show,a=>{a?F=Ve(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?L():S(),St(ke)):S()},{immediate:!0}):F==null||F()},{immediate:!0}),Vt(()=>{F==null||F()});const y=W(()=>Tn(f.value.self[Le("optionHeight",e.size)])),j=W(()=>Ge(f.value.self[Le("padding",e.size)])),Z=W(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),z=W(()=>{const a=g.value;return a&&a.length===0});function R(a){const{onToggle:p}=e;p&&p(a)}function T(a){const{onScroll:p}=e;p&&p(a)}function V(a){var p;(p=r.value)===null||p===void 0||p.sync(),T(a)}function K(){var a;(a=r.value)===null||a===void 0||a.sync()}function ne(){const{value:a}=h;return a||null}function J(a,p){p.disabled||pe(p,!1)}function fe(a,p){p.disabled||R(p)}function ve(a){var p;Ye(a,"action")||(p=e.onKeyup)===null||p===void 0||p.call(e,a)}function oe(a){var p;Ye(a,"action")||(p=e.onKeydown)===null||p===void 0||p.call(e,a)}function be(a){var p;(p=e.onMousedown)===null||p===void 0||p.call(e,a),!e.focusable&&a.preventDefault()}function me(){const{value:a}=h;a&&pe(a.getNext({loop:!0}),!0)}function Y(){const{value:a}=h;a&&pe(a.getPrev({loop:!0}),!0)}function pe(a,p=!1){h.value=a,p&&ke()}function ke(){var a,p;const E=h.value;if(!E)return;const he=O.value(E.key);he!==null&&(e.virtualScroll?(a=m.value)===null||a===void 0||a.scrollTo({index:he}):(p=r.value)===null||p===void 0||p.scrollTo({index:he,elSize:y.value}))}function xe(a){var p,E;!((p=b.value)===null||p===void 0)&&p.contains(a.target)&&((E=e.onFocus)===null||E===void 0||E.call(e,a))}function ye(a){var p,E;!((p=b.value)===null||p===void 0)&&p.contains(a.relatedTarget)||(E=e.onBlur)===null||E===void 0||E.call(e,a)}Rt(Ft,{handleOptionMouseEnter:J,handleOptionClick:fe,valueSetRef:Z,pendingTmNodeRef:h,nodePropsRef:se(e,"nodeProps"),showCheckmarkRef:se(e,"showCheckmark"),multipleRef:se(e,"multiple"),valueRef:se(e,"value"),renderLabelRef:se(e,"renderLabel"),renderOptionRef:se(e,"renderOption"),labelFieldRef:se(e,"labelField"),valueFieldRef:se(e,"valueField")}),Rt(go,b),Ze(()=>{const{value:a}=r;a&&a.sync()});const le=W(()=>{const{size:a}=e,{common:{cubicBezierEaseInOut:p},self:{height:E,borderRadius:he,color:l,groupHeaderTextColor:n,actionDividerColor:U,optionTextColorPressed:k,optionTextColor:ie,optionTextColorDisabled:H,optionTextColorActive:ae,optionOpacityDisabled:Te,optionCheckColor:Se,actionTextColor:De,optionColorPending:Me,optionColorActive:ue,loadingColor:Ie,loadingSize:Ee,optionColorActivePending:Ne,[Le("optionFontSize",a)]:Pe,[Le("optionHeight",a)]:q,[Le("optionPadding",a)]:I}}=f.value;return{"--n-height":E,"--n-action-divider-color":U,"--n-action-text-color":De,"--n-bezier":p,"--n-border-radius":he,"--n-color":l,"--n-option-font-size":Pe,"--n-group-header-text-color":n,"--n-option-check-color":Se,"--n-option-color-pending":Me,"--n-option-color-active":ue,"--n-option-color-active-pending":Ne,"--n-option-height":q,"--n-option-opacity-disabled":Te,"--n-option-text-color":ie,"--n-option-text-color-active":ae,"--n-option-text-color-disabled":H,"--n-option-text-color-pressed":k,"--n-option-padding":I,"--n-option-padding-left":Ge(I,"left"),"--n-option-padding-right":Ge(I,"right"),"--n-loading-color":Ie,"--n-loading-size":Ee}}),{inlineThemeDisabled:Ce}=e,X=Ce?_t("internal-select-menu",W(()=>e.size[0]),le,e):void 0,de={selfRef:b,next:me,prev:Y,getPendingTmNode:ne};return qt(b,e.onResize),Object.assign({mergedTheme:f,mergedClsPrefix:s,rtlEnabled:c,virtualListRef:m,scrollbarRef:r,itemSize:y,padding:j,flattenedNodes:g,empty:z,virtualListContainer(){const{value:a}=m;return a==null?void 0:a.listElRef},virtualListContent(){const{value:a}=m;return a==null?void 0:a.itemsElRef},doScroll:T,handleFocusin:xe,handleFocusout:ye,handleKeyUp:ve,handleKeyDown:oe,handleMouseDown:be,handleVirtualListResize:K,handleVirtualListScroll:V,cssVars:Ce?void 0:le,themeClass:X==null?void 0:X.themeClass,onRender:X==null?void 0:X.onRender},de)},render(){const{$slots:e,virtualScroll:s,clsPrefix:i,mergedTheme:c,themeClass:f,onRender:b}=this;return b==null||b(),u("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${i}-base-select-menu`,this.rtlEnabled&&`${i}-base-select-menu--rtl`,f,this.multiple&&`${i}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},Ot(e.header,m=>m&&u("div",{class:`${i}-base-select-menu__header`,"data-header":!0,key:"header"},m)),this.loading?u("div",{class:`${i}-base-select-menu__loading`},u(_n,{clsPrefix:i,strokeWidth:20})):this.empty?u("div",{class:`${i}-base-select-menu__empty`,"data-empty":!0},On(e.empty,()=>[u(Jn,{theme:c.peers.Empty,themeOverrides:c.peerOverrides.Empty,size:this.size})])):u(Fn,{ref:"scrollbarRef",theme:c.peers.Scrollbar,themeOverrides:c.peerOverrides.Scrollbar,scrollable:this.scrollable,container:s?this.virtualListContainer:void 0,content:s?this.virtualListContent:void 0,onScroll:s?void 0:this.doScroll},{default:()=>s?u(Zn,{ref:"virtualListRef",class:`${i}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:m})=>m.isGroup?u(Et,{key:m.key,clsPrefix:i,tmNode:m}):m.ignored?null:u(Lt,{clsPrefix:i,key:m.key,tmNode:m})}):u("div",{class:`${i}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(m=>m.isGroup?u(Et,{key:m.key,clsPrefix:i,tmNode:m}):u(Lt,{clsPrefix:i,key:m.key,tmNode:m})))}),Ot(e.action,m=>m&&[u("div",{class:`${i}-base-select-menu__action`,"data-action":!0,key:"action"},m),u(Oo,{onFocus:this.onTabOut,key:"focus-detector"})]))}}),Io=Re([A("base-selection",`
 --n-padding-single: var(--n-padding-single-top) var(--n-padding-single-right) var(--n-padding-single-bottom) var(--n-padding-single-left);
 --n-padding-multiple: var(--n-padding-multiple-top) var(--n-padding-multiple-right) var(--n-padding-multiple-bottom) var(--n-padding-multiple-left);
 position: relative;
 z-index: auto;
 box-shadow: none;
 width: 100%;
 max-width: 100%;
 display: inline-block;
 vertical-align: bottom;
 border-radius: var(--n-border-radius);
 min-height: var(--n-height);
 line-height: 1.5;
 font-size: var(--n-font-size);
 `,[A("base-loading",`
 color: var(--n-loading-color);
 `),A("base-selection-tags","min-height: var(--n-height);"),G("border, state-border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 pointer-events: none;
 border: var(--n-border);
 border-radius: inherit;
 transition:
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),G("state-border",`
 z-index: 1;
 border-color: #0000;
 `),A("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[G("arrow",`
 font-size: var(--n-arrow-size);
 color: var(--n-arrow-color);
 transition: color .3s var(--n-bezier);
 `)]),A("base-selection-overlay",`
 display: flex;
 align-items: center;
 white-space: nowrap;
 pointer-events: none;
 position: absolute;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 padding: var(--n-padding-single);
 transition: color .3s var(--n-bezier);
 `,[G("wrapper",`
 flex-basis: 0;
 flex-grow: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 `)]),A("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `,[G("inner",`
 max-width: 100%;
 overflow: hidden;
 `)]),A("base-selection-tags",`
 cursor: pointer;
 outline: none;
 box-sizing: border-box;
 position: relative;
 z-index: auto;
 display: flex;
 padding: var(--n-padding-multiple);
 flex-wrap: wrap;
 align-items: center;
 width: 100%;
 vertical-align: bottom;
 background-color: var(--n-color);
 border-radius: inherit;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),A("base-selection-label",`
 height: var(--n-height);
 display: inline-flex;
 width: 100%;
 vertical-align: bottom;
 cursor: pointer;
 outline: none;
 z-index: auto;
 box-sizing: border-box;
 position: relative;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 border-radius: inherit;
 background-color: var(--n-color);
 align-items: center;
 `,[A("base-selection-input",`
 font-size: inherit;
 line-height: inherit;
 outline: none;
 cursor: pointer;
 box-sizing: border-box;
 border:none;
 width: 100%;
 padding: var(--n-padding-single);
 background-color: #0000;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 caret-color: var(--n-caret-color);
 `,[G("content",`
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap; 
 `)]),G("render-label",`
 color: var(--n-text-color);
 `)]),xt("disabled",[Re("&:hover",[G("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),ge("focus",[G("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),ge("active",[G("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),A("base-selection-label","background-color: var(--n-color-active);"),A("base-selection-tags","background-color: var(--n-color-active);")])]),ge("disabled","cursor: not-allowed;",[G("arrow",`
 color: var(--n-arrow-color-disabled);
 `),A("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[A("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),G("render-label",`
 color: var(--n-text-color-disabled);
 `)]),A("base-selection-tags",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `),A("base-selection-placeholder",`
 cursor: not-allowed;
 color: var(--n-placeholder-color-disabled);
 `)]),A("base-selection-input-tag",`
 height: calc(var(--n-height) - 6px);
 line-height: calc(var(--n-height) - 6px);
 outline: none;
 display: none;
 position: relative;
 margin-bottom: 3px;
 max-width: 100%;
 vertical-align: bottom;
 `,[G("input",`
 font-size: inherit;
 font-family: inherit;
 min-width: 1px;
 padding: 0;
 background-color: #0000;
 outline: none;
 border: none;
 max-width: 100%;
 overflow: hidden;
 width: 1em;
 line-height: inherit;
 cursor: pointer;
 color: var(--n-text-color);
 caret-color: var(--n-caret-color);
 `),G("mirror",`
 position: absolute;
 left: 0;
 top: 0;
 white-space: pre;
 visibility: hidden;
 user-select: none;
 -webkit-user-select: none;
 opacity: 0;
 `)]),["warning","error"].map(e=>ge(`${e}-status`,[G("state-border",`border: var(--n-border-${e});`),xt("disabled",[Re("&:hover",[G("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),ge("active",[G("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),A("base-selection-label",`background-color: var(--n-color-active-${e});`),A("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),ge("focus",[G("state-border",`
 box-shadow: var(--n-box-shadow-focus-${e});
 border: var(--n-border-focus-${e});
 `)])])]))]),A("base-selection-popover",`
 margin-bottom: -3px;
 display: flex;
 flex-wrap: wrap;
 margin-right: -8px;
 `),A("base-selection-tag-wrapper",`
 max-width: 100%;
 display: inline-flex;
 padding: 0 7px 3px 0;
 `,[Re("&:last-child","padding-right: 0;"),A("tag",`
 font-size: 14px;
 max-width: 100%;
 `,[G("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),Po=$e({name:"InternalSelection",props:Object.assign(Object.assign({},Ke.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],ellipsisTagPopoverProps:Object,onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,ignoreComposition:{type:Boolean,default:!0},onResize:Function}),setup(e){const{mergedClsPrefixRef:s,mergedRtlRef:i}=kt(e),c=Kt("InternalSelection",i,s),f=D(null),b=D(null),m=D(null),r=D(null),g=D(null),O=D(null),h=D(null),L=D(null),S=D(null),F=D(null),y=D(!1),j=D(!1),Z=D(!1),z=Ke("InternalSelection","-internal-selection",Io,In,e,se(e,"clsPrefix")),R=W(()=>e.clearable&&!e.disabled&&(Z.value||e.active)),T=W(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):We(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),V=W(()=>{const o=e.selectedOption;if(o)return o[e.labelField]}),K=W(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function ne(){var o;const{value:v}=f;if(v){const{value:ee}=b;ee&&(ee.style.width=`${v.offsetWidth}px`,e.maxTagCount!=="responsive"&&((o=S.value)===null||o===void 0||o.sync({showAllItemsBeforeCalculate:!1})))}}function J(){const{value:o}=F;o&&(o.style.display="none")}function fe(){const{value:o}=F;o&&(o.style.display="inline-block")}Ve(se(e,"active"),o=>{o||J()}),Ve(se(e,"pattern"),()=>{e.multiple&&St(ne)});function ve(o){const{onFocus:v}=e;v&&v(o)}function oe(o){const{onBlur:v}=e;v&&v(o)}function be(o){const{onDeleteOption:v}=e;v&&v(o)}function me(o){const{onClear:v}=e;v&&v(o)}function Y(o){const{onPatternInput:v}=e;v&&v(o)}function pe(o){var v;(!o.relatedTarget||!(!((v=m.value)===null||v===void 0)&&v.contains(o.relatedTarget)))&&ve(o)}function ke(o){var v;!((v=m.value)===null||v===void 0)&&v.contains(o.relatedTarget)||oe(o)}function xe(o){me(o)}function ye(){Z.value=!0}function le(){Z.value=!1}function Ce(o){!e.active||!e.filterable||o.target!==b.value&&o.preventDefault()}function X(o){be(o)}const de=D(!1);function a(o){if(o.key==="Backspace"&&!de.value&&!e.pattern.length){const{selectedOptions:v}=e;v!=null&&v.length&&X(v[v.length-1])}}let p=null;function E(o){const{value:v}=f;if(v){const ee=o.target.value;v.textContent=ee,ne()}e.ignoreComposition&&de.value?p=o:Y(o)}function he(){de.value=!0}function l(){de.value=!1,e.ignoreComposition&&Y(p),p=null}function n(o){var v;j.value=!0,(v=e.onPatternFocus)===null||v===void 0||v.call(e,o)}function U(o){var v;j.value=!1,(v=e.onPatternBlur)===null||v===void 0||v.call(e,o)}function k(){var o,v;if(e.filterable)j.value=!1,(o=O.value)===null||o===void 0||o.blur(),(v=b.value)===null||v===void 0||v.blur();else if(e.multiple){const{value:ee}=r;ee==null||ee.blur()}else{const{value:ee}=g;ee==null||ee.blur()}}function ie(){var o,v,ee;e.filterable?(j.value=!1,(o=O.value)===null||o===void 0||o.focus()):e.multiple?(v=r.value)===null||v===void 0||v.focus():(ee=g.value)===null||ee===void 0||ee.focus()}function H(){const{value:o}=b;o&&(fe(),o.focus())}function ae(){const{value:o}=b;o&&o.blur()}function Te(o){const{value:v}=h;v&&v.setTextContent(`+${o}`)}function Se(){const{value:o}=L;return o}function De(){return b.value}let Me=null;function ue(){Me!==null&&window.clearTimeout(Me)}function Ie(){e.active||(ue(),Me=window.setTimeout(()=>{K.value&&(y.value=!0)},100))}function Ee(){ue()}function Ne(o){o||(ue(),y.value=!1)}Ve(K,o=>{o||(y.value=!1)}),Ze(()=>{yt(()=>{const o=O.value;o&&(e.disabled?o.removeAttribute("tabindex"):o.tabIndex=j.value?-1:0)})}),qt(m,e.onResize);const{inlineThemeDisabled:Pe}=e,q=W(()=>{const{size:o}=e,{common:{cubicBezierEaseInOut:v},self:{fontWeight:ee,borderRadius:st,color:dt,placeholderColor:Je,textColor:Qe,paddingSingle:Xe,paddingMultiple:ut,caretColor:ct,colorDisabled:et,textColorDisabled:Be,placeholderColorDisabled:t,colorActive:d,boxShadowFocus:_,boxShadowActive:B,boxShadowHover:$,border:P,borderFocus:N,borderHover:te,borderActive:_e,arrowColor:Yt,arrowColorDisabled:Zt,loadingColor:Jt,colorActiveWarning:Qt,boxShadowFocusWarning:Xt,boxShadowActiveWarning:en,boxShadowHoverWarning:tn,borderWarning:nn,borderFocusWarning:on,borderHoverWarning:ln,borderActiveWarning:an,colorActiveError:rn,boxShadowFocusError:sn,boxShadowActiveError:dn,boxShadowHoverError:un,borderError:cn,borderFocusError:fn,borderHoverError:vn,borderActiveError:pn,clearColor:hn,clearColorHover:gn,clearColorPressed:bn,clearSize:mn,arrowSize:wn,[Le("height",o)]:xn,[Le("fontSize",o)]:yn}}=z.value,tt=Ge(Xe),nt=Ge(ut);return{"--n-bezier":v,"--n-border":P,"--n-border-active":_e,"--n-border-focus":N,"--n-border-hover":te,"--n-border-radius":st,"--n-box-shadow-active":B,"--n-box-shadow-focus":_,"--n-box-shadow-hover":$,"--n-caret-color":ct,"--n-color":dt,"--n-color-active":d,"--n-color-disabled":et,"--n-font-size":yn,"--n-height":xn,"--n-padding-single-top":tt.top,"--n-padding-multiple-top":nt.top,"--n-padding-single-right":tt.right,"--n-padding-multiple-right":nt.right,"--n-padding-single-left":tt.left,"--n-padding-multiple-left":nt.left,"--n-padding-single-bottom":tt.bottom,"--n-padding-multiple-bottom":nt.bottom,"--n-placeholder-color":Je,"--n-placeholder-color-disabled":t,"--n-text-color":Qe,"--n-text-color-disabled":Be,"--n-arrow-color":Yt,"--n-arrow-color-disabled":Zt,"--n-loading-color":Jt,"--n-color-active-warning":Qt,"--n-box-shadow-focus-warning":Xt,"--n-box-shadow-active-warning":en,"--n-box-shadow-hover-warning":tn,"--n-border-warning":nn,"--n-border-focus-warning":on,"--n-border-hover-warning":ln,"--n-border-active-warning":an,"--n-color-active-error":rn,"--n-box-shadow-focus-error":sn,"--n-box-shadow-active-error":dn,"--n-box-shadow-hover-error":un,"--n-border-error":cn,"--n-border-focus-error":fn,"--n-border-hover-error":vn,"--n-border-active-error":pn,"--n-clear-size":mn,"--n-clear-color":hn,"--n-clear-color-hover":gn,"--n-clear-color-pressed":bn,"--n-arrow-size":wn,"--n-font-weight":ee}}),I=Pe?_t("internal-selection",W(()=>e.size[0]),q,e):void 0;return{mergedTheme:z,mergedClearable:R,mergedClsPrefix:s,rtlEnabled:c,patternInputFocused:j,filterablePlaceholder:T,label:V,selected:K,showTagsPanel:y,isComposing:de,counterRef:h,counterWrapperRef:L,patternInputMirrorRef:f,patternInputRef:b,selfRef:m,multipleElRef:r,singleElRef:g,patternInputWrapperRef:O,overflowRef:S,inputTagElRef:F,handleMouseDown:Ce,handleFocusin:pe,handleClear:xe,handleMouseEnter:ye,handleMouseLeave:le,handleDeleteOption:X,handlePatternKeyDown:a,handlePatternInputInput:E,handlePatternInputBlur:U,handlePatternInputFocus:n,handleMouseEnterCounter:Ie,handleMouseLeaveCounter:Ee,handleFocusout:ke,handleCompositionEnd:l,handleCompositionStart:he,onPopoverUpdateShow:Ne,focus:ie,focusInput:H,blur:k,blurInput:ae,updateCounter:Te,getCounter:Se,getTail:De,renderLabel:e.renderLabel,cssVars:Pe?void 0:q,themeClass:I==null?void 0:I.themeClass,onRender:I==null?void 0:I.onRender}},render(){const{status:e,multiple:s,size:i,disabled:c,filterable:f,maxTagCount:b,bordered:m,clsPrefix:r,ellipsisTagPopoverProps:g,onRender:O,renderTag:h,renderLabel:L}=this;O==null||O();const S=b==="responsive",F=typeof b=="number",y=S||F,j=u(Mn,null,{default:()=>u(Co,{clsPrefix:r,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var z,R;return(R=(z=this.$slots).arrow)===null||R===void 0?void 0:R.call(z)}})});let Z;if(s){const{labelField:z}=this,R=Y=>u("div",{class:`${r}-base-selection-tag-wrapper`,key:Y.value},h?h({option:Y,handleClose:()=>{this.handleDeleteOption(Y)}}):u(at,{size:i,closable:!Y.disabled,disabled:c,onClose:()=>{this.handleDeleteOption(Y)},internalCloseIsButtonTag:!1,internalCloseFocusable:!1},{default:()=>L?L(Y,!0):We(Y[z],Y,!0)})),T=()=>(F?this.selectedOptions.slice(0,b):this.selectedOptions).map(R),V=f?u("div",{class:`${r}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:c,value:this.pattern,autofocus:this.autofocus,class:`${r}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),u("span",{ref:"patternInputMirrorRef",class:`${r}-base-selection-input-tag__mirror`},this.pattern)):null,K=S?()=>u("div",{class:`${r}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},u(at,{size:i,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:c})):void 0;let ne;if(F){const Y=this.selectedOptions.length-b;Y>0&&(ne=u("div",{class:`${r}-base-selection-tag-wrapper`,key:"__counter__"},u(at,{size:i,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:c},{default:()=>`+${Y}`})))}const J=S?f?u(At,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:T,counter:K,tail:()=>V}):u(At,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:T,counter:K}):F&&ne?T().concat(ne):T(),fe=y?()=>u("div",{class:`${r}-base-selection-popover`},S?T():this.selectedOptions.map(R)):void 0,ve=y?Object.assign({show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover},g):null,be=(this.selected?!1:this.active?!this.pattern&&!this.isComposing:!0)?u("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`},u("div",{class:`${r}-base-selection-placeholder__inner`},this.placeholder)):null,me=f?u("div",{ref:"patternInputWrapperRef",class:`${r}-base-selection-tags`},J,S?null:V,j):u("div",{ref:"multipleElRef",class:`${r}-base-selection-tags`,tabindex:c?void 0:0},J,j);Z=u(Ue,null,y?u(Ht,Object.assign({},ve,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>me,default:fe}):me,be)}else if(f){const z=this.pattern||this.isComposing,R=this.active?!z:!this.selected,T=this.active?!1:this.selected;Z=u("div",{ref:"patternInputWrapperRef",class:`${r}-base-selection-label`,title:this.patternInputFocused?void 0:Dt(this.label)},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${r}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:c,disabled:c,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),T?u("div",{class:`${r}-base-selection-label__render-label ${r}-base-selection-overlay`,key:"input"},u("div",{class:`${r}-base-selection-overlay__wrapper`},h?h({option:this.selectedOption,handleClose:()=>{}}):L?L(this.selectedOption,!0):We(this.label,this.selectedOption,!0))):null,R?u("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${r}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,j)}else Z=u("div",{ref:"singleElRef",class:`${r}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?u("div",{class:`${r}-base-selection-input`,title:Dt(this.label),key:"input"},u("div",{class:`${r}-base-selection-input__content`},h?h({option:this.selectedOption,handleClose:()=>{}}):L?L(this.selectedOption,!0):We(this.label,this.selectedOption,!0))):u("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${r}-base-selection-placeholder__inner`},this.placeholder)),j);return u("div",{ref:"selfRef",class:[`${r}-base-selection`,this.rtlEnabled&&`${r}-base-selection--rtl`,this.themeClass,e&&`${r}-base-selection--${e}-status`,{[`${r}-base-selection--active`]:this.active,[`${r}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${r}-base-selection--disabled`]:this.disabled,[`${r}-base-selection--multiple`]:this.multiple,[`${r}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},Z,m?u("div",{class:`${r}-base-selection__border`}):null,m?u("div",{class:`${r}-base-selection__state-border`}):null)}});function rt(e){return e.type==="group"}function Gt(e){return e.type==="ignored"}function wt(e,s){try{return!!(1+s.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function zo(e,s){return{getIsGroup:rt,getIgnored:Gt,getKey(c){return rt(c)?c.name||c.key||"key-required":c[e]},getChildren(c){return c[s]}}}function $o(e,s,i,c){if(!s)return e;function f(b){if(!Array.isArray(b))return[];const m=[];for(const r of b)if(rt(r)){const g=f(r[c]);g.length&&m.push(Object.assign({},r,{[c]:g}))}else{if(Gt(r))continue;s(i,r)&&m.push(r)}return m}return f(e)}function No(e,s,i){const c=new Map;return e.forEach(f=>{rt(f)?f[i].forEach(b=>{c.set(b[s],b)}):c.set(f[s],f)}),c}const Bo=Re([A("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 font-weight: var(--n-font-weight);
 `),A("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[Wt({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]),Ao=Object.assign(Object.assign({},Ke.props),{to:Ct.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},keyboard:{type:Boolean,default:!0},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,menuSize:{type:String},filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],ellipsisTagPopoverProps:Object,consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,nodeProps:Function,ignoreComposition:{type:Boolean,default:!0},showOnFocus:Boolean,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,showCheckmark:{type:Boolean,default:!0},onChange:[Function,Array],items:Array}),Do=$e({name:"Select",props:Ao,slots:Object,setup(e){const{mergedClsPrefixRef:s,mergedBorderedRef:i,namespaceRef:c,inlineThemeDisabled:f}=kt(e),b=Ke("Select","-select",Bo,Bn,e,s),m=D(e.defaultValue),r=se(e,"value"),g=Mt(r,m),O=D(!1),h=D(""),L=xo(e,["items","options"]),S=D([]),F=D([]),y=W(()=>F.value.concat(S.value).concat(L.value)),j=W(()=>{const{filter:t}=e;if(t)return t;const{labelField:d,valueField:_}=e;return(B,$)=>{if(!$)return!1;const P=$[d];if(typeof P=="string")return wt(B,P);const N=$[_];return typeof N=="string"?wt(B,N):typeof N=="number"?wt(B,String(N)):!1}}),Z=W(()=>{if(e.remote)return L.value;{const{value:t}=y,{value:d}=h;return!d.length||!e.filterable?t:$o(t,j.value,d,e.childrenField)}}),z=W(()=>{const{valueField:t,childrenField:d}=e,_=zo(t,d);return Xn(Z.value,_)}),R=W(()=>No(y.value,e.valueField,e.childrenField)),T=D(!1),V=Mt(se(e,"show"),T),K=D(null),ne=D(null),J=D(null),{localeRef:fe}=So("Select"),ve=W(()=>{var t;return(t=e.placeholder)!==null&&t!==void 0?t:fe.value.placeholder}),oe=[],be=D(new Map),me=W(()=>{const{fallbackOption:t}=e;if(t===void 0){const{labelField:d,valueField:_}=e;return B=>({[d]:String(B),[_]:B})}return t===!1?!1:d=>Object.assign(t(d),{value:d})});function Y(t){const d=e.remote,{value:_}=be,{value:B}=R,{value:$}=me,P=[];return t.forEach(N=>{if(B.has(N))P.push(B.get(N));else if(d&&_.has(N))P.push(_.get(N));else if($){const te=$(N);te&&P.push(te)}}),P}const pe=W(()=>{if(e.multiple){const{value:t}=g;return Array.isArray(t)?Y(t):[]}return null}),ke=W(()=>{const{value:t}=g;return!e.multiple&&!Array.isArray(t)?t===null?null:Y([t])[0]||null:null}),xe=$n(e),{mergedSizeRef:ye,mergedDisabledRef:le,mergedStatusRef:Ce}=xe;function X(t,d){const{onChange:_,"onUpdate:value":B,onUpdateValue:$}=e,{nTriggerFormChange:P,nTriggerFormInput:N}=xe;_&&Fe(_,t,d),$&&Fe($,t,d),B&&Fe(B,t,d),m.value=t,P(),N()}function de(t){const{onBlur:d}=e,{nTriggerFormBlur:_}=xe;d&&Fe(d,t),_()}function a(){const{onClear:t}=e;t&&Fe(t)}function p(t){const{onFocus:d,showOnFocus:_}=e,{nTriggerFormFocus:B}=xe;d&&Fe(d,t),B(),_&&U()}function E(t){const{onSearch:d}=e;d&&Fe(d,t)}function he(t){const{onScroll:d}=e;d&&Fe(d,t)}function l(){var t;const{remote:d,multiple:_}=e;if(d){const{value:B}=be;if(_){const{valueField:$}=e;(t=pe.value)===null||t===void 0||t.forEach(P=>{B.set(P[$],P)})}else{const $=ke.value;$&&B.set($[e.valueField],$)}}}function n(t){const{onUpdateShow:d,"onUpdate:show":_}=e;d&&Fe(d,t),_&&Fe(_,t),T.value=t}function U(){le.value||(n(!0),T.value=!0,e.filterable&&Xe())}function k(){n(!1)}function ie(){h.value="",F.value=oe}const H=D(!1);function ae(){e.filterable&&(H.value=!0)}function Te(){e.filterable&&(H.value=!1,V.value||ie())}function Se(){le.value||(V.value?e.filterable?Xe():k():U())}function De(t){var d,_;!((_=(d=J.value)===null||d===void 0?void 0:d.selfRef)===null||_===void 0)&&_.contains(t.relatedTarget)||(O.value=!1,de(t),k())}function Me(t){p(t),O.value=!0}function ue(){O.value=!0}function Ie(t){var d;!((d=K.value)===null||d===void 0)&&d.$el.contains(t.relatedTarget)||(O.value=!1,de(t),k())}function Ee(){var t;(t=K.value)===null||t===void 0||t.focus(),k()}function Ne(t){var d;V.value&&(!((d=K.value)===null||d===void 0)&&d.$el.contains(An(t))||k())}function Pe(t){if(!Array.isArray(t))return[];if(me.value)return Array.from(t);{const{remote:d}=e,{value:_}=R;if(d){const{value:B}=be;return t.filter($=>_.has($)||B.has($))}else return t.filter(B=>_.has(B))}}function q(t){I(t.rawNode)}function I(t){if(le.value)return;const{tag:d,remote:_,clearFilterAfterSelect:B,valueField:$}=e;if(d&&!_){const{value:P}=F,N=P[0]||null;if(N){const te=S.value;te.length?te.push(N):S.value=[N],F.value=oe}}if(_&&be.value.set(t[$],t),e.multiple){const P=Pe(g.value),N=P.findIndex(te=>te===t[$]);if(~N){if(P.splice(N,1),d&&!_){const te=o(t[$]);~te&&(S.value.splice(te,1),B&&(h.value=""))}}else P.push(t[$]),B&&(h.value="");X(P,Y(P))}else{if(d&&!_){const P=o(t[$]);~P?S.value=[S.value[P]]:S.value=oe}Qe(),k(),X(t[$],t)}}function o(t){return S.value.findIndex(_=>_[e.valueField]===t)}function v(t){V.value||U();const{value:d}=t.target;h.value=d;const{tag:_,remote:B}=e;if(E(d),_&&!B){if(!d){F.value=oe;return}const{onCreate:$}=e,P=$?$(d):{[e.labelField]:d,[e.valueField]:d},{valueField:N,labelField:te}=e;L.value.some(_e=>_e[N]===P[N]||_e[te]===P[te])||S.value.some(_e=>_e[N]===P[N]||_e[te]===P[te])?F.value=oe:F.value=[P]}}function ee(t){t.stopPropagation();const{multiple:d}=e;!d&&e.filterable&&k(),a(),d?X([],[]):X(null,null)}function st(t){!Ye(t,"action")&&!Ye(t,"empty")&&!Ye(t,"header")&&t.preventDefault()}function dt(t){he(t)}function Je(t){var d,_,B,$,P;if(!e.keyboard){t.preventDefault();return}switch(t.key){case" ":if(e.filterable)break;t.preventDefault();case"Enter":if(!(!((d=K.value)===null||d===void 0)&&d.isComposing)){if(V.value){const N=(_=J.value)===null||_===void 0?void 0:_.getPendingTmNode();N?q(N):e.filterable||(k(),Qe())}else if(U(),e.tag&&H.value){const N=F.value[0];if(N){const te=N[e.valueField],{value:_e}=g;e.multiple&&Array.isArray(_e)&&_e.includes(te)||I(N)}}}t.preventDefault();break;case"ArrowUp":if(t.preventDefault(),e.loading)return;V.value&&((B=J.value)===null||B===void 0||B.prev());break;case"ArrowDown":if(t.preventDefault(),e.loading)return;V.value?($=J.value)===null||$===void 0||$.next():U();break;case"Escape":V.value&&(Dn(t),k()),(P=K.value)===null||P===void 0||P.focus();break}}function Qe(){var t;(t=K.value)===null||t===void 0||t.focus()}function Xe(){var t;(t=K.value)===null||t===void 0||t.focusInput()}function ut(){var t;V.value&&((t=ne.value)===null||t===void 0||t.syncPosition())}l(),Ve(se(e,"options"),l);const ct={focus:()=>{var t;(t=K.value)===null||t===void 0||t.focus()},focusInput:()=>{var t;(t=K.value)===null||t===void 0||t.focusInput()},blur:()=>{var t;(t=K.value)===null||t===void 0||t.blur()},blurInput:()=>{var t;(t=K.value)===null||t===void 0||t.blurInput()}},et=W(()=>{const{self:{menuBoxShadow:t}}=b.value;return{"--n-menu-box-shadow":t}}),Be=f?_t("select",void 0,et,e):void 0;return Object.assign(Object.assign({},ct),{mergedStatus:Ce,mergedClsPrefix:s,mergedBordered:i,namespace:c,treeMate:z,isMounted:Nn(),triggerRef:K,menuRef:J,pattern:h,uncontrolledShow:T,mergedShow:V,adjustedTo:Ct(e),uncontrolledValue:m,mergedValue:g,followerRef:ne,localizedPlaceholder:ve,selectedOption:ke,selectedOptions:pe,mergedSize:ye,mergedDisabled:le,focused:O,activeWithoutMenuOpen:H,inlineThemeDisabled:f,onTriggerInputFocus:ae,onTriggerInputBlur:Te,handleTriggerOrMenuResize:ut,handleMenuFocus:ue,handleMenuBlur:Ie,handleMenuTabOut:Ee,handleTriggerClick:Se,handleToggle:q,handleDeleteOption:I,handlePatternInput:v,handleClear:ee,handleTriggerBlur:De,handleTriggerFocus:Me,handleKeydown:Je,handleMenuAfterLeave:ie,handleMenuClickOutside:Ne,handleMenuScroll:dt,handleMenuKeydown:Je,handleMenuMousedown:st,mergedTheme:b,cssVars:f?void 0:et,themeClass:Be==null?void 0:Be.themeClass,onRender:Be==null?void 0:Be.onRender})},render(){return u("div",{class:`${this.mergedClsPrefix}-select`},u(bo,null,{default:()=>[u(mo,null,{default:()=>u(Po,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,ellipsisTagPopoverProps:this.ellipsisTagPopoverProps,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize,ignoreComposition:this.ignoreComposition},{arrow:()=>{var e,s;return[(s=(e=this.$slots).arrow)===null||s===void 0?void 0:s.call(e)]}})}),u(wo,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===Ct.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>u(Ut,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,s,i;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),Pn(u(Mo,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(s=this.menuProps)===null||s===void 0?void 0:s.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,nodeProps:this.nodeProps,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:this.menuSize,renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(i=this.menuProps)===null||i===void 0?void 0:i.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.showCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange}),{empty:()=>{var c,f;return[(f=(c=this.$slots).empty)===null||f===void 0?void 0:f.call(c)]},header:()=>{var c,f;return[(f=(c=this.$slots).header)===null||f===void 0?void 0:f.call(c)]},action:()=>{var c,f;return[(f=(c=this.$slots).action)===null||f===void 0?void 0:f.call(c)]}}),this.displayDirective==="show"?[[zn,this.mergedShow],[Tt,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[Tt,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}}),Eo=e=>{const s=Ae(e),i=Ae(),c=async(g,O,h)=>{var F;if(!s.value)throw new Error("origin must exist");const L=new URL("/api/"+g,s.value),S=await fo(L,O,h).catch(y=>{throw we.error("网络错误:"+g),y});if(!S.ok)throw we.error("接口错误:"+g+":"+S.status),S;if((F=S.headers.get("Content-Type"))!=null&&F.includes("application/json")){const y=await S.clone().json();if(y.__error)throw we.error(y.message),S}return S},f=async(g,O={},h)=>c(g,{method:"post",headers:{"Content-Type":"application/json"},body:JSON.stringify(O)},h),b=async(g,O={})=>f(g,O).then(h=>h.json()),m=async(g,O={})=>f(g,O,h=>(h.responseType="arraybuffer",h)).then(h=>h.arrayBuffer());return{origin:s,api:{getServerInfo:async()=>b("getServerInfo"),getSnapshot:async g=>{var O,h;return((h=(O=i.value)==null?void 0:O.gkdAppInfo)==null?void 0:h.versionName)==="1.10.4"?c("snapshot?id="+g.id).then(L=>L.json()):b("getSnapshot",g)},getScreenshot:async g=>m("getScreenshot",g),captureSnapshot:async()=>b("captureSnapshot"),getSnapshots:async()=>b("getSnapshots"),updateSubscription:async g=>b("updateSubscription",{...g,id:-1,name:"内存订阅",version:0}),execSelector:async g=>(g=structuredClone(g),g.action||=void 0,b("execSelector",g))},serverInfo:i}},Lo={"mt-10px":"",flex:"","justify-end":"","gap-8px":""},Vo={"mt-10px":"",flex:"","justify-end":"","gap-8px":""},jo={"page-size":"",flex:"","flex-col":"","p-10px":"","gap-10px":""},Uo={flex:"","items-center":"","gap-24px":""},Wo={key:0,gkd_code:"","pl-16px":"","whitespace-nowrap":"",flex:"","items-center":""},Ko={class:"flex-1 min-h-0 overflow-auto pr-6px"},Ho={key:0,"py-40px":"","text-center":"","opacity-70":""},qo={flex:"","items-center":"","gap-8px":""},Go={flex:"","items-center":"","gap-8px":""},Yo={flex:"","items-start":"","gap-10px":"","flex-wrap":""},Zo=["onMouseenter"],Jo={flex:"","items-center":"","gap-6px":"","leading-18px":""},Qo={class:"truncate font-600"},Xo={"text-12px":"","mt-2px":"",class:"font-600"},el={"mt-4px":"","text-12px":"",class:"opacity-75"},tl={"mt-2px":"","text-12px":"",class:"opacity-70"},nl={class:"inline-block w-fit max-w-90vw"},ol=["src"],ll={key:1,"py-20px":"","text-center":"","opacity-70":""},il={class:"inline-flex"},vl=$e({__name:"DevicePage",setup(e){const s=En(),{api:i,origin:c,serverInfo:f}=Eo(),{settingsStore:b,snapshotImportTime:m,snapshotViewedTime:r}=jn(),g=Ln("device_link",""),O=l=>{const n=l.trim();if(!n)return null;const U=/^https?:\/\//i.test(n)?n:`http://${n}`;return zt(()=>{const k=new URL(U);return k.port||(k.port="8888"),k.origin},()=>null)},h=He(async()=>{const l=O(g.value);if(!l){we.error("非法设备地址");return}c.value=l,g.value=l,f.value=await i.getServerInfo()}),L=W(()=>{if(!f.value)return"未连接设备";const l=f.value.device,n=f.value.gkdAppInfo;return`${l.manufacturer} Android${l.release} - GKD${n.versionName}`});Ze(async()=>{await Vn(500),O(g.value)&&h.invoke()});const S=Ae([]);yt(async()=>{if(!f.value)return;document.title=L.value;const l=await i.getSnapshots();l.sort((n,U)=>U.id-n.id),S.value=l,X.value=""});const F=He(async()=>{const l=await i.captureSnapshot(),n=await i.getScreenshot({id:l.id});await it.setItem(l.id,l),await je.setItem(l.id,n),we.success("捕获并保存快照成功");const U=await i.getSnapshots();U.sort((k,ie)=>ie.id-k.id),S.value=U}),y=He(async()=>{const l=(await i.getSnapshots()).map(H=>H.id),n=new Set((await je.keys()).map(H=>parseInt(H))),U=l.filter(H=>!n.has(H));if(U.length==0){we.success("没有新记录可导入");return}let k=0;const ie=vo(3);await Promise.all(U.map(H=>ie(async()=>{const[ae,Te]=await Promise.all([i.getSnapshot({id:H}),i.getScreenshot({id:H})]);ae.nodes&&(await Promise.all([it.setItem(H,ae),je.setItem(H,Te)]),k++)}))),we.success(`导入${k}条新记录`)}),j=async l=>{await it.hasItem(l.id)||await it.setItem(l.id,await i.getSnapshot({id:l.id}))},Z=async l=>{await je.hasItem(l.id)||await je.setItem(l.id,await i.getScreenshot({id:l.id}))},z=async l=>{await Promise.all([j(l),Z(l)])},R=qe(async l=>{await z(l),r[l.id]=Date.now(),window.open(s.resolve({name:"snapshot",params:{snapshotId:l.id}}).href)},l=>l.id),T=(l,n=4,U=3)=>{const k=l.slice(0,n).map(H=>H.packageName),ie=l.slice(0,n).flatMap(H=>H.activities.slice(0,U).map(ae=>`${H.packageName}::${ae.activityId}`));return{packageNames:k,activityNames:ie}},V=W(()=>no(S.value,m)),K=l=>bt(l).name||l.appId,ne=l=>`${Bt(l).manufacturer} Android ${Bt(l).release||""}`,J=l=>gt(m[l.id]||l.id).format("YYYY-MM-DD HH:mm:ss"),fe=W(()=>b.lowMemoryMode?6:24),{previewUrlMap:ve,previewLoadingMap:oe,previewErrorMap:be,ensurePreview:me}=to({getScreenshot:async l=>await je.getItem(l)||await i.getScreenshot({id:l}),cacheLimit:fe}),Y=qe(async l=>{await z(l),await ro(l)},l=>l.id),pe=qe(async l=>{await Z(l),await so(l)},l=>l.id),ke=qe(async l=>{await $t(),await z(l);const n=await uo(l);Nt({title:"分享链接",content:`${location.origin}/i/${n}`})},l=>l.id),xe=qe(async l=>{await $t(),await Z(l);const n=await co(l);Nt({title:"分享链接",content:Yn(n)})},l=>l.id),ye=Ae([]),le=Ae([]);yt(()=>{if(!b.autoExpandSnapshots){ye.value=[],le.value=[];return}const{packageNames:l,activityNames:n}=T(V.value,5,4);ye.value=l,le.value=n});const Ce=Ae(!1),X=Ae(""),de=He(async()=>{var n,U;const l=zt(()=>eo.parse(X.value.trim()));if(l){if(l.categories||l.globalGroups||l.apps)await i.updateSubscription(l);else if(typeof l.id=="string")await i.updateSubscription({apps:[l]});else if(Array.isArray(l)&&typeof((n=l[0])==null?void 0:n.id)=="string")await i.updateSubscription({apps:l});else if(typeof l.key=="number")await i.updateSubscription({globalGroups:[l]});else if(Array.isArray(l)&&typeof((U=l[0])==null?void 0:U.key)=="number")await i.updateSubscription({globalGroups:l});else{we.error("无法识别的订阅文本");return}we.success("修改成功")}}),a=Ae(!1),p=[{label:"仅查询",value:""},{value:"click",label:"click"},{value:"clickNode",label:"clickNode"},{value:"clickCenter",label:"clickCenter"},{value:"back",label:"back"},{value:"longClick",label:"longClick"},{value:"longClickNode",label:"longClickNode"},{value:"longClickCenter",label:"longClickCenter"}],E=Kn({selector:"",action:"click",quickFind:!1}),he=He(async()=>{const l=await i.execSelector({...E,fastQuery:E.quickFind});if(l.message){we.success(`操作成功: ${l.message}`);return}l.action?we.success((l.result?"操作成功: ":"操作失败: ")+l.action):l.result&&we.success("查询成功")});return(l,n)=>{const U=ko,k=Wn,ie=Un,H=Hn,ae=oo,Te=Do,Se=It("SvgIcon"),De=It("RouterLink"),Me=lo,ue=at,Ie=Ht,Ee=yo,Ne=io,Pe=ao;return ce(),Oe(Ue,null,[C(Pt,{initialValue:{top:84,left:120},class:"box-shadow-dim",show:w(Ce)},{default:x(({onRef:q})=>[C(ie,{size:"small",closable:"",style:{width:"90vw","max-width":"800px"},onClose:n[2]||(n[2]=I=>Ce.value=!1)},{header:x(()=>[M("div",{ref:q,flex:"","items-center":"","cursor-move":""},[...n[13]||(n[13]=[M("span",null,"修改内存订阅",-1),M("div",{"flex-1":""},null,-1)])],512)]),default:x(()=>[C(U,{value:w(X),"onUpdate:value":n[0]||(n[0]=I=>ot(X)?X.value=I:null),disabled:w(de).loading,type:"textarea",class:"gkd_code",autosize:{minRows:20,maxRows:25},placeholder:"请输入订阅文本(JSON5)"},null,8,["value","disabled"]),M("div",Lo,[C(k,{onClick:n[1]||(n[1]=I=>Ce.value=!1)},{default:x(()=>[...n[14]||(n[14]=[Q("取消",-1)])]),_:1}),C(k,{type:"primary",loading:w(de).loading,onClick:w(de).invoke},{default:x(()=>[...n[15]||(n[15]=[Q(" 确认 ",-1)])]),_:1},8,["loading","onClick"])])]),_:2},1024)]),_:1},8,["show"]),C(Pt,{initialValue:{top:120,left:180},class:"box-shadow-dim",show:w(a)},{default:x(({onRef:q})=>[C(ie,{size:"small",closable:"",style:{width:"90vw","max-width":"800px"},onClose:n[7]||(n[7]=I=>a.value=!1)},{header:x(()=>[M("div",{ref:q,flex:"","items-center":"","cursor-move":""},[...n[16]||(n[16]=[M("span",null,"执行选择器",-1),M("div",{"flex-1":""},null,-1)])],512)]),default:x(()=>[C(U,{value:w(E).selector,"onUpdate:value":n[3]||(n[3]=I=>w(E).selector=I),disabled:w(he).loading,type:"textarea",class:"gkd_code",autosize:{minRows:4,maxRows:10},placeholder:"请输入合法选择器"},null,8,["value","disabled"]),n[20]||(n[20]=M("div",{"h-15px":""},null,-1)),C(ae,null,{default:x(()=>[C(H,{checked:w(E).quickFind,"onUpdate:checked":n[4]||(n[4]=I=>w(E).quickFind=I)},{default:x(()=>[...n[17]||(n[17]=[Q("快速查询",-1)])]),_:1},8,["checked"])]),_:1}),n[21]||(n[21]=M("div",{"h-10px":""},null,-1)),C(Te,{value:w(E).action,"onUpdate:value":n[5]||(n[5]=I=>w(E).action=I),options:p,class:"w-150px"},null,8,["value"]),M("div",Vo,[C(k,{onClick:n[6]||(n[6]=I=>a.value=!1)},{default:x(()=>[...n[18]||(n[18]=[Q("取消",-1)])]),_:1}),C(k,{type:"primary",loading:w(he).loading,onClick:w(he).invoke},{default:x(()=>[...n[19]||(n[19]=[Q(" 确认 ",-1)])]),_:1},8,["loading","onClick"])])]),_:2},1024)]),_:1},8,["show"]),M("div",jo,[M("div",Uo,[C(De,{to:"/",class:"flex ml-12px",title:"首页"},{default:x(()=>[C(k,{text:"",style:{"--n-icon-size":"24px"}},{icon:x(()=>[C(Se,{name:"home"})]),_:1})]),_:1}),C(Me,null,{default:x(()=>[C(U,{value:w(g),"onUpdate:value":n[8]||(n[8]=q=>ot(g)?g.value=q:null),placeholder:"请输入设备地址 默认端口:8888",class:"gkd_code",style:{width:"320px"},onKeyup:qn(w(h).invoke,["enter"])},null,8,["value","onKeyup"]),C(k,{loading:w(h).loading,onClick:w(h).invoke},{default:x(()=>[...n[22]||(n[22]=[Q("刷新连接",-1)])]),_:1},8,["loading","onClick"]),w(f)?(ce(),Oe("div",Wo,re(w(L)),1)):pt("",!0)]),_:1}),w(f)?(ce(),Oe(Ue,{key:0},[C(k,{loading:w(F).loading,onClick:w(F).invoke},{default:x(()=>[...n[23]||(n[23]=[Q("捕获快照",-1)])]),_:1},8,["loading","onClick"]),C(k,{loading:w(y).loading,onClick:w(y).invoke},{default:x(()=>[...n[24]||(n[24]=[Q("下载所有快照",-1)])]),_:1},8,["loading","onClick"]),C(k,{onClick:n[9]||(n[9]=q=>Ce.value=!0)},{default:x(()=>[...n[25]||(n[25]=[Q("修改内存订阅",-1)])]),_:1}),C(k,{onClick:n[10]||(n[10]=q=>a.value=!0)},{default:x(()=>[...n[26]||(n[26]=[Q("执行选择器",-1)])]),_:1})],64)):pt("",!0)]),M("div",Ko,[w(V).length?(ce(),lt(Pe,{key:1,expandedNames:w(ye),"onUpdate:expandedNames":n[12]||(n[12]=q=>ot(ye)?ye.value=q:null),accordion:!1},{default:x(()=>[(ce(!0),Oe(Ue,null,ht(w(V),q=>(ce(),lt(Ne,{key:q.packageName,name:q.packageName},{header:x(()=>[M("div",qo,[C(ue,{type:"info",size:"small"},{default:x(()=>[...n[27]||(n[27]=[Q("包名",-1)])]),_:1}),M("code",null,re(`${q.appName} (${q.packageName})`),1),C(ue,{size:"small"},{default:x(()=>[Q(re(q.activities.length)+" Activities",1)]),_:2},1024)])]),default:x(()=>[C(Pe,{expandedNames:w(le),"onUpdate:expandedNames":n[11]||(n[11]=I=>ot(le)?le.value=I:null),accordion:!1},{default:x(()=>[(ce(!0),Oe(Ue,null,ht(q.activities,I=>(ce(),lt(Ne,{key:`${q.packageName}::${I.activityId}`,name:`${q.packageName}::${I.activityId}`},{header:x(()=>[M("div",Go,[C(ue,{type:"success",size:"small"},{default:x(()=>[...n[28]||(n[28]=[Q("Activity",-1)])]),_:1}),M("code",null,re(I.activityId),1),C(ue,{size:"small"},{default:x(()=>[Q(re(I.snapshots.length)+" snapshots",1)]),_:2},1024)])]),default:x(()=>[C(ae,{vertical:"",size:6},{default:x(()=>[(ce(!0),Oe(Ue,null,ht(I.snapshots,o=>(ce(),Oe("div",{key:o.id,class:Gn(["rounded-8px border border-solid px-10px py-6px transition-colors",[w(r)[o.id]?"snapshot-row-viewed":"border-#efeff5 bg-white"]])},[M("div",Yo,[C(Ie,{trigger:"hover",placement:"right-start",flip:!0,shift:!0,"onUpdate:show":v=>{v&&w(me)(o.id)}},{trigger:x(()=>[M("div",{class:"min-w-0 inline-flex max-w-full cursor-default select-text flex-col",onMouseenter:v=>w(me)(o.id)},[M("div",Jo,[C(ue,{size:"small",type:"warning"},{default:x(()=>[Q(re(w(gt)(o.id).format("MM-DD HH:mm:ss")),1)]),_:2},1024),w(r)[o.id]?(ce(),lt(ue,{key:0,size:"small",type:"success"},{default:x(()=>[...n[29]||(n[29]=[Q(" 已查看 ",-1)])]),_:1})):pt("",!0),M("span",Qo,re(K(o)),1)]),M("div",Xo," 界面ID: "+re(o.activityId||"(unknown)"),1),M("div",el,[M("span",null,"创建时间: "+re(w(gt)(o.id).format("YYYY-MM-DD HH:mm:ss")),1),n[30]||(n[30]=M("span",{class:"mx-6px opacity-45"},"|",-1)),M("span",null,"导入时间: "+re(J(o)),1)]),M("div",tl,[M("span",null,"设备: "+re(ne(o)),1),n[31]||(n[31]=M("span",{class:"mx-6px opacity-45"},"|",-1)),M("span",null,"应用ID: "+re(o.appId),1),n[32]||(n[32]=M("span",{class:"mx-6px opacity-45"},"|",-1)),M("span",null,"版本代码: "+re(w(bt)(o).versionCode),1),n[33]||(n[33]=M("span",{class:"mx-6px opacity-45"},"|",-1)),M("span",null,"版本号: "+re(w(bt)(o).versionName||"unknown"),1)])],40,Zo)]),default:x(()=>[M("div",nl,[w(ve)[o.id]?(ce(),Oe("img",{key:0,src:w(ve)[o.id],class:"block h-auto w-auto max-h-320px max-w-80vw rounded-6px",alt:"preview"},null,8,ol)):(ce(),Oe("div",ll,re(w(be)[o.id]||(w(oe)[o.id]?"预览加载中...":"暂无预览")),1))])]),_:2},1032,["onUpdate:show"]),C(k,{text:"",size:"small",class:"ml-auto shrink-0",loading:w(R).loading[o.id],onClick:v=>w(R).invoke(o)},{icon:x(()=>[C(Se,{name:"code"})]),_:1},8,["loading","onClick"]),C(Ie,null,{trigger:x(()=>[C(k,{text:""},{icon:x(()=>[C(Se,{name:"export"})]),_:1})]),default:x(()=>[C(ae,{vertical:""},{default:x(()=>[C(k,{loading:w(Y).loading[o.id],onClick:v=>w(Y).invoke(o)},{default:x(()=>[...n[34]||(n[34]=[Q(" 下载-快照 ",-1)])]),_:1},8,["loading","onClick"]),C(k,{loading:w(pe).loading[o.id],onClick:v=>w(pe).invoke(o)},{default:x(()=>[...n[35]||(n[35]=[Q(" 下载-图片 ",-1)])]),_:1},8,["loading","onClick"])]),_:2},1024)]),_:2},1024),C(Ie,null,{trigger:x(()=>[C(k,{text:""},{icon:x(()=>[C(Se,{name:"share"})]),_:1})]),default:x(()=>[C(ae,{vertical:""},{default:x(()=>[C(k,{loading:w(ke).loading[o.id],onClick:v=>w(ke).invoke(o)},{default:x(()=>[...n[36]||(n[36]=[Q(" 生成链接-快照 ",-1)])]),_:1},8,["loading","onClick"]),C(k,{loading:w(xe).loading[o.id],onClick:v=>w(xe).invoke(o)},{default:x(()=>[...n[37]||(n[37]=[Q(" 生成链接-图片 ",-1)])]),_:1},8,["loading","onClick"])]),_:2},1024)]),_:2},1024),C(Ee,null,{trigger:x(()=>[M("span",il,[C(k,{text:"",disabled:""},{icon:x(()=>[C(Se,{name:"delete"})]),_:1})])]),default:x(()=>[n[38]||(n[38]=Q(" 远端删除尚未实现 ",-1))]),_:1})])],2))),128))]),_:2},1024)]),_:2},1032,["name"]))),128))]),_:2},1032,["expandedNames"])]),_:2},1032,["name"]))),128))]),_:1},8,["expandedNames"])):(ce(),Oe("div",Ho," 暂无快照 "))])])],64)}}});export{vl as default};
//# sourceMappingURL=DevicePage-Op92kHw0.js.map
