/* @ngInject */
function pmMeView($rootScope, authentication) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: 'templates/pmMe/pmMeView.tpl.html',
        link(scope) {
            scope.name = authentication.user.Name;
            scope.hasPmMe = authentication.hasPmMe();
            scope.hasPaidMail = authentication.hasPaidMail();

            const unsubscribe = $rootScope.$on('updateUser', () => {
                scope.$applyAsync(() => {
                    scope.hasPmMe = authentication.hasPmMe();
                });
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default pmMeView;
