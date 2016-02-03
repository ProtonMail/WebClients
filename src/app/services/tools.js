angular.module("proton.tools", ["proton.constants"])
.factory("tools", function($log, $state, $stateParams, $compile, $templateCache, $q, $window, CONSTANTS) {
    var tools = {};
    var setPublishableKeyForStripe = function() {
        $window.Stripe.setPublishableKey(CONSTANTS.STRIPE_API_KEY);
    };

    /**
     * Load stripe script https://stripe.com/docs/stripe.js
     */
    tools.loadStripe = function() {
        // First, we check if Stripe JS is already loaded
        if (angular.isUndefined($window.Stripe)) {
            var script = $window.document.createElement('script');

            script.type= 'text/javascript';
            script.src = 'https://js.stripe.com/v2/';
            $window.document.body.appendChild(script);


            if(script.readyState) { // IE
                script.onreadystatechange = function() {
                    if ( script.readyState === "loaded" || script.readyState === "complete" ) {
                        script.onreadystatechange = null;
                        setPublishableKeyForStripe();
                    }
                };
            } else { // Others
                script.onload = function() {
                    setPublishableKeyForStripe();
                };
            }
        }
    };

    tools.hasSessionStorage = function() {
        var mod = 'modernizr';

        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch (error) {
            return false;
        }
    };

    tools.getBrowser = function() {
        var browser;
        var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
        var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
        var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
        // At least Safari 3+: "[object HTMLElementConstructor]"
        var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
        var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
        var isEdge = (/Edge\/12./i).test(navigator.userAgent);

        if(isOpera) { browser = 'Opera'; }
        if(isFirefox) { browser = 'Firefox'; }
        if(isSafari) { browser = 'Safari'; }
        if(isChrome) { browser = 'Chrome'; }
        if(isIE) { browser = 'Internet Explorer'; }
        if(isEdge) { browser = 'Edge'; }

        return browser;
    };

    tools.getBrowserVersion = function() {
        return jQuery.browser.version;
    };

    tools.prngAvailable = function() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
            return true;
        } else {
            return false;
        }
    };

    tools.getOs = function() {
        var OSName = "other"; // Unknown OS

        if (navigator.appVersion.indexOf("Win") !== -1) {
            OSName = "windows";
        }

        if (navigator.appVersion.indexOf("Mac") !== -1) {
            OSName = "osx";
        }

        if (navigator.appVersion.indexOf("X11") !== -1) {
            OSName = "linux";
        }

        if (navigator.appVersion.indexOf("Linux") !== -1) {
            OSName = "linux";
        }

        if(/(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
            OSName = "ios";
        }

        return OSName;
    };

    tools.getDevice = function() {
        var deviceName = "other";

        // if (navigator.userAgent.match(/Android/i)) deviceName = "android";
        // if (navigator.userAgent.match(/BlackBerry/i)) deviceName = "blackberry";
        // if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) deviceName = "ios";
        // if (navigator.userAgent.match(/Opera Mini/i)) deviceName = "opera";
        // if (navigator.userAgent.match(/IEMobile/i)) deviceName = "windowsPhone"

        return deviceName;
    };

    tools.findBootstrapEnvironment = function() {
        var envs = ['xs', 'sm', 'md', 'lg'];

        $el = $('<div>');
        $el.appendTo($('body'));

        for (var i = envs.length - 1; i >= 0; i--) {
            var env = envs[i];

            $el.addClass('hidden-' + env);
            if ($el.is(':hidden')) {
                $el.remove();
                return env;
            }
        }
    };

    tools.changeSeparatorToComma = function(address_list) {
        address_list = address_list.replace(';', ',');

        return address_list;
    };

    tools.hostReachable = function() {
        // Handle IE and more capable browsers
        var xhr;

        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        // Open new request as a HEAD to the root hostname with a random param to bust the cache
        xhr.open("GET", "//" + window.location.hostname + "/?rand=" + Math.floor((1 + Math.random()) * 0x10000), false);

        // Issue request and handle response
        try {
            xhr.send();
            return (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304));
        } catch (error) {
            return false;
        }
    };

    tools.is_valid_dkim = function(header) {
        if (header && (header.indexOf('dkim=none') === -1) && (header.indexOf('dkim=pass') !== -1)) {
            return true;
        } else {
            return false;
        }
    };

    tools.breakImages = function(html) {
        html = html.replace(/\ssrc='/g, " data-src='");
        html = html.replace(/\ssrc="/g, " data-src=\"");
        html = html.replace(/xlink:href=/g, "data-xlink:href=");
        html = html.replace(/poster=/g, " data-poster=");
        html = html.replace(/background=/g, " data-background=");
        html = html.replace(/url\(/g, "data-url(");

        return html;
    };

    tools.fixImages = function(html) {
        html = html.replace(/data-src='/g, " src='");
        html = html.replace(/data-src="/g, " src=\"");
        html = html.replace(/data-xlink:href=/g, "xlink:href=");
        html = html.replace(/data-poster=/g, " poster=");
        html = html.replace(/data-background=/g, " background=");
        html = html.replace(/data-url\(/g,  "url(");

        return html;
    };

    /**
     * Detect if the content is type of HTML
     */
    tools.isHtml = function(content) {
        return angular.isArray(content.match(/<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/));
    };

    // Squire does this funny thing where it takes style tags, i.e.
    // <style> *my css here* </style>
    // and removes the tags but leaves the css text. Need to manually remove the text
    tools.removeStyle = function(html) {
        return html.replace(/<style[\s\S]*?\/style>/ig, " "); // For squire
    };

    // convert html to plaintext
    tools.plaintext = function(html) {
        html = html.replace(/<a.*?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/igm, "[$2]($1)"); // replace link
        html = html.replace(/<img.*?src=["']([^"']*)["'][^>]*>/igm, "![image]($1)"); // replace image
        html = html.replace(/<style([\s\S]*?)<\/style>/gi, '');
        html = html.replace(/<script([\s\S]*?)<\/script>/gi, '');
        html = html.replace(/<\/div>/ig, '\n');
        html = html.replace(/<\/li>/ig, '\n');
        html = html.replace(/<li>/ig, '  *  ');
        html = html.replace(/<\/ul>/ig, '\n');
        html = html.replace(/<\/p>/ig, '\n');
        html = html.replace(/<br\s*[\/]?>/gi, "\n");
        html = html.replace(/<[^>]+>/ig, '');
        html = html.replace(/<\/h(\d)*>/gi, "\n");
        html = jQuery('<div>').html(html).text();
        html = html.replace(/</gi, "&lt;");
        html = html.replace(/>/gi, "&gt;");

        return html;
    };

    // Replace ::marker:: by <blockquote>
    tools.block = function(html, mode) {
        if(mode === 'start') {
            return html.replace(/<blockquote>/g, '::blockquote::open::').replace(/<\/blockquote>/g, '::blockquote::close::');
        } else if(mode === 'end') {
            return html.replace(/::blockquote::open::/g, '').replace(/::blockquote::close::/g, '').replace(/\n/g, "<br />");
        }
    };

    // Add '>' to the beginning of each <blockquote>
    tools.quote = function(html) {
        var separator = '::blockquote::open::';
        var index = html.indexOf(separator);
        var first = "";
        var second = "";

        if(index !== -1) {
            first = html.substring(0, index);
            second = html.substring(index + '::blockquote::open::'.length).replace(/\n/g, '\n > ');

            return first + '\n > ' + tools.quote(second);
        } else {
            return html;
        }

        return html;
    };

    tools.html = function(plain) {
        var html;

        // Converting images
        plain = plain.replace(/!\[(.*?)\]\((.*?)\)/gi, '<img src="$2" alt="$1" title="$1" />');
        // Converting link
        html = plain.replace(/\[(.*?)\]\((.*?)\)/gi, '<a href="$2">$1</a>');

        return html;
    };

    // http://stackoverflow.com/a/2876633
    tools.cleanWord = function(in_word_text) {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = in_word_text;
        var newString = tmp.textContent || tmp.innerText;
        // this next piece converts line breaks into break tags
        // and removes the seemingly endless crap code
        newString = newString.replace(/\n\n/g, "<br />").replace(/.*<!--.*-->/g, "");
        // this next piece removes any break tags (up to 10) at beginning
        for (i = 0; i < 10; i++) {
            if (newString.substr(0, 6) === "<br />") {
                newString = newString.replace("<br />", "");
            }
        }
    };

    tools.fixRedirectExploits = function(html) {
        /* #Exploits that will log a user out:
        <link rel="dns-prefetch" href="../../../../../../../../../../sign-out">
        <video poster="../../../../../../../../../../sign-out" autoplay="true" src="../../../../../../../../../../sign-out"></video>
        <img src="#" srcset="../../../../../../../../../../sign-out 1x">
        <p style="content:url('../../../../../../../../../../sign-out')"></p>
        <object data="../../../../../../../../../../sign-out" type="image/jpeg"></object>
        <link rel="stylesheet" type="text/css" href="../../../../../../../../../../sign-out">
        <style type="text/css">@import '../../../../../../../../../../sign-out';</style>
        <link rel="prefetch" href="../../../../../../../../../../sign-out">
        */

        // video tags
        html = html.replace(/<(video*)\b[^>]*>(.*?)<\/\1>/ig, "");

        // object tags
        html = html.replace(/<(object*)\b[^>]*>(.*?)<\/\1>/ig, "");

        // style tags
        html = html.replace(/<(style*)\b[^>]*>(.*?)<\/\1>/ig, "");
        html = html.replace(/<(iframe*)\b[^>]*>(.*?)<\/\1>/ig, "");

        // link tags
        html = html.replace(/<(link*)\b[^>]*>/ig, "");

        // svg tags
        html = html.replace(/<(svg*)\b[^>]*>(.*?)<\/\1>/ig, "");

        // remove malicious attributes
        html = html.replace(/srcset/ig, "");
        html = html.replace(/content:/ig, "");
        html = html.replace(/url\(/ig, "");
        html = html.replace(/dns-prefetch/ig, "");
        html = html.replace(/@import/ig, "");

        return html;
    };

    tools.validEmail = function(value) {
        var filter = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$";

        return String(value).search(filter) !== -1;
    };

    tools.isCompatible = function() {
        var compatible = true;

        if (!tools.hasSessionStorage()) {
            compatible = false;
        }

        if (!tools.prngAvailable()) {
            compatible = false;
        }

        return compatible;
    };

    // get user max and current storage, and return a string "123.3/456.6 GB"
    tools.renderStorageBar = function(current, max) {
        var kb = 1024;
        var mb = kb*kb;
        var gb = mb*kb;
        var cur = (current/kb).toFixed(0); // convert to KB

        if (max < gb) {
            // render bar in terms of MB such as "785.4 MB"
            cur = (cur/kb).toFixed(1);

            if (0 < Number(cur) && Number(cur) < 0.01) {
                cur = 0.01;
            }

            return Number(cur) + '/' + Number(Math.round(max/kb/kb)) + ' MB';
        } else {
            // render bar in terms of GB such as "15.23 GB"
            cur = (cur/kb/kb).toFixed(2);

            if (0 < Number(cur) && Number(cur) < 0.01) {
                cur = 0.01;
            }

            return Number(cur) + '/' + Number(Math.round(max/kb/kb/kb)) + ' GB';
        }
    };

    tools.getTemplate = function(templateName) {
        var deferred = $q.defer();

        if ($templateCache.get(templateName)) {
            deferred.resolve($templateCache.get(templateName));
        } else {
            $http.get(templateName, {cache: $templateCache}).then(function(data){
                deferred.resolve(data);
            }, function(error) {
                $log.error(error);
                deferred.reject();
            });
        }

        return deferred.promise;
    };

    tools.compileTemplate = function(templateName) {
        var defer = $q.defer();

        tools.getTemplate(templateName).then(function(template){
            defer.resolve($compile(template));
        }, function(error) {
            $log.error(error);
        });

        return defer.promise;
    };

    tools.replaceLineBreaks = function(content) {
        return content.replace(/(?:\r\n|\r|\n)/g, '<br />');
    };

    tools.containsImage = function(content) {
        return content.match('<img') !== null;
    };

    tools.clearImageBody = function(content) {
        if(tools.containsImage(content)) {
            return tools.breakImages(content);
        } else {
            return content;
        }
    };

    tools.restoreImageBody = function(content) {
        if(tools.containsImage(content)) {
            return tools.fixImages(content);
        } else {
            return content;
        }
    };

    tools.contactsToString = function(contacts) {
        return _.map(contacts, function(m) { return m.Address; }).join(',');
    };

    tools.currentLocation = function() {
        var mailbox = tools.currentMailbox();
        var loc; // Don't choose location

        switch(mailbox) {
            case 'label':
                loc = $stateParams.label;
                break;
            default:
                loc = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
                break;
        }

        return loc;
    };

    tools.currentMailbox = function() {
        var mailbox = $state.$current.name.replace('secured.', '').replace('.view', '');

        if(_.contains(Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS), mailbox)) {
            return mailbox;
        } else {
            return false;
        }
    };

    tools.typeList = function() {
        if(['search', 'drafts'].indexOf(tools.currentMailbox()) !== -1) {
            return 'message';
        } else {
            return 'conversation';
        }
    };

    /**
     * Check if the request is in a cache context
     * @return {Boolean}
     */
    tools.cacheContext = function() {
        var context = !$state.is('secured.search') && angular.isUndefined($stateParams.filter) && angular.isUndefined($stateParams.sort);

        return context;
    };

    return tools;
});
