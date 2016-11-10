angular.module('proton.message')
.directive('injectMessageMedia', ($rootScope, displayImages, displayEmbedded) => {

    function injectInlineEmbedded(el, { map }) {
        const node = el[0];
        const selector = Object.keys(map)
            .map((cid) => `[proton-src="${cid}"]`)
            .join(',');
        const $list = [].slice.call(node.querySelectorAll(selector));
        debugger;
        $list.forEach((node) => {
            node.src = map[node.getAttribute('proton-src')];
        });
    }

    function injectInlineRemote(el, { list }) {
        const node = el[0];
        const mapSelectors = list.reduce((acc, map) => {
            return Object.keys(map)
                .reduce((acc, key) => {
                    acc[key] = (acc[key] || []).concat(`[${key}="${map[key]}"]`);
                    return acc;
                }, acc);
        }, {});

        Object.keys(mapSelectors)
            .forEach((selector) => {
                const attr = selector.substring(7);
                const $list = [].slice.call(node.querySelectorAll(mapSelectors[selector].join(', ')));
                $list.forEach((node) => {
                    node.setAttribute(attr, node.getAttribute(selector));
                });
            });
    }

    return {
        link(scope, el) {
            const unsubscribe = $rootScope.$on('message.open', (e, { type, data }) => {

                if (data.message.ID !== scope.message.ID) {
                    return;
                }
                console.log(data)

                switch (type) {

                    case 'injectContent': {
                        const body = scope.body || scope.message.getDecryptedBody(true);
                        (data.action === 'remote') && displayImages(scope.message, body, 'user.inject');
                        (data.action === 'embedded') && displayEmbedded(scope.message, body, 'user.inject');
                        break;
                    }


                    case 'remote.injected':
                        if (data.action === 'user.inject') {
                            return injectInlineRemote(el, data);
                        }
                        break;

                    case 'embedded.injected':
                        if (data.action === 'user.inject') {
                            return injectInlineEmbedded(el, data);
                        }
                        break;

                }
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });

        }
    };
});
