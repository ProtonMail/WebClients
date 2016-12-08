angular.module('proton.ui')
.directive('toggleExpand', () => {
    const EXPAND_CLASS = 'fa-chevron-down';
    const COLLAPSE_CLASS = 'fa-chevron-up';
    return {
        restrict: 'E',
        replace: true,
        template: '<button class="pm_button link fa"></button>',
        scope: { model: '=' },
        link(scope, element) {
            scope.model = scope.model || false;
            toggleClass();

            function toggleClass() {
                const toRemove = (scope.model) ? EXPAND_CLASS : COLLAPSE_CLASS;
                const toAdd = (scope.model) ? COLLAPSE_CLASS : EXPAND_CLASS;
                element[0].classList.remove(toRemove);
                element[0].classList.add(toAdd);
            }

            function onClick() {
                scope.$applyAsync(() => {
                    scope.model = !scope.model;
                    toggleClass();
                });
            }

            element[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                element[0].removeEventListener('click', onClick);
            });
        }
    };
});
