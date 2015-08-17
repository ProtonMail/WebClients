angular.module("proton.tools", ["proton.constants"])
    .factory("tools", function($log, $sanitize, $state, $compile, $templateCache, $q, errorReporter, CONSTANTS) {
        function has_session_storage() {
            var mod = 'modernizr';

            try {
                sessionStorage.setItem(mod, mod);
                sessionStorage.removeItem(mod);
                return true;
            } catch (e) {
                return false;
            }
        }

        function get_browser() {
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
        }

        function get_browser_version() {
            var N = navigator.appName,
                ua = navigator.userAgent,
                tem;
            var M = ua.match(/(opera|chrome|safari|firefox|msie|edge)\/?\s*(\.?\d+(\.\d+)*)/i);

            if (M && (tem = ua.match(/version\/([\.\d]+)/i)) !== null) {
                M[2] = tem[1];
            }

            M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];

            return M[1];
        }

        function is_good_prng_available() {
            if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
                return true;
            } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
                return true;
            } else {
                return false;
            }
        }

        function get_os() {
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

            return OSName;
        }

        function get_device() {
            var deviceName = "other";

            // if (navigator.userAgent.match(/Android/i)) deviceName = "android";
            // if (navigator.userAgent.match(/BlackBerry/i)) deviceName = "blackberry";
            // if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) deviceName = "ios";
            // if (navigator.userAgent.match(/Opera Mini/i)) deviceName = "opera";
            // if (navigator.userAgent.match(/IEMobile/i)) deviceName = "windowsPhone"

            return deviceName;
        }

        function find_bootstrap_environment() {
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
        }

        function change_separator_to_comma(address_list) {
            address_list = address_list.replace(';', ',');
            return address_list;
        }

        function host_reachable() {
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
        }

        function is_valid_dkim(header) {
            if ((header.indexOf('dkim=none') === -1) && (header.indexOf('dkim=pass') !== -1)) {
                return true;
            } else {
                return false;
            }
        }

        function break_images(html) {
            html = html.replace(/src=/g, " data-src=");
            html = html.replace(/xlink:href=/g, "data-xlink:href=");
            html = html.replace(/poster=/g, " data-poster=");
            html = html.replace(/background=/g, " data-background=");
            return html.replace(/url\(/g, "data-url(");
        }

        function fix_images(html) {
            html = html.replace(/data-src=/g, " src=");
            html = html.replace(/data-xlink:href=/g, "xlink:href=");
            html = html.replace(/data-poster=/g, " poster=");
            html = html.replace(/data-background=/g, " background=");
            return html.replace(/data-url\(/g,  "url(");
        }

        function is_html($string) {
            return $string.match(/<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/);
        }

        // Squire does this funny thing where it takes style tags, i.e.
        // <style> *my css here* </style>
        // and removes the tags but leaves the css text. Need to manually remove the text
        function remove_style(html) {
            return html.replace(/<style[\s\S]*?\/style>/ig, " "); // For squire
        }

        // convert html to plaintext
        function html_to_plaintext(html) {
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
        }

        // Replace ::marker:: by <blockquote>
        function block(html, mode) {
            if(mode === 'start') {
                return html.replace(/<blockquote>/g, '::blockquote::open::').replace(/<\/blockquote>/g, '::blockquote::close::');
            } else if(mode === 'end') {
                return html.replace(/::blockquote::open::/g, '').replace(/::blockquote::close::/g, '').replace(/\n/g, "<br />");
            }
        }

        // Add '>' to the beginning of each <blockquote>
        function quote(html) {
            var separator = '::blockquote::open::';
            var index = html.indexOf(separator);
            var first = "";
            var second = "";

            if(index !== -1) {
                first = html.substring(0, index);
                second = html.substring(index + '::blockquote::open::'.length).replace(/\n/g, '\n > ');
                return first + '\n > ' + quote(second);
            } else {
                return html;
            }

            return html;
        }

        function plaintext_to_html(plain) {
            // Converting images
            plain = plain.replace(/!\[(.*?)\]\((.*?)\)/gi, '<img src="$2" alt="$1" title="$1" />');
            // Converting link
            html = plain.replace(/\[(.*?)\]\((.*?)\)/gi, '<a href="$2">$1</a>');

            return html;
        }

        // http://stackoverflow.com/a/2876633
        function clean_word(in_word_text) {
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
        }

        function fix_redirect_exploits(html) {
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
        }

        function valid_email(value) {
            var filter = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$";

            return String(value).search(filter) !== -1;
        }

        function is_compatible() {
            var compatible = true;

            if (!has_session_storage()) {
                compatible = false;
            }

            if (!is_good_prng_available()) {
                compatible = false;
            }

            return compatible;
        }

        // get user max and current storage, and return a string "123.3/456.6 GB"
        function render_storage_bar(current, max) {
            var kb = 1024;
            var mb = kb*kb;
            var gb = mb*kb;
            var cur = current / kb; // convert to KB

            if (max < gb) {
                // render bar in terms of MB
                cur = (cur/kb).toFixed(1);

                if (cur < 0.01) {
                    cur = 0.01;
                }

                return Number(cur) + '/' + Number(Math.round(max/kb/kb)) + ' MB';
            } else {
                // render bar in terms of GB
                cur = (cur/kb/kb).toFixed(2);

                if (cur < 0.01) {
                    cur = 0.01;
                }

                return Number(cur) + '/' + Number(Math.round(max/kb/kb/kb)) + ' GB';
            }
        }

        function get_template (templateName) {
          var defer = $q.defer();

          if ($templateCache.get(templateName)) {
             defer.resolve($templateCache.get(templateName));
          } else {
             $http.get(templateName, {cache: $templateCache}).then(function(data){
                defer.resolve(data);
             });
          }

          return defer.promise;
       }

       function compile_template (templateName) {
          var defer = $q.defer();

          get_template(templateName).then(function(template){
             defer.resolve($compile(template));
          });

          return defer.promise;
       }

       function replace_line_breaks(content) {
            return content.replace(/(?:\r\n|\r|\n)/g, '<br />');
       }

       function transform_links(id) {
           $('#' + id).find('a[href^=http]').attr('target','_blank').attr('rel', 'noreferrer');
       }

       function contains_image(content) {
           return content.match('<img') !== null;
       }

       function clear_image_body(content) {
           if(contains_image(content)) {
               return break_images(content);
           } else {
               return content;
           }
       }

       function restore_image_body(content) {
           if(contains_image(content)) {
               return fix_images(content);
           } else {
               return content;
           }
       }

        var tools = {
            getTemplate: get_template,
            compileTemplate: compile_template,
            block: block,
            quote: quote,
            fixRedirectExploits: fix_redirect_exploits,
            plaintext: html_to_plaintext,
            html: plaintext_to_html,
            cleanWord: clean_word,
            removeStyle: remove_style,
            breakImages: break_images,
            fixImages: fix_images,
            changeSeparatorToComma: change_separator_to_comma,
            hostReachable: host_reachable,
            findBootstrapEnvironment: find_bootstrap_environment,
            getOs: get_os(),
            getDevice: get_device(),
            getBrowser: get_browser(),
            getBrowserVersion: get_browser_version(),
            isCompatible: is_compatible,
            validEmail: valid_email,
            is_valid_dkim: is_valid_dkim,
            renderStorageBar: render_storage_bar,
            replaceLineBreaks: replace_line_breaks,
            isHtml: is_html,
            transformLinks: transform_links,
            clearImageBody: clear_image_body,
            restoreImageBody: restore_image_body,
            containsImage: contains_image,
            contactsToString: function(contacts) {
                return _.map(contacts, function(m) { return m.Address; }).join(',');
            },
            getCurrentLocation: function() {
                var mailbox = tools.getCurrentMailbox();

                if(mailbox) {
                    return CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
                } else {
                    return false;
                }
            },
            getCurrentMailbox: function() {
                var mailbox = $state.current.name.replace('secured.', '');

                if(_.contains(Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS), mailbox)) {
                    return mailbox;
                } else {
                    return false;
                }
            }
        };

        return tools;
    });
