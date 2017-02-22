angular.module('proton.elements')
.directive('elementsContainer', ($rootScope) => {
    return {
        restrict: 'A',
        link(scope, el) {

            const onClick = ({ target }) => {
                // Prevent click onto the select checkbox
                if (target && !/ptSelectConversation|customMaskInput/.test(target.className)) {
                    $rootScope.$emit('elements', {
                        type: 'open',
                        data: {
                            element: scope.conversation
                        }
                    });
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
});
