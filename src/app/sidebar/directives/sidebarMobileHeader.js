/* @ngInject */
const sidebarMobileHeader = (authentication, mailSettingsModel) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/sidebar/sidebarMobileHeader.tpl.html'),
    link(scope) {
        // IF the user doesn't have any activated emails, Addresses is empty
        const [{ Email = '' } = {}] = authentication.user.Addresses || [];
        const { DisplayName } = mailSettingsModel.get();

        scope.user = { DisplayName, Email };
    }
});
export default sidebarMobileHeader;
