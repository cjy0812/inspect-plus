import{a2 as ne,bs as se,b0 as s,a as te,b as m,X as x,W as P,c as z,d as ie,b2 as F,h as y,bt as de,u as he,e as V,Z as ge,g as be,i as N,r as ve,at as ue,j as u,al as Ce,bu as D,$ as pe,aq as fe,aa as me,ar as ke,bi as xe,E as W,n as ye}from"./index-B7Jk9ZT_.js";import{g as Ie}from"./node-i6DpTVMb.js";function Pe(c){const{textColor2:d,primaryColorHover:e,primaryColorPressed:g,primaryColor:o,infoColor:n,successColor:a,warningColor:t,errorColor:i,baseColor:r,borderColor:b,opacityDisabled:v,tagColor:C,closeIconColor:l,closeIconColorHover:h,closeIconColorPressed:f,borderRadiusSmall:p,fontSizeMini:k,fontSizeTiny:S,fontSizeSmall:B,fontSizeMedium:w,heightMini:$,heightTiny:R,heightSmall:H,heightMedium:M,closeColorHover:E,closeColorPressed:_,buttonColor2Hover:O,buttonColor2Pressed:T,fontWeightStrong:j}=c;return Object.assign(Object.assign({},se),{closeBorderRadius:p,heightTiny:$,heightSmall:R,heightMedium:H,heightLarge:M,borderRadius:p,opacityDisabled:v,fontSizeTiny:k,fontSizeSmall:S,fontSizeMedium:B,fontSizeLarge:w,fontWeightStrong:j,textColorCheckable:d,textColorHoverCheckable:d,textColorPressedCheckable:d,textColorChecked:r,colorCheckable:"#0000",colorHoverCheckable:O,colorPressedCheckable:T,colorChecked:o,colorCheckedHover:e,colorCheckedPressed:g,border:`1px solid ${b}`,textColor:d,color:C,colorBordered:"rgb(250, 250, 252)",closeIconColor:l,closeIconColorHover:h,closeIconColorPressed:f,closeColorHover:E,closeColorPressed:_,borderPrimary:`1px solid ${s(o,{alpha:.3})}`,textColorPrimary:o,colorPrimary:s(o,{alpha:.12}),colorBorderedPrimary:s(o,{alpha:.1}),closeIconColorPrimary:o,closeIconColorHoverPrimary:o,closeIconColorPressedPrimary:o,closeColorHoverPrimary:s(o,{alpha:.12}),closeColorPressedPrimary:s(o,{alpha:.18}),borderInfo:`1px solid ${s(n,{alpha:.3})}`,textColorInfo:n,colorInfo:s(n,{alpha:.12}),colorBorderedInfo:s(n,{alpha:.1}),closeIconColorInfo:n,closeIconColorHoverInfo:n,closeIconColorPressedInfo:n,closeColorHoverInfo:s(n,{alpha:.12}),closeColorPressedInfo:s(n,{alpha:.18}),borderSuccess:`1px solid ${s(a,{alpha:.3})}`,textColorSuccess:a,colorSuccess:s(a,{alpha:.12}),colorBorderedSuccess:s(a,{alpha:.1}),closeIconColorSuccess:a,closeIconColorHoverSuccess:a,closeIconColorPressedSuccess:a,closeColorHoverSuccess:s(a,{alpha:.12}),closeColorPressedSuccess:s(a,{alpha:.18}),borderWarning:`1px solid ${s(t,{alpha:.35})}`,textColorWarning:t,colorWarning:s(t,{alpha:.15}),colorBorderedWarning:s(t,{alpha:.12}),closeIconColorWarning:t,closeIconColorHoverWarning:t,closeIconColorPressedWarning:t,closeColorHoverWarning:s(t,{alpha:.12}),closeColorPressedWarning:s(t,{alpha:.18}),borderError:`1px solid ${s(i,{alpha:.23})}`,textColorError:i,colorError:s(i,{alpha:.1}),colorBorderedError:s(i,{alpha:.08}),closeIconColorError:i,closeIconColorHoverError:i,closeIconColorPressedError:i,closeColorHoverError:s(i,{alpha:.12}),closeColorPressedError:s(i,{alpha:.18})})}const ze={common:ne,self:Pe},Se={color:Object,type:{type:String,default:"default"},round:Boolean,size:{type:String,default:"medium"},closable:Boolean,disabled:{type:Boolean,default:void 0}},Be=te("tag",`
 --n-close-margin: var(--n-close-margin-top) var(--n-close-margin-right) var(--n-close-margin-bottom) var(--n-close-margin-left);
 white-space: nowrap;
 position: relative;
 box-sizing: border-box;
 cursor: default;
 display: inline-flex;
 align-items: center;
 flex-wrap: nowrap;
 padding: var(--n-padding);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 line-height: 1;
 height: var(--n-height);
 font-size: var(--n-font-size);
`,[m("strong",`
 font-weight: var(--n-font-weight-strong);
 `),x("border",`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),x("icon",`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),x("avatar",`
 display: flex;
 margin: 0 6px 0 0;
 `),x("close",`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),m("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[x("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),x("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),m("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),m("icon, avatar",[m("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),m("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),m("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[P("disabled",[z("&:hover","background-color: var(--n-color-hover-checkable);",[P("checked","color: var(--n-text-color-hover-checkable);")]),z("&:active","background-color: var(--n-color-pressed-checkable);",[P("checked","color: var(--n-text-color-pressed-checkable);")])]),m("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[P("disabled",[z("&:hover","background-color: var(--n-color-checked-hover);"),z("&:active","background-color: var(--n-color-checked-pressed);")])])])]),we=Object.assign(Object.assign(Object.assign({},V.props),Se),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),$e=me("n-tag"),Me=ie({name:"Tag",props:we,slots:Object,setup(c){const d=ve(null),{mergedBorderedRef:e,mergedClsPrefixRef:g,inlineThemeDisabled:o,mergedRtlRef:n}=he(c),a=V("Tag","-tag",Be,ze,c,g);pe($e,{roundRef:fe(c,"round")});function t(){if(!c.disabled&&c.checkable){const{checked:l,onCheckedChange:h,onUpdateChecked:f,"onUpdate:checked":p}=c;f&&f(!l),p&&p(!l),h&&h(!l)}}function i(l){if(c.triggerClickOnClose||l.stopPropagation(),!c.disabled){const{onClose:h}=c;h&&ue(h,l)}}const r={setTextContent(l){const{value:h}=d;h&&(h.textContent=l)}},b=ge("Tag",n,g),v=N(()=>{const{type:l,size:h,color:{color:f,textColor:p}={}}=c,{common:{cubicBezierEaseInOut:k},self:{padding:S,closeMargin:B,borderRadius:w,opacityDisabled:$,textColorCheckable:R,textColorHoverCheckable:H,textColorPressedCheckable:M,textColorChecked:E,colorCheckable:_,colorHoverCheckable:O,colorPressedCheckable:T,colorChecked:j,colorCheckedHover:K,colorCheckedPressed:A,closeBorderRadius:q,fontWeightStrong:G,[u("colorBordered",l)]:X,[u("closeSize",h)]:Z,[u("closeIconSize",h)]:J,[u("fontSize",h)]:Q,[u("height",h)]:U,[u("color",l)]:Y,[u("textColor",l)]:ee,[u("border",l)]:oe,[u("closeIconColor",l)]:L,[u("closeIconColorHover",l)]:re,[u("closeIconColorPressed",l)]:le,[u("closeColorHover",l)]:ae,[u("closeColorPressed",l)]:ce}}=a.value,I=Ce(B);return{"--n-font-weight-strong":G,"--n-avatar-size-override":`calc(${U} - 8px)`,"--n-bezier":k,"--n-border-radius":w,"--n-border":oe,"--n-close-icon-size":J,"--n-close-color-pressed":ce,"--n-close-color-hover":ae,"--n-close-border-radius":q,"--n-close-icon-color":L,"--n-close-icon-color-hover":re,"--n-close-icon-color-pressed":le,"--n-close-icon-color-disabled":L,"--n-close-margin-top":I.top,"--n-close-margin-right":I.right,"--n-close-margin-bottom":I.bottom,"--n-close-margin-left":I.left,"--n-close-size":Z,"--n-color":f||(e.value?X:Y),"--n-color-checkable":_,"--n-color-checked":j,"--n-color-checked-hover":K,"--n-color-checked-pressed":A,"--n-color-hover-checkable":O,"--n-color-pressed-checkable":T,"--n-font-size":Q,"--n-height":U,"--n-opacity-disabled":$,"--n-padding":S,"--n-text-color":p||ee,"--n-text-color-checkable":R,"--n-text-color-checked":E,"--n-text-color-hover-checkable":H,"--n-text-color-pressed-checkable":M}}),C=o?be("tag",N(()=>{let l="";const{type:h,size:f,color:{color:p,textColor:k}={}}=c;return l+=h[0],l+=f[0],p&&(l+=`a${D(p)}`),k&&(l+=`b${D(k)}`),e.value&&(l+="c"),l}),v,c):void 0;return Object.assign(Object.assign({},r),{rtlEnabled:b,mergedClsPrefix:g,contentRef:d,mergedBordered:e,handleClick:t,handleCloseClick:i,cssVars:o?void 0:v,themeClass:C==null?void 0:C.themeClass,onRender:C==null?void 0:C.onRender})},render(){var c,d;const{mergedClsPrefix:e,rtlEnabled:g,closable:o,color:{borderColor:n}={},round:a,onRender:t,$slots:i}=this;t==null||t();const r=F(i.avatar,v=>v&&y("div",{class:`${e}-tag__avatar`},v)),b=F(i.icon,v=>v&&y("div",{class:`${e}-tag__icon`},v));return y("div",{class:[`${e}-tag`,this.themeClass,{[`${e}-tag--rtl`]:g,[`${e}-tag--strong`]:this.strong,[`${e}-tag--disabled`]:this.disabled,[`${e}-tag--checkable`]:this.checkable,[`${e}-tag--checked`]:this.checkable&&this.checked,[`${e}-tag--round`]:a,[`${e}-tag--avatar`]:r,[`${e}-tag--icon`]:b,[`${e}-tag--closable`]:o}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},b||r,y("span",{class:`${e}-tag__content`,ref:"contentRef"},(d=(c=this.$slots).default)===null||d===void 0?void 0:d.call(c)),!this.checkable&&o?y(de,{clsPrefix:e,class:`${e}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:a,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?y("div",{class:`${e}-tag__border`,style:{borderColor:n}}):null)}}),Ee=c=>{const d=W({}),e=W({}),g=W({}),o=ye([]),n=r=>{const b=d[r];b&&(URL.revokeObjectURL(b),delete d[r]),delete g[r],e[r]=!1,o.value=o.value.filter(v=>v!=r)},a=()=>{for(;o.value.length>c.cacheLimit.value;){const r=o.value[0];if(typeof r=="number")n(r);else break}},t=()=>{Object.keys(d).forEach(r=>n(Number(r)))},i=async r=>{if(!(d[r]||e[r])){g[r]="",e[r]=!0;try{const b=await c.getScreenshot(r);if(!b){g[r]=c.emptyErrorText||"暂无预览图";return}const v=b instanceof Blob?b:new Blob([b],{type:"image/png"});d[r]=URL.createObjectURL(v),o.value=[...o.value.filter(C=>C!=r),r],a()}catch{g[r]=c.loadErrorText||"预览加载失败"}finally{e[r]=!1}}};return ke(()=>c.cacheLimit.value,()=>{a()}),xe(t),{previewUrlMap:d,previewLoadingMap:e,previewErrorMap:g,ensurePreview:i}},_e=(c,d)=>{var g;const e=new Map;for(const o of c){const n=o.appId||((g=o.appInfo)==null?void 0:g.id)||"(unknown)",a=o.activityId||"(unknown)";e.has(n)||e.set(n,new Map);const t=e.get(n),i=t.get(a)||[];i.push(o),t.set(a,i)}return[...e.entries()].map(([o,n])=>({packageName:o,appName:[...n.values()].flat().map(a=>Ie(a).name).find(Boolean)||o,activities:[...n.entries()].map(([a,t])=>({activityId:a,snapshots:[...t].sort((i,r)=>(d[r.id]||r.id)-(d[i.id]||i.id))})).sort((a,t)=>t.snapshots.length-a.snapshots.length)})).sort((o,n)=>n.activities.length-o.activities.length)};export{Me as _,_e as b,Ee as u};
//# sourceMappingURL=snapshotGroup-C9LTZAzv.js.map
