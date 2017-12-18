/* @ngInject */
function pmMeView($rootScope, pmMeModel) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: 'templates/pmMe/pmMeView.tpl.html',
        link(scope) {
            scope.hasPmMe = pmMeModel.has();

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
