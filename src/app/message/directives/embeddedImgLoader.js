angular.module('proton.message')
    .directive('embeddedImgLoader', ($rootScope, embedded) => {

        /**
         * Remove the loader and display embedded images
         * @param  {Node} body Container body mail
         * @return {void}
         */
        const bindImagesUrl = (body) => {
            const $list = body ? body.querySelectorAll('[data-embedded-img]') : [];
            const promises = [].slice.call($list)
                .map((img) => {
                    const src = embedded.getUrl(img);
                    const image  = new Image();
                    return new Promise((resolve, reject) => {
                        image.src = src;
                        image.onload = () => resolve({img, src});
                        image.onerror = (e) => reject(e, src);
                    });
                });

            Promise
                .all(promises)
                .then((images) => {
                    _rAF(() => {
                        images.forEach(({img, src}) => {
                            const loader = img.parentElement;
                            const container = loader.parentElement;
                            img.src = src;
                            img.classList.add('proton-embedded');
                            img.removeAttribute('data-embedded-img');
                            container.replaceChild(img, loader);
                        });

                        $rootScope.$emit('embedded.injected');
                    });
                })
                .catch((err, src) => {
                    console.error(err, src);
                });
        };

        return {
            link(scope, el) {
                const unsubscribe = $rootScope
                    .$on('embedded.loaded', () => {
                        // Need to build images after the $digest as we need the decrypted body to be already compiled
                        scope
                            .$applyAsync(() => {
                                bindImagesUrl(el[0].querySelector('.bodyDecrypted'));
                            });
                });

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
