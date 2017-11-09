angular.module('proton.contact')
    .factory('contactModal', ($rootScope, $state, gettextCatalog, notification, pmModal) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/contact/contactModal.tpl.html',
            controller(params) {
                const self = this;
                const unsubscribe = $rootScope.$on('contacts', (event, { type = '', data = {} }) => {
                    if (type === 'contactCreated') {
                        const { created = [] } = data;

                        notification.success(gettextCatalog.getString('Contact added', null));
                        params.close();

                        if (created.length) {
                            $state.go('secured.contacts.details', { id: data.created[0].ID });
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
