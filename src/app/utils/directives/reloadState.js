/* @ngInject */
function reloadState($state) {
    const onClick = () => $state.reload();
    return {
        restrict: 'A',
        scope: {},
        link(scope, el) {
            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default reloadState;
