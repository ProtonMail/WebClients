/* @ngInject */
function embeddedImgLoader($log, dispatchers, embedded) {
    const buildMapCid = (map = {}, img, src) => ((map[img.getAttribute('data-embedded-img')] = src), map);
    const { dispatcher, on, unsubscribe } = dispatchers(['message.open']);

    const getPromiseImg = (img, src) => {
        const image = new Image();
        return new Promise((resolve, reject) => {
            image.src = src;
            image.onload = () => resolve({ img, src });
            image.onerror = (error) => reject({ error, src });
        });
    };

    /**
     * Remove the loader and display embedded images
     * @param  {Node} body Container body mail
     * @return {void}
     */
    const bindImagesUrl = ({ body, message, action }) => {
        const $list = body ? body.querySelectorAll('[data-embedded-img]') : [];

        /**
         * Filter img and don't build promises if
         *     - src contains `cid:`
         *     - src is empty
         * Prevent Uncaught (in promise) TypeError: Illegal invocation
         * @type {Array}
         */
        const { map, list } = [].slice
            .call($list)
            .filter((img) => img.src.indexOf('cid:') === -1)
            .reduce(
                (acc, img) => {
                    const src = embedded.getUrl(img);
                    if (src) {
                        buildMapCid(acc.map, img, src);
                        acc.list.push(getPromiseImg(img, src));
                    }
                    return acc;
                },
                { map: {}, list: [] }
            );

        Promise.all(list)
            .then((images) => {
                _rAF(() => {
                    images.forEach(({ img, src }) => {
                        img.src = src;
                        img.classList.add('proton-embedded');
                    });

                    // Remove all the loaders !
                    const loader = body ? body.querySelectorAll('.loading') : [];

                    if (loader.length) {
                        $(loader)
                            .contents()
                            .unwrap();
                    }

                    if (images.length) {
                        dispatcher['message.open']('embedded.injected', {
                            action,
                            map,
                            message,
                            body: body.innerHTML
                        });
                    }
                });
            })
            .catch($log.error);
    };

    return {
        link(scope) {
            on('message.embedded', (e, { type, data }) => {
                if (type === 'loaded') {
                    // Need to build images after the $digest as we need the decrypted body to be already compiled
                    scope.$applyAsync(() => bindImagesUrl(data));
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default embeddedImgLoader;
