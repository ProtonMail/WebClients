/* @ngInject */
function contactViewDetail(contactDetailsModel, dispatchers) {
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

            scope.model = contactDetailsModel.extractHumans(scope.contact.vCard, ({ key }) => key !== 'uid');
            scope.model.hasEncrypted = !!Object.keys(scope.model.encrypted).length;

            on('contacts', (event, { type = '', data = {} }) => {
                if (type === 'contactUpdated' && data.contact.ID === scope.contact.ID) {
                    scope.$applyAsync(() => {
                        scope.model = contactDetailsModel.extractHumans(
                            scope.contact.vCard,
                            ({ key }) => key !== 'uid'
                        );
                        scope.model.hasEncrypted = !!Object.keys(scope.model.encrypted).length;
                    });
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactViewDetail;
