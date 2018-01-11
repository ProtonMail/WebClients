/* @ngInject */
function toolbarDesktop($rootScope, mailSettingsModel) {
    return {
        replace: true,
        templateUrl: require('../../../templates/ui/toolbarDesktop.tpl.html'),
        link(scope) {
            const updateView = () => {
                const { ViewLayout } = mailSettingsModel.get();
                scope.$applyAsync(() => {
                    scope.viewLayout = ViewLayout;
                });
            };
            const unsubscribe = $rootScope.$on('mailSettings', (event, { type = '' }) => {
                if (type === 'updated') {
                    updateView();
                }
            });
            updateView();
            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default toolbarDesktop;
