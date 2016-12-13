angular.module('proton.ui')
.directive('settingsMenu', (authentication) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope) {
            scope.isSubUser = authentication.user.subuser;
        }
    };
});
