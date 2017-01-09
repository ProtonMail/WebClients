angular.module('proton.core')
.factory('memberModal', (
    pmModal,
    CONSTANTS,
    eventManager,
    gettextCatalog,
    Member,
    networkActivityTracker,
    notify,
    pmcw,
    MemberKey,
    authentication,
    Address,
    setupKeys
    ) => {
    function initMin(organization, member) {
        return (member) ? organization.AssignedSpace - member.UsedSpace : organization.AssignedSpace;
    }
    function initMax(organization) {
        return organization.MaxSpace;
    }
    function initValue(organization, member) {
        return (member) ? member.UsedSpace : organization.AssignedSpace;
    }
    function initStart(organization, member) {
        return (member) ? member.UsedSpace : organization.AssignedSpace;
    }
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/member.tpl.html',
        controller(params) {
            // Variables
            const self = this;
            const base = CONSTANTS.BASE_SIZE;

            // Default Parameters
            self.ID = null;
            self.step = 'member';
            self.size = 2048;
            self.organization = params.organization;
            self.organizationKey = params.organizationKey;
            self.domains = params.domains;
            self.domain = params.domains[0];
            self.name = '';
            self.temporaryPassword = '';
            self.confirmPassword = '';
            self.address = '';
            self.unit = base * base * base;
            self.min = initMin(params.organization, params.member);
            self.max = initMax(params.organization);
            self.sliderValue = initValue(params.organization, params.member);
            self.sliderOptions = {
                start: initStart(params.organization, params.member) / self.unit,
                step: 0.1,
                connect: [true, false],
                tooltips: true,
                range: { min: self.min / self.unit, max: self.max / self.unit },
                pips: { mode: 'range', stepped: true, density: 4 },
                legend: 'GB'
            };
            self.isPrivate = false;
            self.private = false;
            self.showAddress = true;
            self.showKeys = true;

            // Edit mode
            if (params.member) {
                self.oldMember = _.extend({}, params.member);

                self.ID = params.member.ID;
                self.name = params.member.Name;
                self.private = Boolean(params.member.Private);
                self.isPrivate = Boolean(params.member.Private);
                self.showAddress = params.member.Addresses.length === 0 && params.member.Type === 1;
                self.showKeys = params.member.Keys.length === 0 && !self.isPrivate;
            }

            // Functions
            self.submit = () => {
                let mainPromise;
                let addresses = [];
                let notificationMessage;
                let member = {};
                if (params.member) {
                    _.extend(member, params.member);
                }
                member.Name = self.name;
                member.Private = self.private ? 1 : 0;
                member.MaxSpace = (self.sliderValue - self.min) * self.unit;

                const check = () => {
                    if (self.name.length === 0) {
                        return Promise.reject(gettextCatalog.getString('Invalid name', null, 'Error'));
                    } else if ((!member.ID || (!member.Private && params.member.Keys.length === 0)) && self.temporaryPassword !== self.confirmPassword) {
                        return Promise.reject(gettextCatalog.getString('Invalid password', null, 'Error'));
                    } else if ((!member.ID || (params.member.Addresses.length === 0 && params.member.Type === 1)) && self.address.length === 0) {
                        return Promise.reject(gettextCatalog.getString('Invalid address', null, 'Error'));
                    } else if ((self.sliderValue - self.min) * self.unit > (self.organization.MaxSpace - self.organization.UsedSpace)) {
                        return Promise.reject(gettextCatalog.getString('Invalid storage quota', null, 'Error'));
                    } else if (!member.ID && !member.Private && !self.organizationKey) {
                        return Promise.reject(gettextCatalog.getString('Cannot decrypt organization key', null, 'Error'));
                    }
                    return Promise.resolve();
                };

                const updateName = () => {
                    if (self.oldMember && self.oldMember.Name === self.name) {
                        return Promise.resolve();
                    }

                    return Member.name(member.ID, self.name)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member.Name = self.name;
                            return Promise.resolve();
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                        return Promise.reject('Request error');
                    });
                };

                const updateQuota = () => {
                    if (self.oldMember && self.oldMember.MaxSpace === ((self.sliderValue - self.min) * self.unit)) {
                        return Promise.resolve();
                    }

                    return Member.quota(member.ID, (self.sliderValue - self.min) * self.unit)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member.MaxSpace = (self.sliderValue - self.min) * self.unit;
                            Promise.resolve();
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                        return Promise.reject('Request error');
                    });
                };

                // const updatePrivate = () => {
                //     if (self.oldMember && Boolean(self.oldMember.Private) === self.private) {
                //         return Promise.resolve();
                //     }
                //
                //     if (self.private) {
                //         return Member.privatize(member.ID)
                //         .then((result) => {
                //             if (result.data && result.data.Code === 1000) {
                //                 member.Private = 1;
                //                 return Promise.resolve();
                //             } else if (result.data && result.data.Error) {
                //                 return Promise.reject(result.data.Error);
                //             }
                //             return Promise.reject('Request error');
                //         });
                //     }
                //
                //     return Promise.resolve();
                // };

                const memberRequest = () => {
                    return Member.create(member, self.temporaryPassword).then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            member = result.data.Member;
                            return Promise.resolve();
                        } else if (result.data && result.data.Error) {
                            return Promise.reject(result.data.Error);
                        }
                        return Promise.reject('Request error');
                    });
                };

                const addressRequest = () => {
                    if (params.member && params.member.Addresses.length) {
                        return Promise.resolve();
                    }

                    return Address.create({ Local: self.address, Domain: self.domain.DomainName, MemberID: member.ID })
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

                    return setupKeys.generate(addresses, self.temporaryPassword, self.size);
                };

                const keyRequest = (result) => {

                    if (member.Private || (params.member && params.member.Keys.length > 0)) {
                        return Promise.resolve();
                    }

                    return setupKeys.memberSetup(result, self.temporaryPassword, member.ID, self.organizationKey)
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

                if (self.ID) {
                    member.ID = self.ID;
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

            self.cancel = () => {
                params.cancel();
            };
        }
    });
});
