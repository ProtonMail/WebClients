angular.module('proton.core')
.factory('addressModal', (pmModal, setupKeys, authentication, $rootScope, $state, $q, networkActivityTracker, notify, Address, gettextCatalog, organizationModel) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/addAddress.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            const { domains = [], organizationKey = null, members = [] } = params;
            const organization = organizationModel.get();

            self.domain = domains[0];
            self.domains = domains;
            self.organizationKey = organizationKey;
            self.address = '';
            self.size = 2048;
            self.members = members;
            self.member = members[0];
            self.showAddMember = organization.HasKeys === 1 && $state.is('secured.domains');

            // Functions
            self.addMember = () => params.addMember();
            self.cancel = () => params.cancel();
            self.open = (name) => $rootScope.$broadcast(name, params.domain);
            self.submit = () => {
                const member = self.member;

                if (member.Private === 0 && !self.organizationKey) {
                    notify({ message: gettextCatalog.getString('Cannot decrypt organization key', null, 'Error'), classes: 'notification-danger' });
                    return;
                }

                const successMessage = gettextCatalog.getString('Address added', null, 'Info');
                const errorMessage = gettextCatalog.getString('Address creation failed', null, 'Error');
                const promise = Address.create({ Local: self.address, Domain: self.domain.DomainName, MemberID: member.ID })
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        const address = data.Address;
                        const numBits = self.size;

                        const generate = () => {
                            return setupKeys.generateAddresses([address], 'temp', numBits);
                        };

                        const keyRequest = ([key]) => {
                            return setupKeys.memberKey('temp', key, member, organizationKey);
                        };

                        const finish = () => {
                            notify({ message: successMessage, classes: 'notification-success' });
                            params.submit(address);
                        };

                        if (member.Private === 0) {
                            return generate()
                                .then(keyRequest)
                                .then(finish);
                        }
                        return finish();
                    }
                    throw new Error(data.Error || errorMessage);
                });
                networkActivityTracker.track(promise);
            };
        }
    });
});
