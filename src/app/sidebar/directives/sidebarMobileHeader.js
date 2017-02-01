angular.module('proton.sidebar')
    .directive('sidebarMobileHeader', (authentication) => ({
        scope: {},
        replace: true,
        templateUrl: 'templates/sidebar/sidebarMobileHeader.tpl.html',
        link(scope) {
            scope.user = {
                DisplayName: authentication.user.DisplayName,
                Email: authentication.user.Addresses[0].Email
            };
        }
    }));
