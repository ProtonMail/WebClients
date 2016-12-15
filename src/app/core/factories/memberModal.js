angular.module('proton.core')
.factory('memberModal', (
    pmModal,
    CONSTANTS,
    eventManager,
    gettextCatalog,
    Member,
    $q,
    networkActivityTracker,
    notify,
    pmcw,
    MemberKey,
    authentication,
    Address,
    setupKeys
    ) => {

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
            this.organizationKey = params.organizationKey;
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

            this.isPrivate = false;
            this.private = false;
            this.showAddress = true;
            this.showKeys = true;

            // Edit mode
            if (params.member) {
                this.oldMember = _.extend({}, params.member);

                this.ID = params.member.ID;
                this.name = params.member.Name;
                this.private = Boolean(params.member.Private);
                this.isPrivate = Boolean(params.member.Private);
                this.quota = params.member.MaxSpace / this.unit.value;

                this.showAddress = params.member.Addresses.length === 0 && params.member.Type === 1;
                this.showKeys = params.member.Keys.length === 0 && !this.isPrivate;
            }

            if (this.quota === 0) {
                const freeSpace = this.organization.MaxSpace - this.organization.AssignedSpace;
                this.quota = Math.min(freeSpace, this.units[1].value) / this.unit.value;
            }

            if (this.quota % base === 0) {
                this.unit = this.units[1];
                this.quota = this.quota / base;
            }

            // Functions
            this.submit = () => {
                let mainPromise;
                let addresses = [];
                let notificationMessage;
                let member = {};
                if (params.member) {
                    _.extend(member, params.member);
                }
                member.Name = this.name;
                member.Private = this.private ? 1 : 0;
                member.MaxSpace = this.quota * this.unit.value;

                const check = () => {
                    const deferred = $q.defer();
                    let error;

                    if (this.name.length === 0) {
                        error = gettextCatalog.getString('Invalid name', null, 'Error');
                        deferred.reject(error);
                    } else if ((!member.ID || (!member.Private && params.member.Keys.length === 0)) && this.temporaryPassword !== this.confirmPassword) {
                        error = gettextCatalog.getString('Invalid password', null, 'Error');
                        deferred.reject(error);
                    } else if ((!member.ID || (params.member.Addresses.length === 0 && params.member.Type === 1)) && this.address.length === 0) {
                        error = gettextCatalog.getString('Invalid address', null, 'Error');
                        deferred.reject(error);
                    } else if (this.quota * this.unit.value > (this.organization.MaxSpace - this.organization.UsedSpace)) {
                        error = gettextCatalog.getString('Invalid storage quota', null, 'Error');
                        deferred.reject(error);
                    } else if (!member.ID && !member.Private && !this.organizationKey) {
                        error = gettextCatalog.getString('Cannot decrypt organization key', null, 'Error');
                        deferred.reject(error);
                    } else {
                        deferred.resolve();
                    }

                    return deferred.promise;
                };

                const updateName = () => {

                    if (this.oldMember && this.oldMember.Name === this.name) {
                        return $q.resolve();
                    }

                    const deferred = $q.defer();

                    Member.name(member.ID, this.name)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member.Name = this.name;
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                };

                const updateQuota = () => {

                    if (this.oldMember && this.oldMember.MaxSpace === (this.quota * this.unit.value)) {
                        return $q.resolve();
                    }

                    const deferred = $q.defer();

                    Member.quota(member.ID, this.quota * this.unit.value)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member.MaxSpace = this.quota * this.unit.value;
                            deferred.resolve();
                        } else if (result.data && result.data.Error) {
                            deferred.reject(result.data.Error);
                        } else {
                            deferred.reject('Request error');
                        }
                    });

                    return deferred.promise;
                };

                // const updatePrivate = () => {

                //     if (this.oldMember && Boolean(this.oldMember.Private) === this.private) {
                //         return $q.resolve();
                //     }

                //     const deferred = $q.defer();

                //     if (this.private) {
                //         Member.privatize(member.ID)
                //         .then((result) => {
                //             if (result.data && result.data.Code === 1000) {
                //                 member.Private = 1;
                //                 deferred.resolve();
                //             } else if (result.data && result.data.Error) {
                //                 deferred.reject(result.data.Error);
                //             } else {
                //                 deferred.reject('Request error');
                //             }
                //         });
                //     } else {
                //         deferred.resolve();
                //     }

                //     return deferred.promise;
                // };

                const memberRequest = () => {
                    const deferred = $q.defer();

                    Member.create(member, this.temporaryPassword).then((result) => {
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

                const addressRequest = () => {
                    if (params.member && (params.member.Addresses.length && params.member.Type === 1)) {
                        return Promise.resolve();
                    }

                    return Address.create({ Local: this.address, Domain: this.domain.DomainName, MemberID: member.ID })
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            const address = result.data.Address;
                            member.Addresses.push(address);
                            addresses.push(address);
                            return Promise.resolve();
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                        return Promise.reject('Request error');
                    });
                };

                const generateKey = () => {

                    if (member.Private || (params.member && params.member.Keys.length > 0)) {
                        return Promise.resolve();
                    }

                    if (addresses.length === 0) {
                        addresses = params.member.Addresses;
                    }

                    return setupKeys.generate(addresses, this.temporaryPassword, this.size);
                };

                const keyRequest = (result) => {

                    if (member.Private || (params.member && params.member.Keys.length > 0)) {
                        return Promise.resolve();
                    }

                    return setupKeys.memberSetup(result, this.temporaryPassword, member.ID, this.organizationKey)
                    .then((result) => {
                        member = result;
                    });
                };

                const finish = () => {
                    notify({ message: notificationMessage, classes: 'notification-success' });
                    params.submit(member);
                };

                const error = (error) => {
                    eventManager.call();
                    notify({ message: error, classes: 'notification-danger' });
                };

                if (this.ID) {
                    member.ID = this.ID;
                    notificationMessage = gettextCatalog.getString('Member updated', null, 'Notification');
                    mainPromise = check()
                    .then(updateName)
                    .then(updateQuota);
//                    .then(updatePrivate);
                } else {
                    notificationMessage = gettextCatalog.getString('Member created', null, 'Notification');

                    mainPromise = check().then(memberRequest);
                }

                mainPromise = mainPromise
                .then(addressRequest)
                .then(generateKey)
                .then(keyRequest)
                .then(finish)
                .catch(error);


                networkActivityTracker.track(mainPromise);
            };

            this.cancel = () => {
                params.cancel();
            };
        }
    });
});
