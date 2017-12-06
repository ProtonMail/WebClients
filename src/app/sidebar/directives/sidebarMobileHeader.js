/* @ngInject */
const sidebarMobileHeader = (authentication) => ({
    scope: {},
    replace: true,
    templateUrl: 'templates/sidebar/sidebarMobileHeader.tpl.html',
    link(scope) {
        // IF the user doesn't have any activated emails, Addresses is empty
        const [{ Email = '' } = {}] = authentication.user.Addresses || [];

        scope.user = {
            DisplayName: authentication.user.DisplayName,
            Email
        };
    }
});
export default sidebarMobileHeader;
