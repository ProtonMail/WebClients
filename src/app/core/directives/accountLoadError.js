/* @ngInject */
function accountLoadError(AppModel) {
    const onClick = ({ target }) => {
        if (target.dataset.action === 'reload') {
            window.location.reload();
        }
    };

    return {
        restrict: 'E',
        templateUrl: require('../../../templates/directives/core/accountLoadError.tpl.html'),
        replace: true,
        link(scope, el) {
            // To set the dark style...
            AppModel.set('isUnlock', true);

            el.on('click', onClick);
            scope.$on('$destroy', () => {
                AppModel.set('isUnlock', false);
                el.off('click', onClick);
            });
        }
    };
}
export default accountLoadError;
