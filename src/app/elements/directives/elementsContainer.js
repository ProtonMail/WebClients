import _ from 'lodash';

/* @ngInject */
function elementsContainer(dispatchers) {
    return {
        restrict: 'A',
        link(scope, el) {
            const { dispatcher } = dispatchers(['elements']);
            const onClick = _.debounce(({ target }) => {
                // Prevent click onto the select checkbox
                if (target && !/ptSelectConversation|customMaskInput/.test(target.className)) {
                    dispatcher.elements('open', {
                        element: scope.conversation
                    });
                }
            }, 300);

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default elementsContainer;
