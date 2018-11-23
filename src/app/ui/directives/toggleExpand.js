/* @ngInject */
function toggleExpand() {
    const EXPAND_CLASS = 'fa-chevron-down';
    const COLLAPSE_CLASS = 'fa-chevron-right';
    const ATTR_EXPANDED = 'aria-expanded';
    return {
        restrict: 'E',
        replace: true,
        template: '<button class="pm_button link">{{text}} <i class="fa"></fa></button>',
        scope: { model: '=', text: '@' },
        link(scope, element) {
            const $i = element[0].querySelector('.fa');
            scope.model.toggle = !!scope.model.toggle;

            toggleClass();

            function toggleClass() {
                const toAdd = scope.model.toggle ? EXPAND_CLASS : COLLAPSE_CLASS;
                const toRemove = scope.model.toggle ? COLLAPSE_CLASS : EXPAND_CLASS;
                element[0].setAttribute(ATTR_EXPANDED, scope.model.toggle);
                $i.classList.remove(toRemove);
                $i.classList.add(toAdd);
            }

            function onClick() {
                scope.$applyAsync(() => {
                    scope.model.toggle = !scope.model.toggle;
                    toggleClass();
                });
            }

            element[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                element[0].removeEventListener('click', onClick);
            });
        }
    };
}
export default toggleExpand;
