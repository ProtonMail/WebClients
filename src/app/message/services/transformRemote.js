angular.module('proton.message')
.factory('transformRemote', ($state, $rootScope, authentication, CONSTANTS) => {

    const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'].map((name) => `proton-${name}`);
    const REGEXP_IS_BREAK = new RegExp('(<svg|xlink:href|srcset|src=|background=|poster=)', 'g');
    const REGEXP_IS_NOT_EMBEDDED_ONLY = new RegExp('src=(?!"blob:|"cid:|"data:)', 'g');
    const REGEXP_IS_FIX = new RegExp(`(${ATTRIBUTES.join('|')})`, 'g');
    const REGEXP_IS_URL = new RegExp(/url\(/ig);

    const replace = (regex, content) => content.replace(regex, (match) => 'proton-' + match);

    function prepareInjection(html, content) {
        const selector = ATTRIBUTES.map((attr) => {
            const [ key ] = attr.split(':');
            return `[${key}]`;
        })
        .join(', ');

        const mapAttributes = (node) => {
            return _.chain(node.attributes)
                .filter((attr) => ATTRIBUTES.indexOf(attr.name) !== -1)
                .reduce((acc, attr) => (acc[attr.name] = attr.value, acc), {})
                .value();
        };

        html.innerHTML = content;

        const $list = [].slice.call(html.querySelectorAll(selector));
        const attributes = $list.reduce((acc, node) => {
            if (node.hasAttribute('proton-src')) {
                const src = node.getAttribute('proton-src');

                // We don't want to unescape attachments as we are going to proces them later
                if (src.indexOf('cid:') !== -1) {
                    return acc;
                }
            }
            acc.push(mapAttributes(node));
            return acc;
        }, []);

        return attributes;
    }

    return (html, message, { action, content }) => {

        const user = authentication.user || { ShowImages: 0 };
        const showImages = message.showImages || user.ShowImages || (CONSTANTS.WHITELIST.indexOf(message.Sender.Address) !== -1 && !message.IsEncrypted) || $state.is('printer');

        if (action === 'user.inject') {
            const list = prepareInjection(html, content, action);

            if (list.length) {
                $rootScope.$emit('message.open', {
                    type: 'remote.injected',
                    data: { action, list, message }
                });
            }
        }

        if (REGEXP_IS_BREAK.test(content) || REGEXP_IS_FIX.test(content)) {

            /**
             * We bind the value only if the dom does not only contains embedded images
             */
            if (REGEXP_IS_NOT_EMBEDDED_ONLY.test(content)) {
                message.showImages = showImages;
            }

            if (showImages) {
                html.innerHTML = content.replace(REGEXP_IS_FIX, (match, $1) => $1.substring(7));
                return html;
            }

            html.innerHTML = replace(REGEXP_IS_URL, replace(REGEXP_IS_BREAK, content));
        }

        return html;
    };
});
