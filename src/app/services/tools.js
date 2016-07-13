angular.module("proton.tools", ["proton.constants"])
.factory("tools", function($log, $state, $stateParams, authentication, $compile, $templateCache, $rootScope, $q, CONSTANTS) {
    var tools = {};

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

    tools.hasCookie = function() {
        return navigator.cookieEnabled;
    };

    tools.mobileResponsive = function() {
        var bodyWidth = $('body').outerWidth();

        if (bodyWidth > CONSTANTS.MOBILE_BREAKPOINT) {
            $rootScope.mobileMode = false;
        } else if (bodyWidth <= CONSTANTS.MOBILE_BREAKPOINT) {
            $rootScope.mobileMode = true;
        }
    };

    tools.colors = function() {
        return [
            '#7272a7',
            '#8989ac',

            '#cf5858',
            '#cf7e7e',

            '#c26cc7',
            '#c793ca',

            '#7569d1',
            '#9b94d1',

            '#69a9d1',
            '#a8c4d5',

            '#5ec7b7',
            '#97c9c1',

            '#72bb75',
            '#9db99f',

            '#c3d261',
            '#c6cd97',

            '#e6c04c',
            '#e7d292',

            '#e6984c',
            '#dfb286'
        ];
    };

    tools.getBrowser = function() {
        return $.browser.name;
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
        var $el = $('<div>');

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

        function replace(regex,html) {

            return html.replace(regex, function(match, $1, $2, offset, original) {
                 return 'proton-' + match;
            });

        }

        var re = new RegExp('(svg|src=|background=|poster=)', 'g');
        html = replace(re,html);

        var url = new RegExp(/url\(/ig);
        html = replace(url,html);

        return html;
    };

    tools.fixImages = function(html) {

        var re = new RegExp('(proton-url|proton-src|proton-svg|proton-background|proton-poster)', 'g');

        html = html.replace(re, function(match, $1, $2, offset, original) {
            return $1.substring(7);
        });

        return html;
    };


    /**
     * Detect if the content is type of HTML
     */
    tools.isHtml = function(content) {
        if (content) {
            var doc = new DOMParser().parseFromString(content, 'text/html');

            if (doc) {
                return Array.from(doc.body.childNodes).some(function(node) { return node.nodeType === 1; });
            } else {
                return true;
            }
        } else {
            return true;
        }
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

        var url = new RegExp(/url\(/ig);
        var src = new RegExp('src=(?!"blob:|"cid:)', 'g');        
        var bg = new RegExp('background=', 'g');
        var poster = new RegExp('poster=', 'g');
        var svg = new RegExp('svg', 'g');

        var re = new RegExp(url.source + "|" + src.source + "|" + bg.source + "|" + poster.source + "|" + svg.source );
        return re.test(content);

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

    tools.currentLocation = function(labelIDs) {
        var loc; // Don't choose location

        if (angular.isDefined(labelIDs)) {
            loc = _.intersection(labelIDs, [
                CONSTANTS.MAILBOX_IDENTIFIERS.inbox,
                CONSTANTS.MAILBOX_IDENTIFIERS.drafts,
                CONSTANTS.MAILBOX_IDENTIFIERS.sent,
                CONSTANTS.MAILBOX_IDENTIFIERS.trash,
                CONSTANTS.MAILBOX_IDENTIFIERS.spam,
                CONSTANTS.MAILBOX_IDENTIFIERS.archive
            ])[0];
        } else {
            var mailbox = tools.currentMailbox();

            if (mailbox === 'label') {
                loc = $stateParams.label;
            } else {
                loc = CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];
            }
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
        var context = $state.is('secured.search') === false && $state.is('secured.search.view') === false && angular.isUndefined($stateParams.filter) && angular.isUndefined($stateParams.sort);

        return context;
    };

    tools.countries = [
        {value: 'AF', label: 'Afghanistan'},
        {value: 'AL', label: 'Albania'},
        {value: 'DZ', label: 'Algeria'},
        {value: 'AD', label: 'Andorra'},
        {value: 'AO', label: 'Angola'},
        {value: 'AI', label: 'Anguilla'},
        {value: 'AG', label: 'Antigua and Barbuda'},
        {value: 'AR', label: 'Argentina'},
        {value: 'AM', label: 'Armenia'},
        {value: 'AW', label: 'Aruba'},
        {value: 'AU', label: 'Australia'},
        {value: 'AT', label: 'Austria'},
        {value: 'AZ', label: 'Azerbaijan'},
        {value: 'BS', label: 'Bahamas'},
        {value: 'BH', label: 'Bahrain'},
        {value: 'BD', label: 'Bangladesh'},
        {value: 'BB', label: 'Barbados'},
        {value: 'BY', label: 'Belarus'},
        {value: 'BE', label: 'Belgium'},
        {value: 'BZ', label: 'Belize'},
        {value: 'BJ', label: 'Benin'},
        {value: 'BM', label: 'Bermuda'},
        {value: 'BT', label: 'Bhutan'},
        {value: 'BO', label: 'Bolivia'},
        {value: 'BA', label: 'Bosnia Herzegovina'},
        {value: 'BW', label: 'Botswana'},
        {value: 'BV', label: 'Bouvet Island'},
        {value: 'BR', label: 'Brazil'},
        {value: 'IO', label: 'British Indian Ocean Territory'},
        {value: 'VG', label: 'British Virgin Islands'},
        {value: 'BN', label: 'Brunei Darussalam'},
        {value: 'BG', label: 'Bulgaria'},
        {value: 'BF', label: 'Burkina Faso'},
        {value: 'BI', label: 'Burundi'},
        {value: 'KH', label: 'Cambodia'},
        {value: 'CM', label: 'Cameroon'},
        {value: 'CA', label: 'Canada', priority: 4},
        {value: 'CV', label: 'Cape Verde'},
        {value: 'KY', label: 'Cayman Islands'},
        {value: 'CF', label: 'Central African Republic'},
        {value: 'TD', label: 'Chad'},
        {value: 'CL', label: 'Chile'},
        {value: 'CN', label: 'China'},
        {value: 'CX', label: 'Christmas Island'},
        {value: 'CC', label: 'Cocos (Keeling) Islands'},
        {value: 'CO', label: 'Colombia'},
        {value: 'KM', label: 'Comoros'},
        {value: 'CG', label: 'Congo'},
        {value: 'CD', label: 'Congo (The Democratic Republic of the)'},
        {value: 'CK', label: 'Cook Islands'},
        {value: 'CR', label: 'Costa Rica'},
        {value: 'CI', label: 'Cote d Ivoire (Ivory Coast)'},
        {value: 'HR', label: 'Croatia'},
        {value: 'CU', label: 'Cuba'},
        {value: 'CY', label: 'Cyprus'},
        {value: 'CZ', label: 'Czech Republic'},
        {value: 'DK', label: 'Denmark'},
        {value: 'DJ', label: 'Djibouti'},
        {value: 'DM', label: 'Dominica'},
        {value: 'DO', label: 'Dominican Republic'},
        {value: 'TL', label: 'East Timor'},
        {value: 'EC', label: 'Ecuador'},
        {value: 'EG', label: 'Egypt'},
        {value: 'SV', label: 'El Salvador'},
        {value: 'GQ', label: 'Equatorial Guinea'},
        {value: 'ER', label: 'Eritrea'},
        {value: 'EE', label: 'Estonia'},
        {value: 'ET', label: 'Ethiopia'},
        {value: 'FK', label: 'Falkland Islands (Malvinas)'},
        {value: 'FO', label: 'Faroe Islands'},
        {value: 'FJ', label: 'Fiji'},
        {value: 'FI', label: 'Finland'},
        {value: 'FR', label: 'France', priority: 5},
        {value: 'GF', label: 'French Guiana'},
        {value: 'PF', label: 'French Polynesia'},
        {value: 'TF', label: 'French Southern Territories'},
        {value: 'GA', label: 'Gabon'},
        {value: 'GM', label: 'Gambia'},
        {value: 'GE', label: 'Georgia'},
        {value: 'DE', label: 'Germany'},
        {value: 'GH', label: 'Ghana'},
        {value: 'GI', label: 'Gibraltar'},
        {value: 'GR', label: 'Greece'},
        {value: 'GL', label: 'Greenland'},
        {value: 'GD', label: 'Grenada'},
        {value: 'GP', label: 'Guadeloupe'},
        {value: 'GT', label: 'Guatemala'},
        {value: 'GN', label: 'Guinea'},
        {value: 'GW', label: 'Guinea-Bissau'},
        {value: 'GY', label: 'Guyana'},
        {value: 'HT', label: 'Haiti'},
        {value: 'HM', label: 'Heard Island and McDonald Islands'},
        {value: 'VA', label: 'Holy See (Vatican City State)'},
        {value: 'HN', label: 'Honduras'},
        {value: 'HK', label: 'Hong Kong'},
        {value: 'HU', label: 'Hungary'},
        {value: 'IS', label: 'Iceland'},
        {value: 'IN', label: 'India'},
        {value: 'ID', label: 'Indonesia'},
        {value: 'IQ', label: 'Iraq'},
        {value: 'IE', label: 'Ireland'},
        {value: 'IR', label: 'Islamic Republic of Iran'},
        {value: 'IL', label: 'Israel'},
        {value: 'IT', label: 'Italy'},
        {value: 'JM', label: 'Jamaica'},
        {value: 'JP', label: 'Japan'},
        {value: 'JO', label: 'Jordan'},
        {value: 'KZ', label: 'Kazakhstan'},
        {value: 'KE', label: 'Kenya'},
        {value: 'KI', label: 'Kiribati'},
        {value: 'KP', label: 'Korea (Democratic People s Republic of)'},
        {value: 'KR', label: 'Korea (Republic of)'},
        {value: 'KW', label: 'Kuwait'},
        {value: 'KG', label: 'Kyrgzstan'},
        {value: 'LA', label: 'Lao People s Democratic Republic'},
        {value: 'LV', label: 'Latvia'},
        {value: 'LB', label: 'Lebanon'},
        {value: 'LS', label: 'Lesotho'},
        {value: 'LR', label: 'Liberia'},
        {value: 'LY', label: 'Libyan Arab Jamahiriya'},
        {value: 'LI', label: 'Liechtenstein'},
        {value: 'LT', label: 'Lithuania'},
        {value: 'LU', label: 'Luxembourg'},
        {value: 'MO', label: 'Macao'},
        {value: 'MK', label: 'Macedonia (The Former Yugoslav Republic of)'},
        {value: 'MG', label: 'Madagascar'},
        {value: 'MW', label: 'Malawi'},
        {value: 'MY', label: 'Malaysia'},
        {value: 'MV', label: 'Maldives'},
        {value: 'ML', label: 'Mali'},
        {value: 'MT', label: 'Malta'},
        {value: 'MH', label: 'Marshall Islands'},
        {value: 'MQ', label: 'Martinique'},
        {value: 'MR', label: 'Mauritania'},
        {value: 'MU', label: 'Mauritius'},
        {value: 'YT', label: 'Mayotte'},
        {value: 'MX', label: 'Mexico'},
        {value: 'MD', label: 'Moldova'},
        {value: 'MC', label: 'Monaco'},
        {value: 'MN', label: 'Mongolia'},
        {value: 'MS', label: 'Montserrat'},
        {value: 'MA', label: 'Morocco'},
        {value: 'MZ', label: 'Mozambique'},
        {value: 'MM', label: 'Myanmar'},
        {value: 'NA', label: 'Namibia'},
        {value: 'NR', label: 'Nauru'},
        {value: 'NP', label: 'Nepal'},
        {value: 'NL', label: 'Netherlands'},
        {value: 'AN', label: 'Netherlands Antilles'},
        {value: 'NC', label: 'New Caledonia'},
        {value: 'NZ', label: 'New Zealand'},
        {value: 'NI', label: 'Nicaragua'},
        {value: 'NE', label: 'Niger'},
        {value: 'NG', label: 'Nigeria'},
        {value: 'NU', label: 'Niue'},
        {value: 'NF', label: 'Norfolk Island'},
        {value: 'NO', label: 'Norway'},
        {value: 'OM', label: 'Oman'},
        {value: 'PK', label: 'Pakistan'},
        {value: 'PW', label: 'Palau'},
        {value: 'PA', label: 'Panama'},
        {value: 'PG', label: 'Papua New Guinea'},
        {value: 'PY', label: 'Paraguay'},
        {value: 'PE', label: 'Peru'},
        {value: 'PH', label: 'Philippines'},
        {value: 'PN', label: 'Pitcairn'},
        {value: 'PL', label: 'Poland'},
        {value: 'PT', label: 'Portugal'},
        {value: 'QA', label: 'Qatar'},
        {value: 'RE', label: 'Reunion'},
        {value: 'RO', label: 'Romania'},
        {value: 'RU', label: 'Russian Federation'},
        {value: 'RW', label: 'Rwanda'},
        {value: 'SH', label: 'Saint Helena'},
        {value: 'KN', label: 'Saint Kitts and Nevis'},
        {value: 'LC', label: 'Saint Lucia'},
        {value: 'PM', label: 'Saint Pierre and Miquelon'},
        {value: 'VC', label: 'Saint Vincent and the Grenadines'},
        {value: 'WS', label: 'Samoa'},
        {value: 'SM', label: 'San Marino'},
        {value: 'ST', label: 'Sao Tome and Principe'},
        {value: 'SA', label: 'Saudi Arabia'},
        {value: 'SN', label: 'Senegal'},
        {value: 'RS', label: 'Serbia'},
        {value: 'SC', label: 'Seychelles'},
        {value: 'SL', label: 'Sierra Leone'},
        {value: 'SG', label: 'Singapore'},
        {value: 'SK', label: 'Slovakia'},
        {value: 'SI', label: 'Slovenia'},
        {value: 'SB', label: 'Solomon Islands'},
        {value: 'SO', label: 'Somalia'},
        {value: 'ZA', label: 'South Africa'},
        {value: 'GS', label: 'South Georgia and the South Sandwich Islands'},
        {value: 'ES', label: 'Spain'},
        {value: 'LK', label: 'Sri Lanka'},
        {value: 'SD', label: 'Sudan'},
        {value: 'SR', label: 'Suriname'},
        {value: 'SJ', label: 'Svalbard and Jan Mayen'},
        {value: 'SZ', label: 'Swaziland'},
        {value: 'SE', label: 'Sweden'},
        {value: 'CH', label: 'Switzerland', priority: 3},
        {value: 'SY', label: 'Syrian Arab Republic'},
        {value: 'TW', label: 'Taiwan'},
        {value: 'TJ', label: 'Tajikstan'},
        {value: 'TZ', label: 'Tanzania United Republic'},
        {value: 'TH', label: 'Thailand'},
        {value: 'TG', label: 'Togo'},
        {value: 'TK', label: 'Tokelau'},
        {value: 'TO', label: 'Tonga'},
        {value: 'TT', label: 'Trinidad and Tobago'},
        {value: 'TN', label: 'Tunisia'},
        {value: 'TR', label: 'Turkey'},
        {value: 'TM', label: 'Turkmenistan'},
        {value: 'TC', label: 'Turks and Caicos Islands'},
        {value: 'TV', label: 'Tuvalu'},
        {value: 'UG', label: 'Uganda'},
        {value: 'UA', label: 'Ukraine'},
        {value: 'AE', label: 'United Arab Emirates'},
        {value: 'GB', label: 'United Kingdom', priority: 2},
        {value: 'US', label: 'United States', priority: 1},
        {value: 'UY', label: 'Uruguay'},
        {value: 'UZ', label: 'Uzbekistan'},
        {value: 'VU', label: 'Vanuatu'},
        {value: 'VE', label: 'Venezuela'},
        {value: 'VN', label: 'Vietnam'},
        {value: 'WF', label: 'Wallis and Futuna'},
        {value: 'EH', label: 'Western Sahara'},
        {value: 'YE', label: 'Yemen'},
        {value: 'ZM', label: 'Zambia'},
        {value: 'ZW', label: 'Zimbabwe'}
    ];

    return tools;
});
