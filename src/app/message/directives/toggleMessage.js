angular.module('proton.message')
.directive('toggleMessage', ($rootScope) => ({
    restrict: 'A',
    link(scope, element) {
        function selection() {
            return window.getSelection().toString().length === 0;
        }

        function mouseup(event) {
            if (selection()) {
                scope.$applyAsync(() => {
                    scope.toggle();
                });
            }
        }

        element.on('mouseup', mouseup);

        scope.$on('$destroy', () => {
            element.off('mouseup', mouseup);
        });
    }
}));
