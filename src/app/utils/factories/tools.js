angular.module('proton.utils')
.factory('tools', ($log, $state, $stateParams, $filter, authentication, $compile, $templateCache, $rootScope, $q, CONSTANTS) => {
    const tools = {};

    tools.hasSessionStorage = () => {
        const mod = 'modernizr';

        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch (error) {
            return false;
        }
    };

    /**
     * Generate a hash
     * @param  {String} str
     * @return {Integer}
     */
    tools.hash = (str = '') => {
        return str.split('').reduce((prevHash, currVal) => ((prevHash << 5) - prevHash) + currVal.charCodeAt(0), 0);
    };

    tools.hasCookie = () => {
        return navigator.cookieEnabled;
    };

    tools.mobileResponsive = () => {
        const bodyWidth = document.body.offsetWidth;

        $rootScope.$applyAsync(() => {
            $rootScope.mobileMode = bodyWidth < CONSTANTS.MOBILE_BREAKPOINT;
        });
    };

    tools.colors = () => {
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

    tools.getBrowser = () => {
        return jQuery.browser.name;
    };

    tools.getBrowserVersion = () => {
        return jQuery.browser.version;
    };

    tools.prngAvailable = () => {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            return true;
        } else if (typeof window !== 'undefined' && typeof window.msCrypto === 'object' && typeof window.msCrypto.getRandomValues === 'function') {
            return true;
        }

        return false;
    };

    tools.getOs = () => {
        let OSName = 'other'; // Unknown OS

        if (navigator.appVersion) {
            if (navigator.appVersion.indexOf('Win') !== -1) {
                OSName = 'windows';
            }

            if (navigator.appVersion.indexOf('Mac') !== -1) {
                OSName = 'osx';
            }

            if (navigator.appVersion.indexOf('X11') !== -1) {
                OSName = 'linux';
            }

            if (navigator.appVersion.indexOf('Linux') !== -1) {
                OSName = 'linux';

                if (navigator.appVersion.indexOf('Android') !== -1) {
                    OSName = 'android';
                }
            }
        }

        if (navigator.userAgent && /(iPad|iPhone|iPod)/g.test(navigator.userAgent)) {
            OSName = 'ios';
        }

        return OSName;
    };

    tools.getDevice = () => {
        const deviceName = 'other';

        // if (navigator.userAgent.match(/Android/i)) deviceName = "android";
        // if (navigator.userAgent.match(/BlackBerry/i)) deviceName = "blackberry";
        // if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) deviceName = "ios";
        // if (navigator.userAgent.match(/Opera Mini/i)) deviceName = "opera";
        // if (navigator.userAgent.match(/IEMobile/i)) deviceName = "windowsPhone"

        return deviceName;
    };

    tools.findBootstrapEnvironment = () => {
        const envs = ['xs', 'sm', 'md', 'lg'];
        const $el = $('<div>');

        $el.appendTo($('body'));

        for (let i = envs.length - 1; i >= 0; i--) {
            const env = envs[i];

            $el.addClass('hidden-' + env);
            if ($el.is(':hidden')) {
                $el.remove();
                return env;
            }
        }
    };

    tools.changeSeparatorToComma = (input) => {
        return input.replace(';', ',');
    };

    tools.hostReachable = () => {
        // Handle IE and more capable browsers
        let xhr;

        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            xhr = new window.ActiveXObject('Microsoft.XMLHTTP');
        }

        // Open new request as a HEAD to the root hostname with a random param to bust the cache
        xhr.open('GET', '//' + window.location.hostname + '/?rand=' + Math.floor((1 + Math.random()) * 0x10000), false);

        // Issue request and handle response
        try {
            xhr.send();
            return (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304));
        } catch (error) {
            return false;
        }
    };

    tools.is_valid_dkim = (header) => {
        return header && (header.indexOf('dkim=none') === -1) && (header.indexOf('dkim=pass') !== -1);
    };

    tools.breakImages = (input) => {

        function replace(regex, html) {
            return html.replace(regex, (match) => 'proton-' + match);
        }

        const re = new RegExp('(svg|src=(?!"blob:|"cid:|"data:)|background=|poster=)', 'g');
        const url = new RegExp(/url\(/ig);

        return replace(url, replace(re, input));
    };

    /**
     * Remove every protonmail attributes inside the HTML content specified
     * @param {} html
     */
    tools.fixImages = (input) => {
        const re = new RegExp('(proton-url|proton-src|proton-svg|proton-background|proton-poster)', 'g');
        return input.replace(re, (match, $1) => $1.substring(7));
    };


    /**
     * Detect if the content is type of HTML
     */
    tools.isHtml = (content) => {
        if (content) {
            const doc = new DOMParser().parseFromString(content, 'text/html');

            if (doc) {
                return Array.from(doc.body.childNodes).some((node) => node.nodeType === 1);
            }
        }
        return true;
    };

    // Squire does this funny thing where it takes style tags, i.e.
    // <style> *my css here* </style>
    // and removes the tags but leaves the css text. Need to manually remove the text
    tools.removeStyle = (html) => {
        return html.replace(/<style[\s\S]*?\/style>/ig, ' '); // For squire
    };

    /* eslint  no-useless-escape: "off" */
    // convert html to plaintext
    tools.plaintext = (input) => {
        const html = input
            // replace link
            .replace(/<a.*?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/igm, '[$2]($1)')
             // replace image
            .replace(/<img.*?src=["']([^"']*)["'][^>]*>/igm, '![image]($1)')
            .replace(/<style([\s\S]*?)<\/style>/gi, '')
            .replace(/<script([\s\S]*?)<\/script>/gi, '')
            .replace(/<\/div>/ig, '\n')
            .replace(/<\/li>/ig, '\n')
            .replace(/<li>/ig, '  *  ')
            .replace(/<\/ul>/ig, '\n')
            .replace(/<\/p>/ig, '\n')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<[^>]+>/ig, '')
            .replace(/<\/h(\d)*>/gi, '\n');

        return jQuery('<div>')
            .html(html)
            .text()
            .replace(/</gi, '&lt;')
            .replace(/>/gi, '&gt;');
    };

    // Replace ::marker:: by <blockquote>
    tools.block = (html, mode) => {
        if (mode === 'start') {
            return html.replace(/<blockquote>/g, '::blockquote::open::').replace(/<\/blockquote>/g, '::blockquote::close::');
        } else if (mode === 'end') {
            return html.replace(/::blockquote::open::/g, '').replace(/::blockquote::close::/g, '').replace(/\n/g, '<br />');
        }
    };

    // Add '>' to the beginning of each <blockquote>
    tools.quote = (html) => {
        const separator = '::blockquote::open::';
        const index = html.indexOf(separator);
        let first = '';
        let second = '';

        if (index !== -1) {
            first = html.substring(0, index);
            second = html.substring(index + '::blockquote::open::'.length).replace(/\n/g, '\n > ');

            return first + '\n > ' + tools.quote(second);
        }

        return html;
    };

    tools.html = (input) => {
        // Converting images
        return input
            .replace(/!\[(.*?)\]\((.*?)\)/gi, '<img src="$2" alt="$1" title="$1" />')
            // Converting link
           .replace(/\[(.*?)\]\((.*?)\)/gi, '<a href="$2">$1</a>');
    };


    tools.fixRedirectExploits = (input) => {
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

        return input
            // video tags
            .replace(/<(video*)\b[^>]*>(.*?)<\/\1>/ig, '')
            // object tags
            .replace(/<(object*)\b[^>]*>(.*?)<\/\1>/ig, '')
            // style tags
            .replace(/<(style*)\b[^>]*>(.*?)<\/\1>/ig, '')
            .replace(/<(iframe*)\b[^>]*>(.*?)<\/\1>/ig, '')
            // link tags
            .replace(/<(link*)\b[^>]*>/ig, '')
            // svg tags
            .replace(/<(svg*)\b[^>]*>(.*?)<\/\1>/ig, '')
            // remove malicious attributes
            .replace(/srcset/ig, '')
            .replace(/content:/ig, '')
            .replace(/url\(/ig, '')
            .replace(/dns-prefetch/ig, '')
            .replace(/@import/ig, '');
    };

    tools.validEmail = (value) => {
        const filter = "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:.[a-zA-Z0-9-]+)*$";

        return String(value).search(filter) !== -1;
    };

    tools.isCompatible = () => {
        let compatible = true;

        if (!tools.hasSessionStorage()) {
            compatible = false;
        }

        if (!tools.prngAvailable()) {
            compatible = false;
        }

        return compatible;
    };

    // get user max and current storage, and return a string "123.3/456.6 GB"
    tools.renderStorageBar = (current, max) => {
        const kb = 1024;
        const mb = kb * kb;
        const gb = mb * kb;
        let cur = (current / kb).toFixed(0); // convert to KB

        if (max < gb) {
            // render bar in terms of MB such as "785.4 MB"
            cur = (cur / kb).toFixed(1);

            if (Number(cur) > 0 && Number(cur) < 0.01) {
                cur = 0.01;
            }

            return Number(cur) + '/' + Number(Math.round(max / kb / kb)) + ' MB';
        }

        // render bar in terms of GB such as "15.23 GB"
        cur = (cur / kb / kb).toFixed(2);

        if (Number(cur) > 0 && Number(cur) < 0.01) {
            cur = 0.01;
        }

        return Number(cur) + '/' + Number(Math.round(max / kb / kb / kb)) + ' GB';
    };

    tools.replaceLineBreaks = (content) => {
        return content.replace(/(?:\r\n|\r|\n)/g, '<br />');
    };

    tools.contactsToString = (contacts) => {
        return _.map(contacts, ({ Name = '', Address = '' }) => {
            const name = $filter('nameRecipient')(Name);

            if (name) {
                return `${name} &lt;${Address}&gt;`;
            }

            return Address;
        }).join(', ');
    };

    tools.currentLocation = () => {
        const mailbox = tools.currentMailbox();
        const loc = (mailbox === 'label') ? $stateParams.label : CONSTANTS.MAILBOX_IDENTIFIERS[mailbox];

        return loc;
    };

    const filteredState = (state = $state.$current.name) => state.replace('secured.', '').replace('.element', '');

    tools.filteredState = filteredState;
    tools.currentMailbox = () => {
        const mailbox = filteredState();

        if (_.contains(Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS), mailbox)) {
            return mailbox;
        }

        return false;
    };

    tools.typeList = (name) => {
        const specialBoxes = ['drafts', 'search', 'sent'];
        const box = name || tools.currentMailbox();

        if (authentication.user.ViewMode === CONSTANTS.MESSAGE_VIEW_MODE || specialBoxes.indexOf(box) > -1) {
            return 'message';
        }

        return 'conversation';
    };

    tools.typeView = () => {
        return (authentication.user.ViewMode === CONSTANTS.MESSAGE_VIEW_MODE) ? 'message' : 'conversation';
    };

    /**
     * Check if the request is in a cache context
     * @return {Boolean}
     */
    tools.cacheContext = () => {
        const mailbox = filteredState();
        const boxes1 = ['trash', 'spam'];
        const boxes2 = ['inbox', 'drafts', 'sent', 'starred', 'archive', 'label'];
        const trashSpamContext = angular.isUndefined($stateParams.trashspam) ? (boxes2.indexOf(mailbox) > -1) : (boxes1.indexOf(mailbox) > -1);
        const filterUndefined = angular.isUndefined($stateParams.filter);
        const sortUndefined = angular.isUndefined($stateParams.sort);
        const isNotSearch = mailbox !== 'search';

        return isNotSearch && sortUndefined && filterUndefined && trashSpamContext;
    };

    tools.countries = [
        { value: 'AF', label: 'Afghanistan' },
        { value: 'AL', label: 'Albania' },
        { value: 'DZ', label: 'Algeria' },
        { value: 'AD', label: 'Andorra' },
        { value: 'AO', label: 'Angola' },
        { value: 'AI', label: 'Anguilla' },
        { value: 'AG', label: 'Antigua and Barbuda' },
        { value: 'AR', label: 'Argentina' },
        { value: 'AM', label: 'Armenia' },
        { value: 'AW', label: 'Aruba' },
        { value: 'AU', label: 'Australia' },
        { value: 'AT', label: 'Austria' },
        { value: 'AZ', label: 'Azerbaijan' },
        { value: 'BS', label: 'Bahamas' },
        { value: 'BH', label: 'Bahrain' },
        { value: 'BD', label: 'Bangladesh' },
        { value: 'BB', label: 'Barbados' },
        { value: 'BY', label: 'Belarus' },
        { value: 'BE', label: 'Belgium' },
        { value: 'BZ', label: 'Belize' },
        { value: 'BJ', label: 'Benin' },
        { value: 'BM', label: 'Bermuda' },
        { value: 'BT', label: 'Bhutan' },
        { value: 'BO', label: 'Bolivia' },
        { value: 'BA', label: 'Bosnia Herzegovina' },
        { value: 'BW', label: 'Botswana' },
        { value: 'BV', label: 'Bouvet Island' },
        { value: 'BR', label: 'Brazil' },
        { value: 'IO', label: 'British Indian Ocean Territory' },
        { value: 'VG', label: 'British Virgin Islands' },
        { value: 'BN', label: 'Brunei Darussalam' },
        { value: 'BG', label: 'Bulgaria' },
        { value: 'BF', label: 'Burkina Faso' },
        { value: 'BI', label: 'Burundi' },
        { value: 'KH', label: 'Cambodia' },
        { value: 'CM', label: 'Cameroon' },
        { value: 'CA', label: 'Canada' },
        { value: 'CV', label: 'Cape Verde' },
        { value: 'KY', label: 'Cayman Islands' },
        { value: 'CF', label: 'Central African Republic' },
        { value: 'TD', label: 'Chad' },
        { value: 'CL', label: 'Chile' },
        { value: 'CN', label: 'China' },
        { value: 'CX', label: 'Christmas Island' },
        { value: 'CC', label: 'Cocos (Keeling) Islands' },
        { value: 'CO', label: 'Colombia' },
        { value: 'KM', label: 'Comoros' },
        { value: 'CG', label: 'Congo' },
        { value: 'CD', label: 'Congo (The Democratic Republic of the)' },
        { value: 'CK', label: 'Cook Islands' },
        { value: 'CR', label: 'Costa Rica' },
        { value: 'CI', label: 'Cote d Ivoire (Ivory Coast)' },
        { value: 'HR', label: 'Croatia' },
        { value: 'CU', label: 'Cuba' },
        { value: 'CY', label: 'Cyprus' },
        { value: 'CZ', label: 'Czech Republic' },
        { value: 'DK', label: 'Denmark' },
        { value: 'DJ', label: 'Djibouti' },
        { value: 'DM', label: 'Dominica' },
        { value: 'DO', label: 'Dominican Republic' },
        { value: 'TL', label: 'East Timor' },
        { value: 'EC', label: 'Ecuador' },
        { value: 'EG', label: 'Egypt' },
        { value: 'SV', label: 'El Salvador' },
        { value: 'GQ', label: 'Equatorial Guinea' },
        { value: 'ER', label: 'Eritrea' },
        { value: 'EE', label: 'Estonia' },
        { value: 'ET', label: 'Ethiopia' },
        { value: 'FK', label: 'Falkland Islands (Malvinas)' },
        { value: 'FO', label: 'Faroe Islands' },
        { value: 'FJ', label: 'Fiji' },
        { value: 'FI', label: 'Finland' },
        { value: 'FR', label: 'France' },
        { value: 'GF', label: 'French Guiana' },
        { value: 'PF', label: 'French Polynesia' },
        { value: 'TF', label: 'French Southern Territories' },
        { value: 'GA', label: 'Gabon' },
        { value: 'GM', label: 'Gambia' },
        { value: 'GE', label: 'Georgia' },
        { value: 'DE', label: 'Germany' },
        { value: 'GH', label: 'Ghana' },
        { value: 'GI', label: 'Gibraltar' },
        { value: 'GR', label: 'Greece' },
        { value: 'GL', label: 'Greenland' },
        { value: 'GD', label: 'Grenada' },
        { value: 'GP', label: 'Guadeloupe' },
        { value: 'GT', label: 'Guatemala' },
        { value: 'GN', label: 'Guinea' },
        { value: 'GW', label: 'Guinea-Bissau' },
        { value: 'GY', label: 'Guyana' },
        { value: 'HT', label: 'Haiti' },
        { value: 'HM', label: 'Heard Island and McDonald Islands' },
        { value: 'VA', label: 'Holy See (Vatican City State)' },
        { value: 'HN', label: 'Honduras' },
        { value: 'HK', label: 'Hong Kong' },
        { value: 'HU', label: 'Hungary' },
        { value: 'IS', label: 'Iceland' },
        { value: 'IN', label: 'India' },
        { value: 'ID', label: 'Indonesia' },
        { value: 'IQ', label: 'Iraq' },
        { value: 'IE', label: 'Ireland' },
        { value: 'IR', label: 'Islamic Republic of Iran' },
        { value: 'IL', label: 'Israel' },
        { value: 'IT', label: 'Italy' },
        { value: 'JM', label: 'Jamaica' },
        { value: 'JP', label: 'Japan' },
        { value: 'JO', label: 'Jordan' },
        { value: 'KZ', label: 'Kazakhstan' },
        { value: 'KE', label: 'Kenya' },
        { value: 'KI', label: 'Kiribati' },
        { value: 'KP', label: 'Korea (Democratic People s Republic of)' },
        { value: 'KR', label: 'Korea (Republic of)' },
        { value: 'KW', label: 'Kuwait' },
        { value: 'KG', label: 'Kyrgzstan' },
        { value: 'LA', label: 'Lao People s Democratic Republic' },
        { value: 'LV', label: 'Latvia' },
        { value: 'LB', label: 'Lebanon' },
        { value: 'LS', label: 'Lesotho' },
        { value: 'LR', label: 'Liberia' },
        { value: 'LY', label: 'Libyan Arab Jamahiriya' },
        { value: 'LI', label: 'Liechtenstein' },
        { value: 'LT', label: 'Lithuania' },
        { value: 'LU', label: 'Luxembourg' },
        { value: 'MO', label: 'Macao' },
        { value: 'MK', label: 'Macedonia (The Former Yugoslav Republic of)' },
        { value: 'MG', label: 'Madagascar' },
        { value: 'MW', label: 'Malawi' },
        { value: 'MY', label: 'Malaysia' },
        { value: 'MV', label: 'Maldives' },
        { value: 'ML', label: 'Mali' },
        { value: 'MT', label: 'Malta' },
        { value: 'MH', label: 'Marshall Islands' },
        { value: 'MQ', label: 'Martinique' },
        { value: 'MR', label: 'Mauritania' },
        { value: 'MU', label: 'Mauritius' },
        { value: 'YT', label: 'Mayotte' },
        { value: 'MX', label: 'Mexico' },
        { value: 'MD', label: 'Moldova' },
        { value: 'MC', label: 'Monaco' },
        { value: 'MN', label: 'Mongolia' },
        { value: 'MS', label: 'Montserrat' },
        { value: 'MA', label: 'Morocco' },
        { value: 'MZ', label: 'Mozambique' },
        { value: 'MM', label: 'Myanmar' },
        { value: 'NA', label: 'Namibia' },
        { value: 'NR', label: 'Nauru' },
        { value: 'NP', label: 'Nepal' },
        { value: 'NL', label: 'Netherlands' },
        { value: 'AN', label: 'Netherlands Antilles' },
        { value: 'NC', label: 'New Caledonia' },
        { value: 'NZ', label: 'New Zealand' },
        { value: 'NI', label: 'Nicaragua' },
        { value: 'NE', label: 'Niger' },
        { value: 'NG', label: 'Nigeria' },
        { value: 'NU', label: 'Niue' },
        { value: 'NF', label: 'Norfolk Island' },
        { value: 'NO', label: 'Norway' },
        { value: 'OM', label: 'Oman' },
        { value: 'PK', label: 'Pakistan' },
        { value: 'PW', label: 'Palau' },
        { value: 'PA', label: 'Panama' },
        { value: 'PG', label: 'Papua New Guinea' },
        { value: 'PY', label: 'Paraguay' },
        { value: 'PE', label: 'Peru' },
        { value: 'PH', label: 'Philippines' },
        { value: 'PN', label: 'Pitcairn' },
        { value: 'PL', label: 'Poland' },
        { value: 'PT', label: 'Portugal' },
        { value: 'QA', label: 'Qatar' },
        { value: 'RE', label: 'Reunion' },
        { value: 'RO', label: 'Romania' },
        { value: 'RU', label: 'Russian Federation' },
        { value: 'RW', label: 'Rwanda' },
        { value: 'SH', label: 'Saint Helena' },
        { value: 'KN', label: 'Saint Kitts and Nevis' },
        { value: 'LC', label: 'Saint Lucia' },
        { value: 'PM', label: 'Saint Pierre and Miquelon' },
        { value: 'VC', label: 'Saint Vincent and the Grenadines' },
        { value: 'WS', label: 'Samoa' },
        { value: 'SM', label: 'San Marino' },
        { value: 'ST', label: 'Sao Tome and Principe' },
        { value: 'SA', label: 'Saudi Arabia' },
        { value: 'SN', label: 'Senegal' },
        { value: 'RS', label: 'Serbia' },
        { value: 'SC', label: 'Seychelles' },
        { value: 'SL', label: 'Sierra Leone' },
        { value: 'SG', label: 'Singapore' },
        { value: 'SK', label: 'Slovakia' },
        { value: 'SI', label: 'Slovenia' },
        { value: 'SB', label: 'Solomon Islands' },
        { value: 'SO', label: 'Somalia' },
        { value: 'ZA', label: 'South Africa' },
        { value: 'GS', label: 'South Georgia and the South Sandwich Islands' },
        { value: 'ES', label: 'Spain' },
        { value: 'LK', label: 'Sri Lanka' },
        { value: 'SD', label: 'Sudan' },
        { value: 'SR', label: 'Suriname' },
        { value: 'SJ', label: 'Svalbard and Jan Mayen' },
        { value: 'SZ', label: 'Swaziland' },
        { value: 'SE', label: 'Sweden' },
        { value: 'CH', label: 'Switzerland' },
        { value: 'SY', label: 'Syrian Arab Republic' },
        { value: 'TW', label: 'Taiwan' },
        { value: 'TJ', label: 'Tajikstan' },
        { value: 'TZ', label: 'Tanzania United Republic' },
        { value: 'TH', label: 'Thailand' },
        { value: 'TG', label: 'Togo' },
        { value: 'TK', label: 'Tokelau' },
        { value: 'TO', label: 'Tonga' },
        { value: 'TT', label: 'Trinidad and Tobago' },
        { value: 'TN', label: 'Tunisia' },
        { value: 'TR', label: 'Turkey' },
        { value: 'TM', label: 'Turkmenistan' },
        { value: 'TC', label: 'Turks and Caicos Islands' },
        { value: 'TV', label: 'Tuvalu' },
        { value: 'UG', label: 'Uganda' },
        { value: 'UA', label: 'Ukraine' },
        { value: 'AE', label: 'United Arab Emirates' },
        { value: 'GB', label: 'United Kingdom' },
        { value: 'US', label: 'United States' },
        { value: 'UY', label: 'Uruguay' },
        { value: 'UZ', label: 'Uzbekistan' },
        { value: 'VU', label: 'Vanuatu' },
        { value: 'VE', label: 'Venezuela' },
        { value: 'VN', label: 'Vietnam' },
        { value: 'WF', label: 'Wallis and Futuna' },
        { value: 'EH', label: 'Western Sahara' },
        { value: 'YE', label: 'Yemen' },
        { value: 'ZM', label: 'Zambia' },
        { value: 'ZW', label: 'Zimbabwe' }
    ];

    return tools;
});
