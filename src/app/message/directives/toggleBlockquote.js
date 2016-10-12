angular.module('proton.message')
.directive('toggleBlockquote', () => ({
    restrict: 'A',
    link(scope, element) {
        const onClick = (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.classList.contains('more')) {
                event.preventDefault();
                event.target.classList.toggle('proton-message-blockquote-toggle');
            }
        };

        element.on('click', onClick);
        scope.$on('$destroy', () => {
            element.off('click', onClick);
        });
    }
}));
