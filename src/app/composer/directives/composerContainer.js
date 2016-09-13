angular.module('proton.composer')
    .directive('composerContainer', ($rootScope, tools) => {

        /**
         * Compute some informations about a composer
         * @param  {Node} element A composer
         * @param  {Integer} count   Total message
         * @return {Object}
         */
        function sizes(element, count) {
            const width = element.offsetWidth;
            const margin = document.documentElement.classList.contains('ua-windows_nt') ? 40 : 20;
            const windowWidth = document.body.offsetWidth;
            const isBootstrap = tools.findBootstrapEnvironment() === 'xs';
            let overlap = 0;

            if (!isBootstrap && ((windowWidth / count) < width) ) {
                /* overlap is a ratio that will share equaly the space available between overlayed composers. */
                overlap = ((windowWidth - width - (2 * margin)) / (count - 1) );
            }

            return {
                width, margin, windowWidth,
                isBootstrap, overlap
            };
        }

        /**
         * Compute the right position of the composer
         * @param  {Integer} options.width
         * @param  {Integer} options.margin
         * @param  {Number} options.overlap
         * @param  {Integer} index           Current composer position
         * @return {Integer}                 Create a blured component if it's not an integer
         */
        function getPositionRight({ width, margin, overlap }, index) {
            const right = (overlap) ? (index * overlap) : (index * (width + margin) + margin);
            return parseInt(right, 10) || margin;
        }

        /**
         * Attach custom styles to a composer
         * @param  {Node} element composer
         * @param  {Object} styles  Style to bind
         * @return {void}
         */
        function bindStyles(element, styles) {
            Object
                .keys(styles)
                .forEach((key) => element.style[key] = styles[key]);
        }

        /**
         * Render each composer
         * @param  {Array} $list NodeList (composer) as an Array
         * @param  {Number} options.size Number of composer
         * @return {void}
         */
        function render($list, { size = 1 } = {}) {
            $list
                .forEach((node, index) => {
                    const config = sizes(node, size);
                    const styles = {};

                    // Better for rendering
                    styles.transform = `translateX(-${getPositionRight(config, index)}px)`;

                    if (config.isBootstrap) {
                        styles.top = '80px';
                    }

                    bindStyles(node, styles);
                });
        }

        return {
            link(scope, [element]) {

                const unsubscribe = $rootScope
                    .$on('composer.update', (e, { type, data }) => {
                        // Need to perform the rendering after the $digest to match each new composer
                        scope
                            .$applyAsync(() => {
                                const $list = [].slice.call(element.querySelectorAll('.composer-container'));
                                _rAF(() => render($list, data));
                            });

                    });

                scope.$on('$destroy', () => unsubscribe());
            }
        };

    });

