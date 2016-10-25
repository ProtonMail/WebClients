angular.module('proton.core')
.factory('memberModal', (pmModal, CONSTANTS, gettextCatalog, Member, $q, networkActivityTracker, notify, pmcw, MemberKey, authentication, Address) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/member.tpl.html',
        controller(params) {
            // Variables
            const base = CONSTANTS.BASE_SIZE;

            // Default Parameters
            this.ID = null;
            this.step = 'member';
            this.size = 2048;
            this.organization = params.organization;
            this.organizationPublicKey = params.organizationPublicKey;
            this.domains = params.domains;
            this.domain = params.domains[0];
            this.name = '';
            this.temporaryPassword = '';
            this.confirmPassword = '';
            this.address = '';
            this.quota = 0;
            this.units = [
                { label: 'MB', value: base * base },
                { label: 'GB', value: base * base * base }
            ];
            this.unit = this.units[0];
            this.private = true;

            // Edit mode
            if (params.member) {
                this.ID = params.member.ID;
                this.name = params.member.Name;
                this.private = Boolean(params.member.Private);
                this.isPrivate = Boolean(params.member.Private);
                this.quota = params.member.MaxSpace / this.unit.value;
            }

            // Functions
            this.submit = function () {
                let mainPromise;
                let address;
                let notificationMessage;
                let member = {
                    Name: this.name,
                    Private: this.private ? 1 : 0,
                    MaxSpace: this.quota * this.unit.value
                };

                const check = function () {
                    const deferred = $q.defer();
                    let error;

                    if (this.name.length === 0) {
                        error = gettextCatalog.getString('Invalid Name', null, 'Error');
                        deferred.reject(error);
                    } else if (!member.ID && this.temporaryPassword !== this.confirmPassword) {
                        error = gettextCatalog.getString('Invalid Password', null, 'Error');
                        deferred.reject(error);
                    } else if (!member.ID && this.address.length === 0) {
                        error = gettextCatalog.getString('Invalid Address', null, 'Error');
                        deferred.reject(error);
                    } else if (this.quota * this.unit.value > (this.organization.MaxSpace - this.organization.UsedSpace)) {
                        error = gettextCatalog.getString('Invalid Quota', null, 'Error');
                        deferred.reject(error);
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                }.bind(this);

                const updateName = function () {
                    const deferred = $q.defer();

                    Member.name(member.ID, this.name)
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
                }.bind(this);

                const updateQuota = function () {
                    const deferred = $q.defer();

                    Member.quota(member.ID, this.quota * this.unit.value)
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
                }.bind(this);

                const updatePrivate = function () {
                    const deferred = $q.defer();

                    if (this.private) {
                        Member.private(member.ID, this.quota * this.unit.value)
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                deferred.resolve();
                            } else if (result.data && result.data.Error) {
                                deferred.reject(result.data.Error);
                            } else {
                                deferred.reject('Request error');
                            }
                        });
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                }.bind(this);

                const memberRequest = function () {
                    const deferred = $q.defer();
                    const request = member.ID ? Member.update(member) : Member.create(member);

                    request.then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member = result.data.Member;
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                };

                const addressRequest = function () {
                    const deferred = $q.defer();

                    Address.create({ Local: this.address, Domain: this.domain.DomainName, MemberID: member.ID })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            address = result.data.Address;
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                }.bind(this);

                const generateKey = function () {
                    const password = this.temporaryPassword;
                    const numBits = this.size;
                    const randomString = authentication.randomString(24);
                    const organizationKey = this.organizationPublicKey;

                    return pmcw.generateKeysRSA(address.Email, password, numBits)
                    .then((result) => {
                        const userKey = result.privateKeyArmored;

                        return pmcw.decryptPrivateKey(userKey, password)
                        .then((result) => {
                            return pmcw.encryptPrivateKey(result, randomString)
                            .then((memberKey) => {
                                return pmcw.encryptMessage(randomString, organizationKey)
                                .then((token) => {
                                    return Promise.resolve({
                                        userKey,
                                        memberKey,
                                        token
                                    });
                                });
                            });
                        });
                    });
                }.bind(this);

                const keyRequest = function (result) {
                    return MemberKey.create({
                        AddressID: address.ID,
                        UserKey: result.userKey,
                        MemberKey: result.memberKey,
                        Token: result.token
                    })
                    .then(({ data = {} }) => {
                        if (data.Code === 1000) {
                            return Promise.resolve();
                        }
                        return Promise.reject(data.Error || 'Request error');
                    });
                };

                const finish = function () {
                    notify({ message: notificationMessage, classes: 'notification-success' });
                    params.cancel(member);
                };

                const error = function (error) {
                    notify({ message: error, classes: 'notification-danger' });
                };

                if (this.ID) {
                    member.ID = this.ID;
                    notificationMessage = gettextCatalog.getString('Member updated', null, 'Notification');
                    mainPromise = check()
                    .then(updateName)
                    .then(updateQuota)
                    .then(updatePrivate)
                    .then(finish)
                    .catch(error);
                } else {
                    member.Password = this.temporaryPassword;
                    notificationMessage = gettextCatalog.getString('Member created', null, 'Notification');

                    if (member.Private === 0) {
                        mainPromise = check()
                        .then(memberRequest)
                        .then(addressRequest)
                        .then(generateKey)
                        .then(keyRequest)
                        .then(finish)
                        .catch(error);
                    } else {
                        mainPromise = check()
                        .then(memberRequest)
                        .then(addressRequest)
                        .then(finish)
                        .catch(error);
                    }
                }

                networkActivityTracker.track(mainPromise);
            }.bind(this);

            this.cancel = function () {
                params.cancel();
            };
        }
    });
});
