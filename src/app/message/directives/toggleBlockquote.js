angular.module('proton.message')
.directive('toggleBlockquote', () => ({
    restrict: 'A',
    link(scope, element) {
        const onClick = ({ target }) => {

            if (target.tagName === 'BUTTON' && target.classList.contains('more')) {
                event.preventDefault();
                target
                    .classList
                    .toggle('proton-message-blockquote-toggle');
            }
        };

        element.on('click', onClick);
        scope.$on('$destroy', () => {
            element.off('click', onClick);
        });
    }
}));
