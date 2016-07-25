angular.module('proton.message')
    .directive('embeddedImgLoader', ($rootScope, embedded) => {

        /**
         * Remove the loader and display embedded images
         * @param  {Node} body Container body mail
         * @return {void}
         */
        const bindImagesUrl = (body) => {
            const $list = body.querySelectorAll('[data-embedded-img]');

            [].slice.call($list)
                .forEach((img) => {
                    const src = embedded.getUrl(img);

                    if (src) {
                        _rAF(() => {
                            const loader = img.parentElement;
                            const container = loader.parentElement;

                            container.removeChild(loader);
                            img.src = src;
                            // Don't need to reload it everytime, only load once
                            img.removeAttribute('data-embedded-img');
                            container.appendChild(img);
                        });
                    }
                });
        };

        return {
            link(scope, el, attr) {
                const unsubscribe = $rootScope
                    .$on('embedded.loaded', () => {
                        bindImagesUrl(el[0].querySelector('#bodyDecrypted'));
                });

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });