angular.module('proton.core')
.factory('addressModal', (pmModal, authentication, $rootScope, $state, $q, networkActivityTracker, notify, Address, gettextCatalog, eventManager, pmcw, Key, MemberKey) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/domain/address.tpl.html',
        controller(params) {
            // Variables
            const { domain, organizationPublicKey, step, members = [] } = params;

            this.domain = domain;
            this.organizationPublicKey = organizationPublicKey;
            this.step = step;
            this.address = '';
            this.password = '';
            this.size = 2048;
            this.members = members;
            this.member = members[0];

            this.open = (name) => {
                $rootScope.$broadcast(name, params.domain);
            };

            // Functions
            this.add = function () {
                networkActivityTracker.track(
                    Address.create({ Local: this.address, Domain: this.domain.DomainName, MemberID: this.member.ID })
                    .then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            const address = result.data.Address;
                            const password = this.password;
                            const numBits = this.size;

                            const generate = function () {
                                const randomString = authentication.randomString(24);

                                return $q.all({
                                    userKey: pmcw.generateKeysRSA(address.Email, password, numBits),
                                    memberKey: pmcw.generateKeysRSA(address.Email, randomString, numBits),
                                    token: pmcw.encryptMessage(randomString, this.organizationPublicKey)
                                });
                            }.bind(this);

                            const keyRequest = function (result) {
                                const deferred = $q.defer();

                                MemberKey.create({
                                    AddressID: address.ID,
                                    UserKey: result.userKey.privateKeyArmored,
                                    MemberKey: result.memberKey,
                                    Token: result.token
                                })
                                .then((result) => {
                                    if (result.data && result.data.Code === 1000) {
                                        deferred.resolve();
                                    } else if (result.data && result.data.Error) {
                                        deferred.reject(result.data.Error);
                                    } else {
                                        deferred.reject('Request error');
                                    }
                                });

                                return deferred.promise;
                            };

                            const finish = function () {
                                notify({ message: gettextCatalog.getString('Address added', null, 'Info'), classes: 'notification-success' });
                                this.domain.Addresses.push(address);

                                return eventManager.call();
                            }.bind(this);

                            if (this.member.Private === 0) {
                                return generate()
                                    .then(keyRequest)
                                    .then(finish);
                            }
                            return finish();

                        } else if (angular.isDefined(result.data) && result.data.Code === 31006) {
                            notify({ message: gettextCatalog.getString('Domain not found', null, 'Error'), classes: 'notification-danger' });
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Address creation failed', null, 'Error'), classes: 'notification-danger' });
                        }
                    })
                );
            }.bind(this);

            this.createMember = function () {
                params.cancel();
                $state.go('secured.members', { action: 'new' });
            };

            this.next = function () {
                params.next();
            };

            this.close = function () {
                params.cancel();
            };
        }
    });
});
