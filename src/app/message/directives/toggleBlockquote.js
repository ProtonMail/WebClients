angular.module('proton.message')
.directive('toggleBlockquote', ($rootScope) => ({
    restrict: 'A',
    link(scope, element) {
        var click = function(event) {

            const target = event.target;

            if (target.tagName === 'BUTTON' && target.classList.contains('more')) {
                event.preventDefault();
                target
                    .classList
                    .toggle('proton-message-blockquote-toggle');
            }
        };

        element.on('click', click);
        scope.$on('$destroy', () => { element.off('click', click); });
    }
}));
