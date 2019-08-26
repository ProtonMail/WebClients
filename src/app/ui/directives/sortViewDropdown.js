/* @ngInject */
function sortViewDropdown($state) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/ui/sortViewDropdown.tpl.html'),
        link(scope, el) {
            scope.layout = $state.params.sort || '-date';

            const clearState = (state) => state.replace('.element', '');

            /**
             * Order the list by a specific parameter
             * @param {String} criterion
             */
            const orderBy = (sort) => {
                const opt = { sort: sort === '-date' ? undefined : sort };

                $state.go(clearState($state.$current.name), {
                    ...$state.params,
                    page: undefined,
                    id: undefined,
                    ...opt
                });
            };

            const onClick = ({ target }) => {
                orderBy(target.getAttribute('data-action-arg'));
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default sortViewDropdown;
