angular.module('proton.message')
.directive('toggleBlockquote', ($rootScope) => ({
    restrict: 'A',
    link(scope, element) {
        var click = function(event) {
            var target = event.target;

            if (target.tagName === 'BUTTON' && target.classList.contains('more')) {
                
                event.preventDefault();

                var blockquote = target.nextElementSibling;

                if (blockquote.style.display === 'none') {
                    blockquote.style.display = 'block';
                } else {
                    blockquote.style.display = 'none';
                }
            }
        };

        element.on('click', click);
        scope.$on('$destroy', () => { element.off('click', click); });
    }
}));
