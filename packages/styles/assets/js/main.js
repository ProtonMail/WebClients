/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-setclasses !*/
 !function(n,e,s){function o(n,e){return typeof n===e}function a(n){var e=l.className,s=Modernizr._config.classPrefix||"";if(r&&(e=e.baseVal),Modernizr._config.enableJSClass){var o=new RegExp("(^|\\s)"+s+"no-js(\\s|$)");e=e.replace(o,"$1"+s+"js$2")}Modernizr._config.enableClasses&&(e+=" "+s+n.join(" "+s),r?l.className.baseVal=e:l.className=e)}function i(){var n,e,s,a,i,f,l;for(var r in t)if(t.hasOwnProperty(r)){if(n=[],e=t[r],e.name&&(n.push(e.name.toLowerCase()),e.options&&e.options.aliases&&e.options.aliases.length))for(s=0;s<e.options.aliases.length;s++)n.push(e.options.aliases[s].toLowerCase());for(a=o(e.fn,"function")?e.fn():e.fn,i=0;i<n.length;i++)f=n[i],l=f.split("."),1===l.length?Modernizr[l[0]]=a:(!Modernizr[l[0]]||Modernizr[l[0]]instanceof Boolean||(Modernizr[l[0]]=new Boolean(Modernizr[l[0]])),Modernizr[l[0]][l[1]]=a),c.push((a?"":"no-")+l.join("-"))}}var t=[],f={_version:"3.6.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(n,e){var s=this;setTimeout(function(){e(s[n])},0)},addTest:function(n,e,s){t.push({name:n,fn:e,options:s})},addAsyncTest:function(n){t.push({name:null,fn:n})}},Modernizr=function(){};Modernizr.prototype=f,Modernizr=new Modernizr;var l=e.documentElement,r="svg"===l.nodeName.toLowerCase(),c=[];i(),a(c),delete f.addTest,delete f.addAsyncTest;for(var u=0;u<Modernizr._q.length;u++)Modernizr._q[u]();n.Modernizr=Modernizr}(window,document);

/* PrismJS 1.15.0
https://prismjs.com/download.html#themes=prism&languages=markup+css+clike+javascript&plugins=keep-markup */
var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(){var e=/\blang(?:uage)?-([\w-]+)\b/i,t=0,n=_self.Prism={manual:_self.Prism&&_self.Prism.manual,disableWorkerMessageHandler:_self.Prism&&_self.Prism.disableWorkerMessageHandler,util:{encode:function(e){return e instanceof a?new a(e.type,n.util.encode(e.content),e.alias):"Array"===n.util.type(e)?e.map(n.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).slice(8,-1)},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function(e,t){var a=n.util.type(e);switch(t=t||{},a){case"Object":if(t[n.util.objId(e)])return t[n.util.objId(e)];var r={};t[n.util.objId(e)]=r;for(var l in e)e.hasOwnProperty(l)&&(r[l]=n.util.clone(e[l],t));return r;case"Array":if(t[n.util.objId(e)])return t[n.util.objId(e)];var r=[];return t[n.util.objId(e)]=r,e.forEach(function(e,a){r[a]=n.util.clone(e,t)}),r}return e}},languages:{extend:function(e,t){var a=n.util.clone(n.languages[e]);for(var r in t)a[r]=t[r];return a},insertBefore:function(e,t,a,r){r=r||n.languages;var l=r[e],i={};for(var o in l)if(l.hasOwnProperty(o)){if(o==t)for(var s in a)a.hasOwnProperty(s)&&(i[s]=a[s]);a.hasOwnProperty(o)||(i[o]=l[o])}var u=r[e];return r[e]=i,n.languages.DFS(n.languages,function(t,n){n===u&&t!=e&&(this[t]=i)}),i},DFS:function(e,t,a,r){r=r||{};for(var l in e)e.hasOwnProperty(l)&&(t.call(e,l,e[l],a||l),"Object"!==n.util.type(e[l])||r[n.util.objId(e[l])]?"Array"!==n.util.type(e[l])||r[n.util.objId(e[l])]||(r[n.util.objId(e[l])]=!0,n.languages.DFS(e[l],t,l,r)):(r[n.util.objId(e[l])]=!0,n.languages.DFS(e[l],t,null,r)))}},plugins:{},highlightAll:function(e,t){n.highlightAllUnder(document,e,t)},highlightAllUnder:function(e,t,a){var r={callback:a,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};n.hooks.run("before-highlightall",r);for(var l,i=r.elements||e.querySelectorAll(r.selector),o=0;l=i[o++];)n.highlightElement(l,t===!0,r.callback)},highlightElement:function(t,a,r){for(var l,i,o=t;o&&!e.test(o.className);)o=o.parentNode;o&&(l=(o.className.match(e)||[,""])[1].toLowerCase(),i=n.languages[l]),t.className=t.className.replace(e,"").replace(/\s+/g," ")+" language-"+l,t.parentNode&&(o=t.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+l));var s=t.textContent,u={element:t,language:l,grammar:i,code:s};if(n.hooks.run("before-sanity-check",u),!u.code||!u.grammar)return u.code&&(n.hooks.run("before-highlight",u),u.element.textContent=u.code,n.hooks.run("after-highlight",u)),n.hooks.run("complete",u),void 0;if(n.hooks.run("before-highlight",u),a&&_self.Worker){var g=new Worker(n.filename);g.onmessage=function(e){u.highlightedCode=e.data,n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,n.hooks.run("after-highlight",u),n.hooks.run("complete",u),r&&r.call(u.element)},g.postMessage(JSON.stringify({language:u.language,code:u.code,immediateClose:!0}))}else u.highlightedCode=n.highlight(u.code,u.grammar,u.language),n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,n.hooks.run("after-highlight",u),n.hooks.run("complete",u),r&&r.call(t)},highlight:function(e,t,r){var l={code:e,grammar:t,language:r};return n.hooks.run("before-tokenize",l),l.tokens=n.tokenize(l.code,l.grammar),n.hooks.run("after-tokenize",l),a.stringify(n.util.encode(l.tokens),l.language)},matchGrammar:function(e,t,a,r,l,i,o){var s=n.Token;for(var u in a)if(a.hasOwnProperty(u)&&a[u]){if(u==o)return;var g=a[u];g="Array"===n.util.type(g)?g:[g];for(var c=0;c<g.length;++c){var h=g[c],f=h.inside,d=!!h.lookbehind,m=!!h.greedy,p=0,y=h.alias;if(m&&!h.pattern.global){var v=h.pattern.toString().match(/[imuy]*$/)[0];h.pattern=RegExp(h.pattern.source,v+"g")}h=h.pattern||h;for(var b=r,k=l;b<t.length;k+=t[b].length,++b){var w=t[b];if(t.length>e.length)return;if(!(w instanceof s)){if(m&&b!=t.length-1){h.lastIndex=k;var _=h.exec(e);if(!_)break;for(var j=_.index+(d?_[1].length:0),P=_.index+_[0].length,A=b,x=k,O=t.length;O>A&&(P>x||!t[A].type&&!t[A-1].greedy);++A)x+=t[A].length,j>=x&&(++b,k=x);if(t[b]instanceof s)continue;I=A-b,w=e.slice(k,x),_.index-=k}else{h.lastIndex=0;var _=h.exec(w),I=1}if(_){d&&(p=_[1]?_[1].length:0);var j=_.index+p,_=_[0].slice(p),P=j+_.length,N=w.slice(0,j),S=w.slice(P),C=[b,I];N&&(++b,k+=N.length,C.push(N));var E=new s(u,f?n.tokenize(_,f):_,y,_,m);if(C.push(E),S&&C.push(S),Array.prototype.splice.apply(t,C),1!=I&&n.matchGrammar(e,t,a,b,k,!0,u),i)break}else if(i)break}}}}},tokenize:function(e,t){var a=[e],r=t.rest;if(r){for(var l in r)t[l]=r[l];delete t.rest}return n.matchGrammar(e,a,t,0,0,!1),a},hooks:{all:{},add:function(e,t){var a=n.hooks.all;a[e]=a[e]||[],a[e].push(t)},run:function(e,t){var a=n.hooks.all[e];if(a&&a.length)for(var r,l=0;r=a[l++];)r(t)}}},a=n.Token=function(e,t,n,a,r){this.type=e,this.content=t,this.alias=n,this.length=0|(a||"").length,this.greedy=!!r};if(a.stringify=function(e,t,r){if("string"==typeof e)return e;if("Array"===n.util.type(e))return e.map(function(n){return a.stringify(n,t,e)}).join("");var l={type:e.type,content:a.stringify(e.content,t,r),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:r};if(e.alias){var i="Array"===n.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(l.classes,i)}n.hooks.run("wrap",l);var o=Object.keys(l.attributes).map(function(e){return e+'="'+(l.attributes[e]||"").replace(/"/g,"&quot;")+'"'}).join(" ");return"<"+l.tag+' class="'+l.classes.join(" ")+'"'+(o?" "+o:"")+">"+l.content+"</"+l.tag+">"},!_self.document)return _self.addEventListener?(n.disableWorkerMessageHandler||_self.addEventListener("message",function(e){var t=JSON.parse(e.data),a=t.language,r=t.code,l=t.immediateClose;_self.postMessage(n.highlight(r,n.languages[a],a)),l&&_self.close()},!1),_self.Prism):_self.Prism;var r=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return r&&(n.filename=r.src,n.manual||r.hasAttribute("data-manual")||("loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(n.highlightAll):window.setTimeout(n.highlightAll,16):document.addEventListener("DOMContentLoaded",n.highlightAll))),_self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism);
Prism.languages.markup={comment:/<!--[\s\S]*?-->/,prolog:/<\?[\s\S]+?\?>/,doctype:/<!DOCTYPE[\s\S]+?>/i,cdata:/<!\[CDATA\[[\s\S]*?]]>/i,tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/i,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,inside:{punctuation:[/^=/,{pattern:/(^|[^\\])["']/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:/&#?[\da-z]{1,8};/i},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.hooks.add("wrap",function(a){"entity"===a.type&&(a.attributes.title=a.content.replace(/&amp;/,"&"))}),Prism.languages.xml=Prism.languages.markup,Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup;
Prism.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:/@[\w-]+?[\s\S]*?(?:;|(?=\s*\{))/i,inside:{rule:/@[\w-]+/}},url:/url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,selector:/[^{}\s][^{};]*?(?=\s*\{)/,string:{pattern:/("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},property:/[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,important:/!important\b/i,"function":/[-a-z0-9]+(?=\()/i,punctuation:/[(){};:,]/},Prism.languages.css.atrule.inside.rest=Prism.languages.css,Prism.languages.markup&&(Prism.languages.insertBefore("markup","tag",{style:{pattern:/(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,lookbehind:!0,inside:Prism.languages.css,alias:"language-css",greedy:!0}}),Prism.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:Prism.languages.markup.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:Prism.languages.css}},alias:"language-css"}},Prism.languages.markup.tag));
Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,"boolean":/\b(?:true|false)\b/,"function":/\w+(?=\()/,number:/\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/};
Prism.languages.javascript=Prism.languages.extend("clike",{"class-name":[Prism.languages.clike["class-name"],{pattern:/(^|[^$\w\xA0-\uFFFF])[_$A-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\.(?:prototype|constructor))/,lookbehind:!0}],keyword:[{pattern:/((?:^|})\s*)(?:catch|finally)\b/,lookbehind:!0},/\b(?:as|async|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/],number:/\b(?:(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+)n?|\d+n|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,"function":/[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\(|\.(?:apply|bind|call)\()/,operator:/-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/}),Prism.languages.javascript["class-name"][0].pattern=/(\b(?:class|interface|extends|implements|instanceof|new)\s+)[\w.\\]+/,Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[(?:[^\]\\\r\n]|\\.)*]|\\.|[^\/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,lookbehind:!0,greedy:!0},"function-variable":{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,alias:"function"},parameter:[{pattern:/(function(?:\s+[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)?\s*\(\s*)[^\s()][^()]*?(?=\s*\))/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=>)/,inside:Prism.languages.javascript},{pattern:/(\(\s*)[^\s()][^()]*?(?=\s*\)\s*=>)/,lookbehind:!0,inside:Prism.languages.javascript},{pattern:/((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*\s*)\(\s*)[^\s()][^()]*?(?=\s*\)\s*\{)/,lookbehind:!0,inside:Prism.languages.javascript}],constant:/\b[A-Z][A-Z\d_]*\b/}),Prism.languages.insertBefore("javascript","string",{"template-string":{pattern:/`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,greedy:!0,inside:{interpolation:{pattern:/\${[^}]+}/,inside:{"interpolation-punctuation":{pattern:/^\${|}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\s\S]+/}}}),Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,lookbehind:!0,inside:Prism.languages.javascript,alias:"language-javascript",greedy:!0}}),Prism.languages.js=Prism.languages.javascript;
!function(){"undefined"!=typeof self&&self.Prism&&self.document&&document.createRange&&(Prism.plugins.KeepMarkup=!0,Prism.hooks.add("before-highlight",function(e){if(e.element.children.length){var n=0,o=[],t=function(e,d){var r={};d||(r.clone=e.cloneNode(!1),r.posOpen=n,o.push(r));for(var a=0,s=e.childNodes.length;s>a;a++){var l=e.childNodes[a];1===l.nodeType?t(l):3===l.nodeType&&(n+=l.data.length)}d||(r.posClose=n)};t(e.element,!0),o&&o.length&&(e.keepMarkup=o)}}),Prism.hooks.add("after-highlight",function(e){if(e.keepMarkup&&e.keepMarkup.length){var n=function(e,o){for(var t=0,d=e.childNodes.length;d>t;t++){var r=e.childNodes[t];if(1===r.nodeType){if(!n(r,o))return!1}else 3===r.nodeType&&(!o.nodeStart&&o.pos+r.data.length>o.node.posOpen&&(o.nodeStart=r,o.nodeStartPos=o.node.posOpen-o.pos),o.nodeStart&&o.pos+r.data.length>=o.node.posClose&&(o.nodeEnd=r,o.nodeEndPos=o.node.posClose-o.pos),o.pos+=r.data.length);if(o.nodeStart&&o.nodeEnd){var a=document.createRange();return a.setStart(o.nodeStart,o.nodeStartPos),a.setEnd(o.nodeEnd,o.nodeEndPos),o.node.clone.appendChild(a.extractContents()),a.insertNode(o.node.clone),a.detach(),!1}}return!0};e.keepMarkup.forEach(function(o){n(e.element,{node:o,pos:0})}),e.highlightedCode=e.element.innerHTML}}))}();

/**
 * van11y-accessible-hide-show-aria - ES2015 accessible hide-show system (collapsible regions), using ARIA (compatible IE9+ when transpiled)
 * @version v3.0.1
 * @link https://van11y.net/accessible-hide-show/
 * @license MIT : https://github.com/nico3333fr/van11y-accessible-hide-show-aria/blob/master/LICENSE
 */
"use strict";function _defineProperty(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var _extends=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},loadConfig=function(){var e={},t=function(t,n){e[t]=n},n=function(t){return e[t]},r=function(t){return e[t]};return{set:t,get:n,remove:r}},DATA_HASH_ID="data-hash-id",pluginConfig=loadConfig(),findById=function(e,t){return document.querySelector("#"+e+"["+DATA_HASH_ID+'="'+t+'"]')},addClass=function(e,t){e.classList?e.classList.add(t):e.className+=" "+t},removeClass=function(e,t){e.classList?e.classList.remove(t):e.className=e.className.replace(new RegExp("(^|\\b)"+t.split(" ").join("|")+"(\\b|$)","gi")," ")},hasClass=function(e,t){return e.classList?e.classList.contains(t):new RegExp("(^| )"+t+"( |$)","gi").test(e.className)},setAttributes=function(e,t){Object.keys(t).forEach(function(n){e.setAttribute(n,t[n])})},triggerEvent=function(e,t){if(e.fireEvent)e.fireEvent("on"+t);else{var n=document.createEvent("Events");n.initEvent(t,!0,!1),e.dispatchEvent(n)}},searchParentHashId=function(e,t){for(var n=!1,r=e;1===r.nodeType&&r&&n===!1;)r.hasAttribute(t)===!0?n=!0:r=r.parentNode;return n===!0?r.getAttribute(t):""},searchParent=function(e,t,n){for(var r=!1,_=e;_&&r===!1;)hasClass(_,t)===!0&&_.getAttribute(DATA_HASH_ID)===n?r=!0:_=_.parentNode;return r===!0?_.getAttribute("id"):""},plugin=function(){var e=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],t=_extends({HIDESHOW_EXPAND:"js-expandmore",HIDESHOW_BUTTON_EXPAND:"js-expandmore-button",HIDESHOW_BUTTON_EXPAND_STYLE:"expandmore__button",HIDESHOW_BUTTON_LABEL_ID:"label_expand_",DATA_PREFIX_CLASS:"data-hideshow-prefix-class",HIDESHOW_BUTTON_EMPTY_ELEMENT_SYMBOL:"expandmore__symbol",HIDESHOW_BUTTON_EMPTY_ELEMENT_TAG:"span",ATTR_HIDESHOW_BUTTON_EMPTY_ELEMENT:"aria-hidden",HIDESHOW_TO_EXPAND_ID:"expand_",HIDESHOW_TO_EXPAND_STYLE:"expandmore__to_expand",ATTR_CONTROL:"data-controls",ATTR_EXPANDED:"aria-expanded",ATTR_LABELLEDBY:"data-labelledby",ATTR_HIDDEN:"data-hidden",IS_OPENED_CLASS:"is-opened",DISPLAY_FIRST_LOAD:"js-first_load",DISPLAY_FIRST_LOAD_DELAY:"1500"},e),n=Math.random().toString(32).slice(2,12);pluginConfig.set(n,t);var r=function(){var e=arguments.length<=0||void 0===arguments[0]?document:arguments[0];return[].slice.call(e.querySelectorAll("."+t.HIDESHOW_EXPAND))},_=function(e){r(e).forEach(function(e){var r,_,a,i=Math.random().toString(32).slice(2,12),s=e.hasAttribute(t.DATA_PREFIX_CLASS)===!0?e.getAttribute(t.DATA_PREFIX_CLASS)+"-":"",E=e.nextElementSibling,o=e.innerHTML,A=document.createElement("BUTTON"),T=document.createElement(t.HIDESHOW_BUTTON_EMPTY_ELEMENT_TAG);e.setAttribute(DATA_HASH_ID,n),addClass(T,s+t.HIDESHOW_BUTTON_EMPTY_ELEMENT_SYMBOL),setAttributes(T,(r={},_defineProperty(r,t.ATTR_HIDESHOW_BUTTON_EMPTY_ELEMENT,!0),_defineProperty(r,DATA_HASH_ID,n),r)),e.innerHTML="",addClass(A,s+t.HIDESHOW_BUTTON_EXPAND_STYLE),addClass(A,t.HIDESHOW_BUTTON_EXPAND),setAttributes(A,(_={},_defineProperty(_,t.ATTR_CONTROL,t.HIDESHOW_TO_EXPAND_ID+i),_defineProperty(_,t.ATTR_EXPANDED,"false"),_defineProperty(_,"id",t.HIDESHOW_BUTTON_LABEL_ID+i),_defineProperty(_,"type","button"),_defineProperty(_,DATA_HASH_ID,n),_)),A.innerHTML=o,e.appendChild(A),A.insertBefore(T,A.firstChild),setAttributes(E,(a={},_defineProperty(a,t.ATTR_LABELLEDBY,t.HIDESHOW_BUTTON_LABEL_ID+i),_defineProperty(a,t.ATTR_HIDDEN,"true"),_defineProperty(a,"id",t.HIDESHOW_TO_EXPAND_ID+i),_defineProperty(a,DATA_HASH_ID,n),a)),addClass(E,s+t.HIDESHOW_TO_EXPAND_STYLE),hasClass(E,t.DISPLAY_FIRST_LOAD)===!0&&setTimeout(function(){removeClass(E,t.DISPLAY_FIRST_LOAD)},t.DISPLAY_FIRST_LOAD_DELAY),hasClass(E,t.IS_OPENED_CLASS)===!0&&(addClass(A,t.IS_OPENED_CLASS),A.setAttribute(t.ATTR_EXPANDED,"true"),removeClass(E,t.IS_OPENED_CLASS),E.removeAttribute(t.ATTR_HIDDEN))})};return{attach:_}},main=function(){return["click","keydown"].forEach(function(e){document.body.addEventListener(e,function(t){var n=searchParentHashId(t.target,DATA_HASH_ID);if(""!==n){var r=pluginConfig.get(n),_=searchParent(t.target,r.HIDESHOW_BUTTON_EXPAND,n);if(""!==_&&"click"===e){var a=findById(_,n),i=findById(a.getAttribute(r.ATTR_CONTROL),n),s=a.getAttribute(r.ATTR_EXPANDED);"false"===s?(a.setAttribute(r.ATTR_EXPANDED,!0),addClass(a,r.IS_OPENED_CLASS),i.removeAttribute(r.ATTR_HIDDEN)):(a.setAttribute(r.ATTR_EXPANDED,!1),removeClass(a,r.IS_OPENED_CLASS),i.setAttribute(r.ATTR_HIDDEN,!0))}if(hasClass(t.target,r.HIDESHOW_EXPAND)===!0){var E=t.target,o=E.querySelector("."+r.HIDESHOW_BUTTON_EXPAND);if(E!=o){if("click"===e)return triggerEvent(o,"click"),!1;if("keydown"===e&&(13===t.keyCode||32===t.keyCode))return triggerEvent(o,"click"),!1}}}},!0)}),plugin};window.van11yAccessibleHideShowAria=main();var onLoad=function e(){var t=window.van11yAccessibleHideShowAria();t.attach(),document.removeEventListener("DOMContentLoaded",e)};document.addEventListener("DOMContentLoaded",onLoad);



/**
 * van11y-accessible-modal-window-aria - ES2015 accessible modal window system, using ARIA (compatible IE9+ when transpiled)
 * @version v2.4.4
 * @link https://van11y.net/accessible-modal/
 * @license MIT : https://github.com/nico3333fr/van11y-accessible-modal-window-aria/blob/master/LICENSE
 */
'use strict';

(function (doc) {

  var MODAL_JS_CLASS = 'js-modal';
  var MODAL_ID_PREFIX = 'label_modal_';
  var MODAL_CLASS_SUFFIX = 'modal';
  var MODAL_DATA_BACKGROUND_ATTR = 'data-modal-background-click';
  var MODAL_PREFIX_CLASS_ATTR = 'data-modal-prefix-class';
  var MODAL_ADDITIONNAL_CLASS_ATTR = 'data-modal-additionnal-class';
  var MODAL_TEXT_ATTR = 'data-modal-text';
  var MODAL_CONTENT_ID_ATTR = 'data-modal-content-id';
  var MODAL_DESCRIBEDBY_ID_ATTR = 'data-modal-describedby-id';
  var MODAL_TITLE_ATTR = 'data-modal-title';
  var MODAL_FOCUS_TO_ATTR = 'data-modal-focus-toid';
  var MODAL_CLOSE_TEXT_ATTR = 'data-modal-close-text';
  var MODAL_CLOSE_TITLE_ATTR = 'data-modal-close-title';
  var MODAL_CLOSE_IMG_ATTR = 'data-modal-close-img';
  var MODAL_ROLE = 'dialog';

  var MODAL_BUTTON_CLASS_SUFFIX = 'modalClose';
  var MODAL_BUTTON_JS_ID = 'js-modal-close';
  var MODAL_BUTTON_JS_CLASS = 'js-modal-close';
  var MODAL_BUTTON_CONTENT_BACK_ID = 'data-content-back-id';
  var MODAL_BUTTON_FOCUS_BACK_ID = 'data-focus-back';

  var MODAL_WRAPPER_CLASS_SUFFIX = 'modal__wrapper';
  var MODAL_CONTENT_CLASS_SUFFIX = 'modal__content';
  var MODAL_CONTENT_JS_ID = 'js-modal-content';

  var MODAL_CLOSE_IMG_CLASS_SUFFIX = 'modal__closeimg';
  var MODAL_CLOSE_TEXT_CLASS_SUFFIX = 'modal-close__text';

  var MODAL_TITLE_ID = 'modal-title';
  var MODAL_TITLE_CLASS_SUFFIX = 'modal-title';

  var FOCUSABLE_ELEMENTS_STRING = "a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]";
  var WRAPPER_PAGE_JS = 'js-modal-page';

  var MODAL_JS_ID = 'js-modal';

  var MODAL_OVERLAY_ID = 'js-modal-overlay';
  var MODAL_OVERLAY_CLASS_SUFFIX = 'modalOverlay';
  var MODAL_OVERLAY_TXT = 'Close modal';
  var MODAL_OVERLAY_BG_ENABLED_ATTR = 'data-background-click';

  var VISUALLY_HIDDEN_CLASS = 'invisible';
  var NO_SCROLL_CLASS = 'no-scroll';

  var ATTR_ROLE = 'role';
  var ATTR_OPEN = 'open';
  var ATTR_LABELLEDBY = 'aria-labelledby';
  var ATTR_DESCRIBEDBY = 'aria-describedby';
  var ATTR_HIDDEN = 'aria-hidden';
  //const ATTR_MODAL = 'aria-modal="true"';
  var ATTR_HASPOPUP = 'aria-haspopup';
  var ATTR_HASPOPUP_VALUE = 'dialog';

  var findById = function findById(id) {
    return doc.getElementById(id);
  };

  var addClass = function addClass(el, className) {
    if (el.classList) {
      el.classList.add(className); // IE 10+
    } else {
        el.className += ' ' + className; // IE 8+
      }
  };

  var removeClass = function removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className); // IE 10+
    } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' '); // IE 8+
      }
  };

  var hasClass = function hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className); // IE 10+
    } else {
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className); // IE 8+ ?
      }
  };
  /*const wrapInner = (el, wrapper_el) => { // doesn't work on IE/Edge, f…
      while (el.firstChild)
          wrapper_el.append(el.firstChild);
      el.append(wrapper_el);
   }*/
  function wrapInner(parent, wrapper) {
    if (typeof wrapper === "string") wrapper = document.createElement(wrapper);

    parent.appendChild(wrapper);

    while (parent.firstChild !== wrapper) wrapper.appendChild(parent.firstChild);
  }

  function remove(el) {
    /* node.remove() is too modern for IE≤11 */
    el.parentNode.removeChild(el);
  }

  /* gets an element el, search if it is child of parent class, returns id of the parent */
  var searchParent = function searchParent(el, parentClass) {
    var found = false;
    var parentElement = el.parentNode;
    while (parentElement && found === false) {
      if (hasClass(parentElement, parentClass) === true) {
        found = true;
      } else {
        parentElement = parentElement.parentNode;
      }
    }
    if (found === true) {
      return parentElement.getAttribute('id');
    } else {
      return '';
    }
  };


  /**
   * Create the template for a modal
   * @param  {Object} config
   * @return {String}
   */
  var createModal = function createModal(config) {

    var overlayId = MODAL_OVERLAY_ID;
    var overlayText = config.text || MODAL_OVERLAY_TXT;
    var overlayClass = config.prefixClass + MODAL_OVERLAY_CLASS_SUFFIX;
    var overlayBackgroundEnabled = config.backgroundEnabled === 'disabled' ? 'disabled' : 'enabled';

    var id = MODAL_JS_ID;
    var modalClassName = config.modalPrefixClass + MODAL_CLASS_SUFFIX;
    var modalAdditionnalClass = config.additionnalClass;
    var modalHeaderClassName = config.modalPrefixClass + MODAL_CLASS_SUFFIX + 'Header';
    var modalContentClassName = config.modalPrefixClass + MODAL_CLASS_SUFFIX + 'Content';
    var modalFooterClassName = config.modalPrefixClass + MODAL_CLASS_SUFFIX + 'Footer';
    var modalClassWrapper = config.modalPrefixClass + MODAL_WRAPPER_CLASS_SUFFIX;
    var buttonCloseClassName = config.modalPrefixClass + MODAL_BUTTON_CLASS_SUFFIX;
    var buttonCloseInner = config.modalCloseImgPath ? '<img src="' + config.modalCloseImgPath + '" alt="' + config.modalCloseText + '" class="' + config.modalPrefixClass + MODAL_CLOSE_IMG_CLASS_SUFFIX + '" />' : '' + config.modalCloseText + '';
    var contentClassName = config.modalPrefixClass + MODAL_CONTENT_CLASS_SUFFIX;
    var titleClassName = config.modalPrefixClass + MODAL_TITLE_CLASS_SUFFIX;
    var title = config.modalTitle !== '' ? '<h1 id="' + MODAL_TITLE_ID + '" class="' + titleClassName + '">\n                                          ' + config.modalTitle + '\n                                         </h1>' : '';
    var button_close = '<button type="button" class="' + MODAL_BUTTON_JS_CLASS + ' ' + buttonCloseClassName + '" id="' + MODAL_BUTTON_JS_ID + '" title="' + config.modalCloseTitle + '" ' + MODAL_BUTTON_CONTENT_BACK_ID + '="' + config.modalContentId + '" ' + MODAL_BUTTON_FOCUS_BACK_ID + '="' + config.modalFocusBackId + '">' + buttonCloseInner + '</button>';
    var content = config.modalText;
    var describedById = config.modalDescribedById !== '' ? ATTR_DESCRIBEDBY + '="' + config.modalDescribedById + '"' : '';

    // If there is no content but an id we try to fetch content id
    if (content === '' && config.modalContentId) {
      var contentFromId = findById(config.modalContentId);
      if (contentFromId) {
        content = '<div id="' + MODAL_CONTENT_JS_ID + '">' + contentFromId.innerHTML + '</div>';
        // we remove content from its source to avoid id duplicates, etc.
        contentFromId.innerHTML = '';
      }
    }

    return '<div id="' + overlayId + '" class="' + overlayClass + '" ' + MODAL_OVERLAY_BG_ENABLED_ATTR + '="' + overlayBackgroundEnabled + '"><dialog id="' + id + '" class="' + modalClassName + ' ' + modalAdditionnalClass + '" ' + ATTR_ROLE + '="' + MODAL_ROLE + '" ' + describedById + ' ' + ATTR_OPEN + ' ' + ATTR_LABELLEDBY + '="' + MODAL_TITLE_ID + '"><header class="' + modalHeaderClassName + '">' + button_close + ' ' + title + ' </header>  <div class="' + modalContentClassName + '">' + content + '<footer class="' + modalFooterClassName + ' flex flex-spacebetween"><button class="pm-button-blueborder js-modal-close">No</button><button class="pm-button-blue js-modal-close">Yes</button></footer></div></dialog></div>';
  };

  var closeModal = function closeModal(config) {

    remove(config.modal);
    remove(config.overlay);

    if (config.contentBackId !== '') {
      var contentBack = findById(config.contentBackId);
      if (contentBack) {
        contentBack.innerHTML = config.modalContent;
      }
    }

    if (config.modalFocusBackId) {
      var contentFocus = findById(config.modalFocusBackId);
      if (contentFocus) {
        contentFocus.focus();
      }
    }
  };

  /** Find all modals inside a container
   * @param  {Node} node Default document
   * @return {Array}
   */
  var $listModals = function $listModals() {
    var node = arguments.length <= 0 || arguments[0] === undefined ? doc : arguments[0];
    return [].slice.call(node.querySelectorAll('.' + MODAL_JS_CLASS));
  };

  /**
   * Build modals for a container
   * @param  {Node} node
   */
  var attach = function attach(node) {
    var addListeners = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    $listModals(node).forEach(function (modal_node) {

      var iLisible = Math.random().toString(32).slice(2, 12);
      var wrapperBody = findById(WRAPPER_PAGE_JS);
      var body = doc.querySelector('body');

      modal_node.setAttribute('id', MODAL_ID_PREFIX + iLisible);
      modal_node.setAttribute(ATTR_HASPOPUP, ATTR_HASPOPUP_VALUE);

      if (wrapperBody === null || wrapperBody.length === 0) {
        var wrapper = doc.createElement('DIV');
        wrapper.setAttribute('id', WRAPPER_PAGE_JS);
        wrapInner(body, wrapper);
      }
    });

    if (addListeners) {

      /* listeners */
      ['click', 'keydown'].forEach(function (eventName) {

        doc.body.addEventListener(eventName, function (e) {

          // click on link modal
          var parentModalLauncher = searchParent(e.target, MODAL_JS_CLASS);
          if ((hasClass(e.target, MODAL_JS_CLASS) === true || parentModalLauncher !== '') && eventName === 'click') {
            var body = doc.querySelector('body');
            var modalLauncher = parentModalLauncher !== '' ? findById(parentModalLauncher) : e.target;
            var modalPrefixClass = modalLauncher.hasAttribute(MODAL_PREFIX_CLASS_ATTR) === true ? modalLauncher.getAttribute(MODAL_PREFIX_CLASS_ATTR) + '-' : '';
            var modalAdditionnalClass = modalLauncher.hasAttribute(MODAL_ADDITIONNAL_CLASS_ATTR) === true ? modalLauncher.getAttribute(MODAL_ADDITIONNAL_CLASS_ATTR) : '';
            var modalText = modalLauncher.hasAttribute(MODAL_TEXT_ATTR) === true ? modalLauncher.getAttribute(MODAL_TEXT_ATTR) : '';
            var modalContentId = modalLauncher.hasAttribute(MODAL_CONTENT_ID_ATTR) === true ? modalLauncher.getAttribute(MODAL_CONTENT_ID_ATTR) : '';
            var modalDescribedById = modalLauncher.hasAttribute(MODAL_DESCRIBEDBY_ID_ATTR) === true ? modalLauncher.getAttribute(MODAL_DESCRIBEDBY_ID_ATTR) : '';
            var modalTitle = modalLauncher.hasAttribute(MODAL_TITLE_ATTR) === true ? modalLauncher.getAttribute(MODAL_TITLE_ATTR) : '';
            var modalCloseText = modalLauncher.hasAttribute(MODAL_CLOSE_TEXT_ATTR) === true ? modalLauncher.getAttribute(MODAL_CLOSE_TEXT_ATTR) : MODAL_OVERLAY_TXT;
            var modalCloseTitle = modalLauncher.hasAttribute(MODAL_CLOSE_TITLE_ATTR) === true ? modalLauncher.getAttribute(MODAL_CLOSE_TITLE_ATTR) : modalCloseText;
            var modalCloseImgPath = modalLauncher.hasAttribute(MODAL_CLOSE_IMG_ATTR) === true ? modalLauncher.getAttribute(MODAL_CLOSE_IMG_ATTR) : '';
            var backgroundEnabled = modalLauncher.hasAttribute(MODAL_DATA_BACKGROUND_ATTR) === true ? modalLauncher.getAttribute(MODAL_DATA_BACKGROUND_ATTR) : '';
            var modalGiveFocusToId = modalLauncher.hasAttribute(MODAL_FOCUS_TO_ATTR) === true ? modalLauncher.getAttribute(MODAL_FOCUS_TO_ATTR) : '';

            var wrapperBody = findById(WRAPPER_PAGE_JS);

            // insert overlay
            // body.insertAdjacentHTML('beforeEnd', createOverlay({
            //   text: modalCloseTitle,
            //   backgroundEnabled: backgroundEnabled,
            //   prefixClass: modalPrefixClass
            // }));

            // insert modal
            body.insertAdjacentHTML('beforeEnd', createModal({
              modalText: modalText,
              prefixClass: modalPrefixClass,
              additionnalClass: modalAdditionnalClass,
              modalPrefixClass: modalPrefixClass,
              backgroundEnabled: modalContentId,
              modalTitle: modalTitle,
              modalCloseText: modalCloseText,
              modalCloseTitle: modalCloseTitle,
              modalCloseImgPath: modalCloseImgPath,
              modalContentId: modalContentId,
              modalDescribedById: modalDescribedById,
              modalFocusBackId: modalLauncher.getAttribute('id'),
              backgroundEnabled: backgroundEnabled,
            }));

            // hide page
            wrapperBody.setAttribute(ATTR_HIDDEN, 'true');

            // add class noscroll to body
            addClass(body, NO_SCROLL_CLASS);

            // give focus to close button or specified element
            var closeButton = findById(MODAL_BUTTON_JS_ID);
            if (modalGiveFocusToId !== '') {
              var focusTo = findById(modalGiveFocusToId);
              if (focusTo) {
                focusTo.focus();
              } else {
                closeButton.focus();
              }
            } else {
              closeButton.focus();
            }

            e.preventDefault();
          }

          // click on close button or on overlay not blocked
          var parentButton = searchParent(e.target, MODAL_BUTTON_JS_CLASS);
          if ((e.target.getAttribute('id') === MODAL_BUTTON_JS_ID || parentButton !== '' || e.target.getAttribute('id') === MODAL_OVERLAY_ID || hasClass(e.target, MODAL_BUTTON_JS_CLASS) === true) && eventName === 'click') {
            var body = doc.querySelector('body');
            var wrapperBody = findById(WRAPPER_PAGE_JS);
            var modal = findById(MODAL_JS_ID);
            var modalContent = findById(MODAL_CONTENT_JS_ID) ? findById(MODAL_CONTENT_JS_ID).innerHTML : '';
            var overlay = findById(MODAL_OVERLAY_ID);
            var modalButtonClose = findById(MODAL_BUTTON_JS_ID);
            var modalFocusBackId = modalButtonClose.getAttribute(MODAL_BUTTON_FOCUS_BACK_ID);
            var contentBackId = modalButtonClose.getAttribute(MODAL_BUTTON_CONTENT_BACK_ID);
            var backgroundEnabled = overlay.getAttribute(MODAL_OVERLAY_BG_ENABLED_ATTR);

            if (!(e.target.getAttribute('id') === MODAL_OVERLAY_ID && backgroundEnabled === 'disabled')) {

              closeModal({
                modal: modal,
                modalContent: modalContent,
                overlay: overlay,
                modalFocusBackId: modalFocusBackId,
                contentBackId: contentBackId,
                backgroundEnabled: backgroundEnabled,
                fromId: e.target.getAttribute('id')
              });

              // show back page
              wrapperBody.removeAttribute(ATTR_HIDDEN);

              // remove class noscroll to body
              removeClass(body, NO_SCROLL_CLASS);
            }
          }

          // strike a key when modal opened
          if (findById(MODAL_JS_ID) && eventName === 'keydown') {
            var body = doc.querySelector('body');
            var wrapperBody = findById(WRAPPER_PAGE_JS);
            var modal = findById(MODAL_JS_ID);
            var modalContent = findById(MODAL_CONTENT_JS_ID) ? findById(MODAL_CONTENT_JS_ID).innerHTML : '';
            var overlay = findById(MODAL_OVERLAY_ID);
            var modalButtonClose = findById(MODAL_BUTTON_JS_ID);
            var modalFocusBackId = modalButtonClose.getAttribute(MODAL_BUTTON_FOCUS_BACK_ID);
            var contentBackId = modalButtonClose.getAttribute(MODAL_BUTTON_CONTENT_BACK_ID);
            var $listFocusables = [].slice.call(modal.querySelectorAll(FOCUSABLE_ELEMENTS_STRING));

            // esc
            if (e.keyCode === 27) {

              closeModal({
                modal: modal,
                modalContent: modalContent,
                overlay: overlay,
                modalFocusBackId: modalFocusBackId,
                contentBackId: contentBackId
              });

              // show back page
              wrapperBody.removeAttribute(ATTR_HIDDEN);

              // remove class noscroll to body
              removeClass(body, NO_SCROLL_CLASS);
            }

            // tab or Maj Tab in modal => capture focus
            if (e.keyCode === 9 && $listFocusables.indexOf(e.target) >= 0) {

              // maj-tab on first element focusable => focus on last
              if (e.shiftKey) {
                if (e.target === $listFocusables[0]) {
                  $listFocusables[$listFocusables.length - 1].focus();
                  e.preventDefault();
                }
              } else {
                // tab on last element focusable => focus on first
                if (e.target === $listFocusables[$listFocusables.length - 1]) {
                  $listFocusables[0].focus();
                  e.preventDefault();
                }
              }
            }

            // tab outside modal => put it in focus
            if (e.keyCode === 9 && $listFocusables.indexOf(e.target) === -1) {
              e.preventDefault();
              $listFocusables[0].focus();
            }
          }
        }, true);
      });
    }
  };

  var onLoad = function onLoad() {
    attach();
    document.removeEventListener('DOMContentLoaded', onLoad);
  };

  document.addEventListener('DOMContentLoaded', onLoad);

  window.van11yAccessibleModalWindowAria = attach;
})(document);




//var breakpoint = window.getComputedStyle(document.querySelector('body'), ':before').getPropertyValue('content').replace(/['"]+/g, '');

var whiteModeClass = 'is-whitemode';

['change'].forEach(function (eventName) {

    document.body.addEventListener(eventName, function (e) {

        var target = e.target;
        if (target.getAttribute('id') === 'white' ) {
                
            if ( document.body.classList.contains(whiteModeClass) ) {
                document.body.classList.remove(whiteModeClass);
            }
            else {
                document.body.classList.add(whiteModeClass);
            }
        }

    }, true);

});




/* resize window, updates breakpoints */

function resizeWindow(){
    var breakpoint = window.getComputedStyle(document.querySelector('body'), ':before').getPropertyValue('content').replace(/['"]+/g, '');
    var sidebar = document.body.querySelector('.js-sidebar');
    sidebar.classList.remove('nomobile');

    if ( breakpoint === 'mobile' ||  breakpoint === 'tinymobile' ){
        sidebar.setAttribute('aria-hidden', true);
    }
    else { 
        sidebar.removeAttribute('aria-hidden');
        }
}

resizeWindow();
window.addEventListener('resize', resizeWindow, false);



function togglemenu(){
    var burger_nav = document.body.querySelector('.js-togglemenu');
    var sidebar = document.body.querySelector('.js-sidebar');

    if (sidebar.getAttribute('aria-hidden') === null) {
        sidebar.setAttribute('aria-hidden', true);
        burger_nav.setAttribute('aria-expanded', false);
    }
    else { 
        sidebar.removeAttribute('aria-hidden'); 
        burger_nav.setAttribute('aria-expanded', true);
    }

}

var burger_nav = document.body.querySelector('.js-togglemenu');
burger_nav.addEventListener('click', togglemenu);



function copyCliboard(e){

    var copyButton = e.currentTarget;
    var codeToCopy = copyButton.previousElementSibling;
    var range = document.createRange();  
    range.selectNode(codeToCopy);  
    window.getSelection().addRange(range); 
    try {  
        // Now that we've selected the anchor text, execute the copy command  
        var successful = document.execCommand('copy');  
        var msg = successful ? 'successful' : 'unsuccessful';  
        // console.log('Copy email command was ' + msg);  
      } catch(err) {  
        // console.log('Oops, unable to copy');  
      }  

}

var copy_buttons = [].slice.call(document.querySelectorAll('.js-copy-clipboard'));

copy_buttons.forEach(function(elem) {
    elem.addEventListener("click", copyCliboard);
});


function removeNotification(e){
    var notification = e.currentTarget;
    setTimeout(function() {
        notification.parentNode.removeChild(notification);
    }, 3000);
    
}

function triggerNotification(e){
    var launcher = e.currentTarget;
    var notificationText = launcher.dataset.notificationText;
    var notificationType = launcher.dataset.notificationType;

    var oldNotifs = document.body.querySelectorAll('.js-notification');
    oldNotifs.forEach(function(notif) {
        notif.parentNode.removeChild(notif);
    });

    var notification = document.createElement("div");
    notification.classList.add('p1', 'js-notification', ('notification-' + notificationType) );
    //notification.setAttribute('aria-live', 'polite');
    notification.setAttribute('aria-atomic', 'true');
    notification.setAttribute('role', 'alert');
    notification.innerHTML = notificationText;

    document.body.appendChild(notification);

    notification.addEventListener("animationend", removeNotification);
};

var notifications = [].slice.call(document.body.querySelectorAll('.js-trigger-notification'));

notifications.forEach(function(elem) {
    elem.addEventListener("click", triggerNotification);
});


function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; 
  //The maximum is exclusive and the minimum is inclusive
}

function notYetMessage(){
   var messageNumber = getRandomInt(0, 5);
   switch (messageNumber) {
    case 0:
        alert('Not yet!');
      break;
    case 1:
        alert('Let’s finish PM V4 before, right?');
      break;
    case 2:
        alert('It will come soon, or later :)');
      break;
    case 3:
        alert('It will soon be done.');
      break;
    case 4:
        alert('Not yet available.');
      break;
    default:
        alert('Not yet!');
    }
   
};

var notYet = [].slice.call(document.body.querySelectorAll('.js-notyet'));

notYet.forEach(function(elem) {
    elem.addEventListener("click", notYetMessage );
});





window.addEventListener("load", function() {

  // get all scrollTo
  var scrollToLinks = [].slice.call(document.querySelectorAll('.js-scrollTo'));
  
  function onChange(elements) {
    elements.forEach(function(element) {
      if (element.intersectionRatio > 0.5) {
        //console.log(element);console.log('in the view');
        // remove 
        scrollToLinks.forEach(function(elem) {
          elem.removeAttribute('aria-current');
        });
        var link = document.querySelector('a[href="#'+ element.target.getAttribute('id') +'"]');
        link.setAttribute('aria-current', true);
      }
      // else {
      //   console.log(element);console.log('out the view');
      // }
    });
  }

  var elementsToObserve = [];

  scrollToLinks.forEach(function(elem) {
    // get all related contents
    var relatedDiv = document.querySelector(elem.getAttribute('href'));
    //console.log(elem);
    if ( relatedDiv ) {
      //console.log(relatedDiv);
      elementsToObserve.push(relatedDiv);
    }
  });

  if ('IntersectionObserver' in window) {
      // IntersectionObserver Supported
      let config = {
          root: null,
          rootMargin: '0px',
          threshold: 0.5
      };

      let observer = new IntersectionObserver(onChange, config);
      elementsToObserve.forEach(function(elem) {
        observer.observe(elem);
        // console.log('entry:', elem);
        // console.log('observer:', observer);
      });

  } else {
      // IntersectionObserver NOT Supported
      //console.log('Whomp Whomp Whomp');
  }

  function scrollToDiv( e ){
    var relatedDiv = document.querySelector(e.currentTarget.getAttribute('href'));
    e.preventDefault();

    if ( relatedDiv ){
      relatedDiv.scrollIntoView({
        behavior: "smooth"
      });

      history.pushState(null, null, location.pathname + location.search + '#' + relatedDiv.getAttribute('id'));

      scrollToLinks.forEach(function(elem) {
        elem.removeAttribute('aria-current');
      });
      var link = e.currentTarget;
      link.setAttribute('aria-current', true);

    }    

  }
  scrollToLinks.forEach(function(elem) {
    elem.addEventListener("click", scrollToDiv );
  });

});






function dropDownExpand( e ) {
  var dropDownButton = e.currentTarget;
  var content = dropDownButton.nextElementSibling;

  if ( dropDownButton.getAttribute('aria-expanded') === 'false' ) {
    content.removeAttribute('hidden');
    dropDownButton.setAttribute('aria-expanded', true);
  }
  else { 
        content.setAttribute('hidden', true);
        dropDownButton.setAttribute('aria-expanded', false);
      }

}



var dropDowns = [].slice.call(document.body.querySelectorAll('.js-dropDown-button'));

dropDowns.forEach(function(elem) {
    elem.addEventListener("click", dropDownExpand );
});



function toggleLoadings( e ) {
  var loadingButton = e.currentTarget;
  var content = loadingButton.nextElementSibling;

  if ( content.getAttribute('aria-busy') === 'true' ) {
    content.removeAttribute('aria-busy');
  }
  else { 
        content.setAttribute('aria-busy', true);
      }

}



var loadings = [].slice.call(document.body.querySelectorAll('.js-activate-loading'));

loadings.forEach(function(elem) {
    elem.addEventListener("click", toggleLoadings );
});