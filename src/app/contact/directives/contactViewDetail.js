/* @ngInject */
function contactViewDetail(contactDetailsModel, dispatchers, userType, mailSettingsModel) {
    const loadImages = (scope, el) => (value) => {
        scope.$applyAsync(() => {
            scope.loadImage = value;
        });
        el.classList[value ? 'add' : 'remove']('contactViewDetail-loadRemoteImage');
    };

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
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const loadRemoteImage = loadImages(scope, el[0]);

            scope.isFree = userType().isFree;

            loadRemoteImage(!!mailSettingsModel.get('ShowImages'));

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

            const onClick = ({ target }) => {
                if (target.nodeName !== 'BUTTON') {
                    return;
                }
                const action = target.getAttribute('data-action');
                action === 'loadRemoteImage' && loadRemoteImage(true);
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('click', onClick);
            });
        }
    };
}
export default contactViewDetail;
