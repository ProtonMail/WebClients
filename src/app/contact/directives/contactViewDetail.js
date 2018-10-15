/* @ngInject */
function contactViewDetail(contactDetailsModel, dispatchers, userType) {
    return {
        scope: {
            contact: '=',
            mode: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactViewDetail.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers();

            scope.isFree = userType().isFree;
            scope.model = contactDetailsModel.extractHumans(scope.contact.vCard, ({ key }) => key !== 'uid');
            scope.model.hasEncrypted = scope.model.encrypted.length;

            on('contacts', (event, { type = '', data = {} }) => {
                if (type === 'contactUpdated' && data.contact.ID === scope.contact.ID) {
                    scope.$applyAsync(() => {
                        scope.model = contactDetailsModel.extractHumans(
                            scope.contact.vCard,
                            ({ key }) => key !== 'uid'
                        );
                        scope.model.hasEncrypted = scope.model.encrypted.length;
                    });
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactViewDetail;
