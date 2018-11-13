/* @ngInject */
function contactViewDetail(contactDetailsModel, dispatchers, userType) {
    /**
     * We don't need to display some keys because it can be displayed
     * from a component
     * @param  {String} options.key field
     * @return {Boolean}
     */
    const filterKey = ({ key }) => key !== 'uid' && key !== 'categories';

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
            scope.model = contactDetailsModel.extractHumans(scope.contact.vCard, filterKey);
            scope.model.hasEncrypted = scope.model.encrypted.length;

            on('contacts', (event, { type = '', data = {} }) => {
                if (type === 'contactUpdated' && data.contact.ID === scope.contact.ID) {
                    scope.$applyAsync(() => {
                        scope.model = contactDetailsModel.extractHumans(scope.contact.vCard, filterKey);
                        scope.model.hasEncrypted = scope.model.encrypted.length;
                    });
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactViewDetail;
