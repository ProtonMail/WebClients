angular.module('proton.message')
.factory('transformRemote', ($state, $rootScope, authentication, CONSTANTS) => {

    const ATTRIBUTES = ['url', 'xlink:href', 'srcset', 'src', 'svg', 'background', 'poster'].map((name) => `proton-${name}`);

    const REGEXP_FIXER = (() => {
        const str = ATTRIBUTES.map((key) => {
            if (key === 'proton-src') {
                return `${key}=(?!"cid)`;
            }
            return key;
        }).join('|');
        return new RegExp(`(${str})`, 'g');
    })();

    function prepareInjection(html) {
        const selector = ATTRIBUTES.map((attr) => {
            const [ key ] = attr.split(':');
            return `[${key}]`;
        })
        .join(', ');

        const mapAttributes = (node) => {
            return _.chain(node.attributes)
                .filter((attr) => ATTRIBUTES.indexOf(attr.name) !== -1)
                .reduce((acc, attr) => (acc[`${attr.name}`] = attr.value, acc), {})
                .value();
        };

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

    return (html, message, { action }) => {

        const user = authentication.user || { ShowImages: 0 };
        const showImages = message.showImages || user.ShowImages || (CONSTANTS.WHITELIST.indexOf(message.Sender.Address) !== -1 && !message.IsEncrypted) || $state.is('printer');
        const content = html.innerHTML;

        // Bind the boolean only if there are somthing
        if (REGEXP_FIXER.test(content)) {
            message.showImages = showImages;
        }

        if (showImages) {
            html.innerHTML = content.replace(REGEXP_FIXER, (match, $1) => $1.substring(7));
            if (action === 'user.inject') {
                const list = prepareInjection(html, content, action);

                if (list.length) {
                    $rootScope.$emit('message.open', {
                        type: 'remote.injected',
                        data: { action, list, message }
                    });
                }
            }
        }
        return html;
    };
});
