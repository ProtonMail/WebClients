import _ from 'lodash';

/* @ngInject */
function elementsContainer($rootScope) {
    return {
        restrict: 'A',
        link(scope, el) {
            const onClick = _.debounce(({ target }) => {
                // Prevent click onto the select checkbox
                if (target && !/ptSelectConversation|customMaskInput/.test(target.className)) {
                    $rootScope.$emit('elements', {
                        type: 'open',
                        data: {
                            element: scope.conversation
                        }
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
