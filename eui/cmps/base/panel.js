EUI.defineCmp("panel","size",function(n,t){"use strict";function e(n){n=t.extend({},o,n),e._superClass.call(this,n),this.setIcon(n.icon),this.setCaption(n.caption),this.setContent(n.content)}e.EVENT_EXPAND="onexpandchange",e.initMiniBtns=function(n,e,i,o,c){var p=i.header=e.appendChild(n.createElement("div"));p.className=o.cls_header||"ui-panel-header",p.innerHTML='<span class="'+(o.cls_icon||"ui-icon ui-panel-icon")+'"></span><span class="'+(o.cls_caption||"ui-panel-caption")+'"></span><div class="'+(o.cls_btns||"ui-panel-btns")+'"></div>';var d=i.iconDom=p.firstChild,u=i.captionDom=d.nextSibling,h=i.miniBtnsDom=u.nextSibling,m=o.miniBtns,f=null;if(c=c||a,m&&(f=m.length)){for(var v=[],_=o.cls_btn||"ui-icon ui-panel-btn",y=0;y<f;y++){var C=m[y];if(t.isString(C)&&(C=c[C]),C){var b=C.cls,g=C.handler;if(t.isString(g)&&(g=this[g]),t.isFunction(g)){var E=h.appendChild(n.createElement("span"));E.className=_,E.title=C.hint||"",t.isFunction(b)&&(b=b.call(this,E,o));var D=null,x=null;-1===b.indexOf(".")?(x=!1,t.addClass(E,D=b)):(D=!1,E.style.background="url("+(x=b)+")"),v.push({name:C.name||t.random("minibtn_"),iconCls:D,iconUrl:x,dom:E,args:C.args,handler:g})}}}v.length?(i.miniBtns=v,i.actbtn=o.cls_actbtn||"ui-panel-btn-hover",t.bind(h,[{type:"mousemove.panel",data:this,handler:r},{type:"mouseup.panel",data:this,handler:s},{type:"mouseleave.panel",data:this,handler:l}])):h.style.display="none"}else h.style.display="none";return p};var i=function(n,t,e){this.setMiniBtnIcon((!0===e?!n:n)?"font-icon-doubleup":"font-icon-doubledown",t)},a={collapse:{cls:function(n,a){return t.namespace(!0,"events."+e.EVENT_EXPAND,a,{handler:i,args:n}),"font-icon-doubleup"},handler:"setExpanded"}},o={height:"100%",onContainerInit:function(n,t){},onComponentInit:function(n,i,a){var o=n.appendChild(i.createElement("div"));o.className=a.cls_container||"ui-panel";var r={container:o,expanded:!0};!1!==a.header?e.initMiniBtns.call(this,i,o,r,a,a.miniBtnsConfig):t.addClass(o,a.cls_container_noheader||"ui-panel-no-header"),(r.contentDom=o.appendChild(i.createElement("div"))).className=a.cls_content||"ui-panel-content";var s=a.oninittail;return t.isFunction(s)&&s.call(this,o,i,r,a),r}},r=function(n){var e=n.data._property,i=n.target,a=e._activeminibtn_;if(i.parentNode===e.miniBtnsDom){if(a===i)return;var o=e.actbtn;t.removeClass(a,o),t.addClass(e._activeminibtn_=i,o)}else a&&(t.removeClass(a,e.actbtn),e._activeminibtn_=null)},s=function(n){var t=n.data,e=t._property,i=e._activeminibtn_;if(i)for(var a=e.miniBtns,o=null,r=0,s=a.length;r<s;r++)(o=a[r]).dom===i&&o.handler.apply(t,[i].concat(o.args))},l=function(n){var e=n.data._property,i=e._activeminibtn_;i&&(t.removeClass(i,e.actbtn),e._activeminibtn_=null)},c=function(n){var e=this._property.miniBtns;if(t.isNumber(n))return e[n];if(n){var i=t.isString(n)?"name":1===n.nodeType?"dom":null;if(i)for(var a=0,o=e.length;a<o;a++){var r=e[a];if(r[i]===n)return r}}};return t.inherit(e,n,{getContentDom:function(){return this._property.contentDom},getContent:function(){return this._property.content},setContent:function(n){t.setContent(n,"contentDom",this._property,this)},getCaption:function(){return this._property.caption},setCaption:function(n){var e=this._property;if(!e.header)return!1;n=n?t.formatHtml(n):"无标题",e.caption!==n&&(e.captionDom.innerHTML=e.caption=n)},getIcon:function(){return this._property.icon},setIcon:function(n){var e=this._property;if(!e.header)return!1;e.icon!==(n=n||!1)&&t.setIcon(e.iconDom,e.icon=n,e,"iconCls","iconUrl",!0)},isExpanded:function(){return this._property.expanded},setExpanded:function(n){var t=this._property,i=t.expanded;if(!0===n||!1===n){if((n=!1!==n)===i)return!1}else n=!i;if(!1===this.emit(e.EVENT_EXPAND,n))return!1;var a=null,o=null;(t.expanded=n)?(a=t.height,o=""):(a="",o="none"),t.container.style.height=a,t.contentDom.style.display=o},setMiniBtnIcon:function(n,e){var i=c.call(this,e);return!!i&&t.setIcon(i.dom,n,i,"iconCls","iconUrl",!0)},setHeaderStyle:function(n){t.css(this._property.header,n)}}),e});