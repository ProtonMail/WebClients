/* @ngInject */
function toggleExpand() {
    const ATTR_EXPANDED = 'aria-expanded';
    return {
        restrict: 'E',
        replace: true,
        template: '<button class="pm-button pm-button--small">{{::text}} <icon data-name="caret"></icon></button>',
        scope: { model: '=', text: '@' },
        link(scope, el) {
            scope.model.toggle = !!scope.model.toggle;
            toggleClass();

            function toggleClass() {
                el[0].setAttribute(ATTR_EXPANDED, scope.model.toggle);
            }

            function onClick() {
                scope.$applyAsync(() => {
                    scope.model.toggle = !scope.model.toggle;
                    toggleClass();
                });
            }

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default toggleExpand;
