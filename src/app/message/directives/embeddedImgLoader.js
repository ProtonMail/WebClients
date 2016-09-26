angular.module('proton.message')
    .directive('embeddedImgLoader', ($rootScope, embedded) => {

        /**
         * Remove the loader and display embedded images
         * @param  {Node} body Container body mail
         * @return {void}
         */
        const bindImagesUrl = (body, message) => {
            const $list = body ? body.querySelectorAll('[data-embedded-img]') : [];

            /**
             * Filter img and don't build promises if
             *     - src contains `cid:`
             *     - src is empty
             * Prevent Uncaught (in promise) TypeError: Illegal invocation
             * @type {Array}
             */
            const promises = [].slice.call($list)
                .filter((img) => img.src.indexOf('cid:') === -1)
                .map((img) => {
                    const src = embedded.getUrl(img);
                    if (src) {
                        const image  = new Image();
                        return new Promise((resolve, reject) => {
                            image.src = src;
                            image.onload = () => resolve({img, src});
                            image.onerror = (error) => reject({ error, src });
                        });
                    }
                })
                .filter(Boolean);

            Promise
                .all(promises)
                .then((images) => {
                    _rAF(() => {
                        images.forEach(({ img, src }) => {
                            img.src = src;
                            img.classList.add('proton-embedded');
                        });

                        // Remove all the loaders !
                        const loader = body ? body.querySelectorAll('.loading') : [];

                        if (loader.length) {
                            $(loader).contents().unwrap();
                        }

                        if (images.length) {
                            $rootScope.$emit('message.embedded.injected', message, body.innerHTML);
                        }
                    });
                })
                .catch(console.error);
        };

        return {
            link(scope, el) {
                const unsubscribe = $rootScope
                    .$on('message.embedded.loaded', (event, message, body) => {
                        // Need to build images after the $digest as we need the decrypted body to be already compiled
                        scope
                            .$applyAsync(() => {
                                bindImagesUrl(body, message);
                            });
                });

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
