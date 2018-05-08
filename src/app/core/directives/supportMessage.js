/* @ngInject */
function supportMessage(goAndReload) {
    const onClick = ({ target }) => {
        const action = target.getAttribute('data-action');

        action === 'freshLogin' && goAndReload('login');
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/core/supportMessage.tpl.html'),
        replace: true,
        link(scope, el) {
            el.on('click', onClick);
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default supportMessage;
