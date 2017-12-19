/* @ngInject */
function pmMeView($rootScope, authentication, pmMeModel) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: 'templates/pmMe/pmMeView.tpl.html',
        link(scope) {
            scope.name = authentication.user.Name;
            scope.hasPmMe = pmMeModel.has();
            scope.hasPaidMail = authentication.hasPaidMail();

            const unsubscribe = $rootScope.$on('updateUser', () => {
                scope.$applyAsync(() => {
                    scope.hasPmMe = pmMeModel.has();
                });
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default pmMeView;
