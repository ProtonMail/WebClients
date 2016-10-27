angular.module('proton.core')
.factory('addressModal', (pmModal, CONSTANTS, setupKeys, authentication, $rootScope, $state, $q, networkActivityTracker, notify, Address, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/addAddress.tpl.html',
        controller(params) {
            // Variables
            const { domains = [], organizationKey = {}, members = [] } = params;

            this.domain = domains[0];
            this.domains = domains;
            this.organizationKey = organizationKey;
            this.address = '';
            this.size = 2048;
            this.members = members;
            this.member = members[0];

            this.alias = !angular.isDefined(this.domain.ID);

            this.keyPhase = CONSTANTS.KEY_PHASE;
            this.showMember = this.keyPhase > 3 && !this.alias;

            if (!this.showMember) {
                this.member = members.filter((member) => member.Self)[0];
            }

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            // Functions
            this.submit = () => {

                const member = this.member;
                const mailboxPassword = authentication.getPassword();

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
                                return setupKeys.generateAddresses([address], mailboxPassword, numBits);
                            };

                            const keyRequest = ([key]) => {
                                if (this.member.Private === 0) {
                                    return setupKeys.memberKey(mailboxPassword, key, member, organizationKey);
                                }
                                return setupKeys.key(key);
                            };

                            const finish = () => {
                                notify({ message: gettextCatalog.getString('Address added', null, 'Info'), classes: 'notification-success' });
                                params.submit(address);
                            };

                            if (this.member.Private === 0 || this.member.Self) {
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
