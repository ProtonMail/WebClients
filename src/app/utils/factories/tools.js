angular.module('proton.utils')
    .factory('tools', ($log, $state, $stateParams, $filter, authentication, $compile, $templateCache, $rootScope, $q, CONSTANTS, aboutClient, regexEmail, gettextCatalog, AppModel) => {
        const tools = {};
        const MAILBOX_KEYS = Object.keys(CONSTANTS.MAILBOX_IDENTIFIERS);


        /**
     * Generate a hash
     * @param  {String} str
     * @return {Integer}
     */
        tools.hash = (str = '') => {
            return str.split('').reduce((prevHash, currVal) => ((prevHash << 5) - prevHash) + currVal.charCodeAt(0), 0);
        };


        tools.mobileResponsive = () => {
            AppModel.set('mobile', document.body.offsetWidth < CONSTANTS.MOBILE_BREAKPOINT);
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

        tools.changeSeparatorToComma = (input) => input.replace(';', ',');

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

        tools.validEmail = (value = '') => regexEmail.test(value);


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

            if (_.contains(MAILBOX_KEYS, mailbox)) {
                return mailbox;
            }

            return false;
        };

        tools.getTypeList = (name) => {
            const specialBoxes = ['drafts', 'search', 'sent', 'allDrafts', 'allSent'];
            const box = name || tools.currentMailbox();
            const threadingIsOff = authentication.user.ViewMode === CONSTANTS.MESSAGE_VIEW_MODE;

            if (threadingIsOff || _.contains(specialBoxes, box)) {
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
            const filterUndefined = angular.isUndefined($stateParams.filter);
            const sortUndefined = angular.isUndefined($stateParams.sort);
            const isNotSearch = mailbox !== 'search';

            return isNotSearch && sortUndefined && filterUndefined;
        };

        return tools;
    });
