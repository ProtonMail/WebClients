/* @ngInject */
function contactModal($state, dispatchers, gettextCatalog, notification, pmModal) {
    const I18N = {
        contactAdded: gettextCatalog.getString('Contact added', null, 'Success message for the contact modal'),
        contactError: gettextCatalog.getString('Error with the request', null, 'Default error for the contact modal')
    };

    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/contact/contactModal.tpl.html'),
        /* @ngInject */
        controller: function(params) {
            const { dispatcher, on, unsubscribe } = dispatchers(['contacts']);

            on('contacts', (event, { type = '', data = {} }) => {
                if (type === 'contactCreated') {
                    const { created = [], errors = [] } = data;

                    if (errors.length) {
                        errors.forEach(({ error = I18N.contactError }) => notification.error(error));
                    }

                    if (created.length) {
                        notification.success(I18N.contactAdded);
                        const { toState: { name = 'secured.contacts.details' } = {}, toParams } = data.state || {};
                        $state.go(name, toParams || { id: created[0].ID });
                        params.close();
                    }
                }
            });

            this.contact = params.contact;
            this.cancel = params.close;
            this.submit = () => dispatcher.contacts('submitContactForm');
            this.$onDestroy = () => {
                unsubscribe();
            };
        }
    });
}
export default contactModal;
