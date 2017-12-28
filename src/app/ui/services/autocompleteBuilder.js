/* @ngInject */
function autocompleteBuilder(CONSTANTS, customInputCreator) {
    const generateID = () =>
        `${Math.random()
            .toString(32)
            .slice(2, 12)}-${Date.now()}`;

    return (post = _.noop, pre = _.noop) => {
        /**
         * Linking fonction for the directive
         */
        const postCompile = (scope, el, attr) => {
            /**
             * @link {https://leaverou.github.io/awesomplete/#basic-usage}
             */
            let awesomplete = new Awesomplete(el[0].querySelector('input'), {
                minChars: 1,
                maxItems: CONSTANTS.AWESOMEPLETE_MAX_ITEMS,
                autoFirst: true,
                sort: false,
                list: [],
                ul: el[0].querySelector('.autocompleteEmails-autocomplete')
            });

            let previousScrollIndex = 0;

            const onHighlight = () => {
                if (previousScrollIndex !== awesomplete.index) {
                    previousScrollIndex = awesomplete.index;
                    const node = awesomplete.ul.children[previousScrollIndex];
                    /**
                     * Compat with Boolean
                     * {@link http://caniuse.com/#search=scrollIntoView}
                     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView}
                     */
                    node && node.scrollIntoView(false);
                }
            };

            /**
             * Auto scroll will be available with the 1.2
             * Patch extracted from {@link https://github.com/LeaVerou/awesomplete/issues/16875}
             */
            awesomplete.input.addEventListener('awesomplete-highlight', onHighlight);

            post(scope, el, { attr, awesomplete });

            scope.$on('$destroy', () => {
                awesomplete.input.removeEventListener('awesomplete-highlight', onHighlight);
                awesomplete.destroy();
                awesomplete = null;
            });
        };

        const compile = (el) => {
            const item = el[0].querySelector('[id="autocomplete"]');
            item && (item.id = `${item.id}${generateID()}`);
        };

        return customInputCreator('text', { pre, post: postCompile, compile });
    };
}
export default autocompleteBuilder;
