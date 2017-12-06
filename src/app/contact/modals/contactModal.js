/* @ngInject */
function contactModal($rootScope, $state, gettextCatalog, notification, pmModal) {
    const I18N = {
        contactAdded: gettextCatalog.getString('Contact added', null, 'Success message for the contact modal'),
        contactError: gettextCatalog.getString('Error with the request', null, 'Default error for the contact modal')
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/contact/contactModal.tpl.html',
        /* @ngInject */
        controller: function(params) {
            let processing = false;

            const unsubscribe = $rootScope.$on('contacts', (event, { type = '', data = {} }) => {
                if (type === 'contactCreated') {
                    const { created = [], errors = [] } = data;
                    processing = false;

                    if (errors.length) {
                        errors.forEach(({ error = I18N.contactError }) => notification.error(error));
                    }

                    if (created.length) {
                        notification.success(I18N.contactAdded);
                        $state.go('secured.contacts.details', { id: created[0].ID });
                        params.close();
                    }
                }
            });

            this.contact = params.contact;
            this.cancel = params.close;
            this.$onDestroy = () => unsubscribe();
            this.submit = () => {
                if (!processing) {
                    processing = true;
                    $rootScope.$emit('contacts', { type: 'submitContactForm' });
                }
            };
        }
    });
}
export default contactModal;
