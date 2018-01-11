/* @ngInject */
const sidebarMobileHeader = ($rootScope, authentication, mailSettingsModel) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarMobileHeader.tpl.html'),
    link(scope) {
        // IF the user doesn't have any activated emails, Addresses is empty
        const [{ Email = '' } = {}] = authentication.user.Addresses || [];
        const updateView = () => {
            const { DisplayName } = mailSettingsModel.get();
            scope.$applyAsync(() => {
                scope.displayName = DisplayName;
            });
        };
        const unsubscribe = $rootScope.$on('mailSettings', (event, { type = '' }) => {
            const displayName = mailSettingsModel.get('DisplayName');

            if (type === 'updated' && scope.displayName !== displayName) {
                updateView();
            }
        });

        scope.email = Email;
        updateView();
        scope.$on('$destroy', () => {
            unsubscribe();
        });
    }
});
export default sidebarMobileHeader;
