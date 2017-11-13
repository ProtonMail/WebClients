angular.module('proton.contact')
    .factory('contactModal', ($rootScope, $state, gettextCatalog, notification, pmModal) => {
        const I18N = {
            contactAdded: gettextCatalog.getString('Contact added', null, 'Success message for the contact modal'),
            contactError: gettextCatalog.getString('Error with the request', null, 'Default error for the contact modal')
        };
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/contactModal.tpl.html',
            controller(params) {
                const self = this;
                const unsubscribe = $rootScope.$on('contacts', (event, { type = '', data = {} }) => {
                    if (type === 'contactCreated') {
                        const { created = [], errors = [] } = data;

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

                self.contact = params.contact;
                self.cancel = () => params.close();
                self.$onDestroy = () => unsubscribe();
                self.submit = () => {
                    $rootScope.$emit('contacts', { type: 'submitContactForm' });
                };
            }
        });
    });
