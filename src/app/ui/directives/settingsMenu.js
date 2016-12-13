angular.module('proton.ui')
.directive('settingsMenu', (authentication, CONSTANTS) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope) {
            scope.isSubUser = authentication.user.subuser;
            scope.keyPhase = CONSTANTS.KEY_PHASE;
        }
    };
});
