/* @ngInject */
function pmMeView(dispatchers, addressesModel, authentication, premiumDomainModel) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/pmMe/pmMeView.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            scope.email = premiumDomainModel.email();
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
