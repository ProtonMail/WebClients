import _ from 'lodash';

import { uniqID } from '../../../helpers/string';
import { AWESOMEPLETE_MAX_ITEMS } from '../../constants';

/* @ngInject */
function autocompleteBuilder(customInputCreator) {
    return ({ link: post = _.noop, pre = _.noop, compile = _.noop }, opt = {}) => {
        /**
         * Linking fonction for the directive
         */
        const postCompile = (scope, el, attr) => {
            const $input = el[0].querySelector('input');
            $input && ($input.id = `${$input.id}${uniqID()}`);

            /**
             * @link {https://leaverou.github.io/awesomplete/#basic-usage}
             */
            let awesomplete = new Awesomplete($input, {
                minChars: 1,
                maxItems: AWESOMEPLETE_MAX_ITEMS,
                autoFirst: true,
                sort: false,
                list: [],
                ul: el[0].querySelector('.autocompleteEmails-autocomplete'),
                ...opt
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

        return customInputCreator('text', { pre, post: postCompile, compile });
    };
}
export default autocompleteBuilder;
