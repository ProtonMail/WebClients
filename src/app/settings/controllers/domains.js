angular.module('proton.settings')
.controller('DomainsController', (
    $controller,
    $q,
    $rootScope,
    $scope,
    $state,
    gettextCatalog,
    Address,
    activateOrganizationModal,
    addressModal,
    addressesModal,
    authentication,
    confirmModal,
    CONSTANTS,
    dkimModal,
    dmarcModal,
    Domain,
    domainModal,
    domains,
    eventManager,
    generateOrganizationModal,
    Member,
    members,
    memberModal,
    mxModal,
    networkActivityTracker,
    notify,
    Organization,
    organization,
    organizationKeys,
    pmcw,
    spfModal,
    verificationModal
) => {

    $controller('AddressesController', { $scope, authentication, domains, members, organization, organizationKeys, pmcw });

    // Listeners
    $scope.$on('domain', (event, domain) => {
        $scope.closeModals();
        $scope.addDomain(domain);
    });

    $scope.$on('spf', (event, domain) => {
        $scope.closeModals();
        $scope.spf(domain);
    });

    $scope.$on('address', (event, domain) => {
        $scope.closeModals();
        $scope.addAddresses(domain);
    });

    $scope.$on('mx', (event, domain) => {
        $scope.closeModals();
        $scope.mx(domain);
    });

    $scope.$on('dkim', (event, domain) => {
        $scope.closeModals();
        $scope.dkim(domain);
    });

    $scope.$on('verification', (event, domain) => {
        $scope.closeModals();
        $scope.verification(domain);
    });

    $scope.$on('dmarc', (event, domain) => {
        $scope.closeModals();
        $scope.dmarc(domain);
    });

    /**
     * Open modal process to add a custom domain.
     * @param {Object} domain
     * Docs: https://github.com/ProtonMail/Slim-API/blob/develop_domain/api-spec/pm_api_domains.md
     */
    $scope.wizard = (domain) => {
        // go through all steps and show the user the step they need to complete next. allow for back and next options.
        // if domain has a name, we can skip the first step
        /* steps:
            1. verify ownership with txt record
            2. add addresses
            3. add mx
            4. add spf
            5. add dkim
            6. add dmarc
        */
        if (!domain.DomainName) {
            // show first step
            $scope.addDomain();
        } else if ((domain.VerifyState !== 2)) {
            $scope.verification(domain);
        } else if (domain.Addresses.length === 0) {
            $scope.addAddresses(domain);
        } else if (domain.MxState !== 3) {
            $scope.mx(domain);
        } else if (domain.SpfState !== 3) {
            $scope.spf(domain);
        } else if (domain.DkimState !== 4) {
            $scope.dkim(domain);
        } else if (domain.DmarcState !== 3) {
            $scope.dmarc(domain);
        }
    };

    /**
     * Delete domain
     * @param {Object} domain
     */
    $scope.deleteDomain = (domain) => {
        const index = $scope.domains.indexOf(domain);

        confirmModal.activate({
            params: {
                title: gettextCatalog.getString('Delete domain', null, 'Title'),
                message: gettextCatalog.getString('Are you sure you want to delete this address?', null, 'Info'),
                confirm() {
                    networkActivityTracker.track(Domain.delete(domain.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            notify({ message: gettextCatalog.getString('Domain deleted', null), classes: 'notification-success' });
                            $scope.domains.splice(index, 1); // Remove domain in interface
                            eventManager.call(); // Call event log manager
                            confirmModal.deactivate();
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Check if this address is owned by the current user
     * @param {Object} address
     * @return {Boolean}
     */
    $scope.owned = (address) => {
        const found = _.findWhere(authentication.user.Addresses, { ID: address.ID });

        return angular.isDefined(found);
    };

    /**
     * Check if this address is owned by a private member
     * @param {Object} address
     * @return {Boolean}
     */
    $scope.privated = (address) => {
        const member = _.findWhere($scope.members, { ID: address.MemberID });

        return member.Private === 1;
    };

    /**
     * Open modal process to add a custom domain
     */
    $scope.addDomain = (domain) => {
        domainModal.activate({
            params: {
                step: 1,
                domain,
                submit(name) {
                    networkActivityTracker.track(Domain.create({ Name: name }).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            notify({ message: gettextCatalog.getString('Domain created', null), classes: 'notification-success' });
                            $scope.domains.push(result.data.Domain);
                            eventManager.call(); // Call event log manager
                            domainModal.deactivate();
                            // open the next step
                            $scope.verification(result.data.Domain);
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Error during creation', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Error during creation', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                next() {
                    domainModal.deactivate();
                    $scope.verification(domain);
                },
                cancel() {
                    domainModal.deactivate();
                }
            }
        });
    };

    /**
     * Refresh status for a domain
     * @param {Object} domain
     */
    $scope.refreshStatus = () => {
        networkActivityTracker.track(Domain.query().then((result) => {
            if (result.data && result.data.Code === 1000) {
                $scope.domains = result.data.Domains;
            }
        }));
    };

    /**
     * Open verification modal
     * @param {Object} domain
     */
    $scope.verification = (domain) => {
        const index = $scope.domains.indexOf(domain);

        verificationModal.activate({
            params: {
                domain,
                step: 2,
                submit() {
                    networkActivityTracker.track(Domain.get(domain.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            // check verification code
                            // 0 is default, 1 is has code but wrong, 2 is good
                            switch (result.data.Domain.VerifyState) {
                                case 0:
                                    notify({ message: gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'), classes: 'notification-danger' });
                                    break;
                                case 1:
                                    notify({ message: gettextCatalog.getString('Wrong verification code. Please make sure you copied the verification code correctly and try again. It can take up to 1 hour for changes to take affect.', null, 'Error'), classes: 'notification-danger', duration: 30000 });
                                    break;
                                case 2:
                                    notify({ message: gettextCatalog.getString('Domain verified', null), classes: 'notification-success' });
                                    $scope.domains[index] = result.data.Domain;
                                    verificationModal.deactivate();
                                    // open the next step
                                    $scope.addAddresses(result.data.Domain);
                                    break;
                                default:
                                    break;
                            }
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                next() {
                    $scope.addAddresses(domain);
                },
                close() {
                    verificationModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to add a new address
     */
    $scope.addAddresses = (domain = {}) => {

        if ($scope.keyStatus > 0 && CONSTANTS.KEY_PHASE > 3) {
            notify({ message: gettextCatalog.getString('Administrator privileges must be activated', null, 'Error'), classes: 'notification-danger' });
            $state.go('secured.members');
            return;
        }

        const memberParams = {
            params: {
                organization: $scope.organization,
                organizationPublicKey: $scope.organizationPublicKey,
                domains: [domain],
                submit(member) {
                    memberModal.deactivate();
                    eventManager.call();

                    $scope.members.push(member);
                    const addresses = member.Addresses;
                    for (let i = 0; i < addresses.length; i++) {
                        addresses[i].MemberID = member.ID;
                    }
                    domain.Addresses = domain.Addresses.concat(addresses);

                    $scope.addAddresses(domain);
                },
                cancel() {
                    memberModal.deactivate();
                    $scope.addAddresses(domain);
                }
            }
        };

        const addressParams = {
            params: {
                domains: [domain],
                members: $scope.members,
                organizationPublicKey: $scope.organizationPublicKey,
                addMember() {
                    addressModal.deactivate();
                    memberModal.activate(memberParams);
                },
                submit(address) {
                    addressModal.deactivate();
                    domain.Addresses.push(address);
                    $scope.addAddresses(domain);
                    eventManager.call();
                },
                cancel() {
                    addressModal.deactivate();
                    $scope.addAddresses(domain);
                }
            }
        };

        addressesModal.activate({
            params: {
                step: 3,
                domain,
                members: $scope.members,
                addressParams,
                memberParams,
                next() {
                    addressesModal.deactivate();
                    $scope.mx(domain);
                },
                cancel() {
                    addressesModal.deactivate();
                    eventManager.call();
                }
            }
        });
    };

    /**
     * Open MX modal
     * @param {Object} domain
     */
    $scope.mx = (domain) => {
        mxModal.activate({
            params: {
                domain,
                step: 4,
                next() {
                    mxModal.deactivate();
                    $scope.spf(domain);
                },
                close() {
                    mxModal.deactivate();
                    eventManager.call();
                }
            }
        });
    };

    /**
     * Open SPF modal
     * @param {Object} domain
     */
    $scope.spf = (domain) => {
        spfModal.activate({
            params: {
                domain,
                step: 5,
                next() {
                    spfModal.deactivate();
                    $scope.dkim(domain);
                },
                close() {
                    spfModal.deactivate();
                    eventManager.call();
                }
            }
        });
    };

    /**
     * Open DKIM modal
     * @param {Object} domain
     */
    $scope.dkim = (domain) => {
        dkimModal.activate({
            params: {
                domain,
                step: 6,
                next() {
                    dkimModal.deactivate();
                    $scope.dmarc(domain);
                },
                close() {
                    dkimModal.deactivate();
                    eventManager.call();
                }
            }
        });
    };

    /**
     * Open DMARC modal
     * @param {Object} domain
     */
    $scope.dmarc = (domain) => {
        const index = $scope.domains.indexOf(domain);

        dmarcModal.activate({
            params: {
                domain,
                step: 7,
                verify() {
                    networkActivityTracker.track(Domain.get(domain.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            $scope.domains[index] = result.data.Domain;
                            dmarcModal.deactivate();
                            eventManager.call();
                        } else if (angular.isDefined(result.data) && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                close() {
                    dmarcModal.deactivate();
                    eventManager.call();
                }
            }
        });
    };

    /**
     * Close all verification modals
     */
    $scope.closeModals = () => {
        domainModal.deactivate();
        verificationModal.deactivate();
        dkimModal.deactivate();
        dmarcModal.deactivate();
        spfModal.deactivate();
        mxModal.deactivate();
        addressesModal.deactivate();
        addressModal.deactivate();
        memberModal.deactivate();
    };

    /**
     * Return member Object for a specific memberId
     * @param {String} memberId
     * @return {Object} member
     */
    $scope.member = (memberId) => {
        const member = _.findWhere($scope.members, { ID: memberId });

        if (angular.isDefined(member)) {
            return member;
        }
    };
});
