angular.module('proton.core')
.factory('addressModal', (pmModal, CONSTANTS, setupKeys, authentication, $rootScope, $state, $q, networkActivityTracker, notify, Address, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/addAddress.tpl.html',
        controller(params) {
            // Variables
            const { domains = [], organizationKey = null, members = [], showMember = true } = params;

            this.domain = domains[0];
            this.domains = domains;
            this.organizationKey = organizationKey;
            this.address = '';
            this.size = 2048;
            this.members = members;
            this.member = members[0];

            this.alias = !angular.isDefined(this.domain.ID);

            this.keyPhase = CONSTANTS.KEY_PHASE;
            this.showMember = showMember && this.keyPhase > 3 && !this.alias;

            if (!this.showMember && this.members.length > 1) {
                throw new Error('An unexpected error has occurred');
            }

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            // Functions
            this.submit = () => {

                const member = this.member;

                if (this.member.Private === 0 && !this.organizationKey) {
                    notify({ message: gettextCatalog.getString('Cannot decrypt organization key', null, 'Error'), classes: 'notification-danger' });
                    return;
                }

                networkActivityTracker.track(
                    Address.create({ Local: this.address, Domain: this.domain.DomainName, MemberID: this.member.ID })
                    .then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            const address = result.data.Address;
                            const numBits = this.size;

                            const generate = () => {
                                return setupKeys.generateAddresses([address], 'temp', numBits);
                            };

                            const keyRequest = ([key]) => {
                                return setupKeys.memberKey('temp', key, member, organizationKey);
                            };

                            const finish = () => {
                                notify({ message: gettextCatalog.getString('Address added', null, 'Info'), classes: 'notification-success' });
                                params.submit(address);
                            };

                            if (this.member.Private === 0) {
                                return generate()
                                    .then(keyRequest)
                                    .then(finish);
                            }
                            return finish();
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Address creation failed', null, 'Error'), classes: 'notification-danger' });
                        }
                    })
                );
            };

            this.addMember = () => {
                params.addMember();
            };

            this.cancel = () => {
                params.cancel();
            };
        }
    });
});
