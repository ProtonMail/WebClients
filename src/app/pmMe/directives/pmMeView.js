/* @ngInject */
function pmMeView($rootScope, addressesModel, authentication) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/pmMe/pmMeView.tpl.html'),
        link(scope) {
            scope.name = authentication.user.Name;
            scope.hasPmMe = addressesModel.hasPmMe();
            scope.hasPaidMail = authentication.hasPaidMail();

            const unsubscribe = $rootScope.$on('addressesModel', (e, { type = '' }) => {
                if (type === 'addresses.updated') {
                    scope.$applyAsync(() => {
                        scope.hasPmMe = addressesModel.hasPmMe();
                    });
                }
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default pmMeView;
