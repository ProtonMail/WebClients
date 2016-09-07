angular.module('proton.message')
.directive('toggleMessage', ($rootScope) => ({
    restrict: 'A',
    link(scope, element) {
        function selection() {
            if (window.getSelection) {
                return window.getSelection().toString().length === 0;
            } else {
                return true;
            }
        }

        function mouseup(event) {
            if (selection() && event.target.nodeName !== 'A') {
                scope.$applyAsync(() => {
                    scope.toggle();
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
