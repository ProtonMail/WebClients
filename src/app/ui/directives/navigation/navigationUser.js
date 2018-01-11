/* @ngInject */
function navigationUser($rootScope, mailSettingsModel) {
    return {
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigationUser.tpl.html'),
        link(scope) {
            const updateView = () => {
                const { DisplayName } = mailSettingsModel.get();
                scope.$applyAsync(() => {
                    scope.displayName = DisplayName;
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
export default navigationUser;
