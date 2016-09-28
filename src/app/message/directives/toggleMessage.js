angular.module('proton.message')
.directive('toggleMessage', ($rootScope, $state, CONSTANTS, tools) => ({
    restrict: 'A',
    link(scope, element) {
        const type = tools.typeView();
        const allowToggle = type === 'conversation' || $state.includes('secured.drafts.**');

        function selection() {
            if (window.getSelection) {
                return window.getSelection().toString().length === 0;
            } else {
                return true;
            }
        }

        function mouseup(event) {

            if (allowToggle && selection() && event.target.nodeName !== 'A') {

                scope.$applyAsync(() => {
                    // Open the message in composer if it's a draft
                    if (scope.message.Type === CONSTANTS.DRAFT) {
                        return $rootScope.$emit('composer.load', scope.message);
                    }

                    if (typeof scope.message.expand === 'undefined') {
                        scope.message.expand = true;
                        $rootScope.$emit('message.open', {
                            type: 'toggle',
                            data: {
                                message: scope.message
                            }
                        });
                    } else {
                        scope.message.expand = !scope.message.expand;
                    }
                });
            }
        }

        element.on('mouseup', mouseup);
        element.on('touchend', mouseup);

        scope.$on('$destroy', () => {
            element.off('mouseup', mouseup);
            element.off('touchend', mouseup);
        });
    }
}));
