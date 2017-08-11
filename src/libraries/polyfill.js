(function(DOMParser) {
	var DOMParser_proto = DOMParser.prototype;
    var real_parseFromString = DOMParser_proto.parseFromString;

	// Firefox/Opera/IE throw errors on unsupported types
	try {
		// WebKit returns null on unsupported types
		if ((new DOMParser).parseFromString('', 'text/html')) {
			// text/html parsing is natively supported
			return;
		}
	} catch (ex) {}

	DOMParser_proto.parseFromString = function(markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var
			  doc = document.implementation.createHTMLDocument('')
			;
	      		if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        			doc.documentElement.innerHTML = markup;
      			}
      			else {
        			doc.body.innerHTML = markup;
      			}
			return doc;
		} else {
			return real_parseFromString.apply(this, arguments);
		}
	};
}(DOMParser));
/**
 * The requestAnimationFrame polyfill
 * Paul Irish.
 * {@link http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/}
 */
/*  eslint no-underscore-dangle: "off" */
window._rAF = window._rAF || (function () {
    return window.requestAnimationFrame ||
     window.webkitRequestAnimationFrame ||
     window.mozRequestAnimationFrame ||
     function (callback) {
         window.setTimeout(callback, 16);
     };
})();
