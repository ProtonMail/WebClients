/* @ngInject */
function pmMeView(dispatchers, addressesModel, authentication, pmMeModel) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/pmMe/pmMeView.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            scope.email = pmMeModel.email();
            scope.hasPmMe = addressesModel.hasPmMe();
            scope.hasPaidMail = authentication.hasPaidMail();

           on('addressesModel', (e, { type = '' }) => {
               if (type === 'addresses.updated') {
                   scope.$applyAsync(() => {
                       scope.hasPmMe = addressesModel.hasPmMe();
                   });
               }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default pmMeView;
