angular.module('proton.message')
    .directive('embeddedImgLoader', ($rootScope, embedded) => {

        /**
         * Remove the loader and display embedded images
         * @param  {Node} body Container body mail
         * @return {void}
         */
        const bindImagesUrl = (body) => {
            const $list = body ? body.querySelectorAll('[data-embedded-img]') : [];
            [].slice.call($list)
                .forEach((img) => {
                    const src = embedded.getUrl(img);

                    if (src) {
                        _rAF(() => {
                            const loader = img.parentElement;
                            const container = loader.parentElement;
                            
                            img.src = src;
                            // Don't need to reload it everytime, only load once
                            img.removeAttribute('data-embedded-img');
                            container.replaceChild(img, loader);
                        });
                    }
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