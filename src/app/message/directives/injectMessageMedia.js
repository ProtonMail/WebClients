angular.module('proton.message')
.directive('injectMessageMedia', ($rootScope, displayImages, displayEmbedded) => {

    const wrapImage = (img) => angular.element(img).wrap('<div class="image loading"></div>');

    /**
     * Remove every loader after each images are loaded
     * Add a delay because that's better for the user to see an interaction,
     * even if it's fast.
     * @param  {Node} node    Main scope content
     * @return {void}
     */
    const removeLoader = (node) => () => {
        const loader = node.querySelectorAll('.loading');

        if (loader.length) {
            const id = setTimeout(() => {
                $(loader).contents().unwrap();
                clearTimeout(id);
            }, 300);
        }
    };

    /**
     * Build an array of promise around a content to load
     * @param  {Array} $list       Collection of nodes
     * @param  {Object} config      {selector, attribute, getValue(node)}
     * @param  {Array}  accumulator
     * @return {Array}
     */
    function reducerLoader($list, config = {}, accumulator = []) {
        const { attribute, selector, setLoader = true } = config;

        setLoader && $list.forEach(wrapImage);

        return $list.reduce((acc, node) => {

            const promise = new Promise((resolve) => {
                const resolver = { node, attribute, selector };
                // Set a custom attribute with a custom value
                node.setAttribute(attribute, config.getValue(node));

                if (node.nodeName !== 'IMG') {
                    return resolve(resolver);
                }
                // Wrap promise with DOM api to resolve when the content is loaded
                node.onload = () => resolve(resolver);
                node.onerror = () => {
                    console.error(`Could not load ${node.getAttribute(selector)}`);
                    resolve(resolver);
                };
            });

            acc.push(promise);
            return acc;
        }, accumulator);
    }

    /**
     * Inject to the message Body each embedded images
     * @param  {jQLite} el          Current node wrapper
     * @param  {Object} options.map Map {<cid:String>: <url:String>}
     * @return {void}
     */
    function injectInlineEmbedded(el, { map, action }) {
        const node = el[0];
        const selector = Object.keys(map)
            .map((cid) => `[proton-src="${cid}"]`)
            .join(',');
        const $list = [].slice.call(node.querySelectorAll(selector || '[proton-src^="cid:"]'));

        // Set the loader before we decrypt then load the image (better ux)
        if (action === 'user.inject.load') {
            return $list.forEach(wrapImage);
        }

        const promises = reducerLoader($list, {
            selector: 'proton-src',
            attribute: 'src',
            setLoader: false,
            map,
            getValue(node) {
                return this.map[node.getAttribute('proton-src')];
            }
        });

        Promise.all(promises).then(removeLoader(node));
    }

    /**
     * Inject to the message Body each embedded images
     * @param  {jQLite} el          Current node wrapper
     * @param  {Array} options.list Collection of content [ {<proton-x:String>:<url:String>} ]
     * @return {void}
     */
    function injectInlineRemote(el, { list }) {
        const node = el[0];
        const mapSelectors = list.reduce((acc, map) => {
            return Object.keys(map)
                .reduce((acc, key) => {
                    acc[key] = (acc[key] || []).concat(`[${key}="${map[key]}"]`);
                    return acc;
                }, acc);
        }, {});

        const promises = Object.keys(mapSelectors)
            .reduce((acc, selector) => {
                // Remove proton- from the selector to know which selector to use
                const attribute = selector.substring(7);
                const $list = [].slice.call(node.querySelectorAll(mapSelectors[selector].join(', ')));

                return reducerLoader($list, {
                    selector, attribute,
                    getValue(node) {
                        return node.getAttribute(this.selector);
                    }
                }, acc);
            }, []);

        Promise.all(promises).then(removeLoader(node));
    }

    return {
        link(scope, el) {
            const unsubscribe = $rootScope.$on('message.open', (e, { type, data }) => {

                if (data.message.ID !== scope.message.ID) {
                    return;
                }

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
                        if (data.action === 'user.inject.load') {
                            return injectInlineEmbedded(el, data);
                        }
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
