import _ from 'lodash';

/* @ngInject */
function DomainsController(
    $controller,
    $q,
    $rootScope,
    $scope,
    $state,
    gettextCatalog,
    Address,
    addressModal,
    addressesModal,
    authentication,
    confirmModal,
    CONSTANTS,
    dkimModal,
    dmarcModal,
    domainApi,
    domainModel,
    organizationModel,
    domainModal,
    eventManager,
    generateOrganizationModal,
    memberModal,
    mxModal,
    networkActivityTracker,
    notification,
    pmcw,
    spfModal,
    verificationModal,
    dispatchers
) {
    $controller('SignaturesController', { $scope, authentication, pmcw });

    const { on, unsubscribe } = dispatchers([], true);

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

    $scope.$on('$destroy', () => {
        unsubscribe();
    });

    on('addressModel', (e, { type, data }) => {
        if (type === 'address.new') {
            const address = _.extend({}, data.address, {
                MemberID: data.member.ID
            });
            const domain = _.extend({}, data.domain, {
                Addresses: data.domain.Addresses.concat([address])
            });
            $scope.addAddresses(domain);
        }
    });

    on('memberActions', (e, { type, data }) => {
        if (type === 'edit.success') {
            const domain = _.extend({}, data.domains[0]);
            domain.Addresses.push(...data.member.Addresses);
            $scope.members.push(data.member);
            $scope.addAddresses(domain);
        }
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
        } else if (domain.VerifyState !== 2) {
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
                    const promise = domainApi
                        .delete(domain.ID)
                        .then(eventManager.call)
                        .then(() => {
                            notification.success(gettextCatalog.getString('Domain deleted', null));
                            $scope.domains.splice(index, 1); // Remove domain in interface
                            confirmModal.deactivate();
                        });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    const catchallSupport = (type) => type === CONSTANTS.CUSTOM_DOMAIN_ADDRESS && $scope.organization.Features & 1;

    $scope.changeCatchall = (address, { Addresses = [] }) => {
        const { catchall, DomainID, ID, Type } = address;

        if (!catchallSupport(Type)) {
            notification.info(gettextCatalog.getString('This feature is only available for ProtonMail Professional plans or higher'));
            address.catchall = !catchall;
            return;
        }

        if (catchall) {
            _.each(Addresses, (address) => (address.catchall = address.ID === ID));
        }

        const promise = domainModel.catchall(DomainID, catchall ? ID : null).then(() => {
            notification.success(gettextCatalog.getString('Catch-all address updated', null));
        });

        networkActivityTracker.track(promise);
    };

    /**
     * Check if this address is owned by the current user
     * @param {Object} address
     * @return {Boolean}
     */
    $scope.owned = (address) => {
        const found = _.find(authentication.user.Addresses, { ID: address.ID });

        return angular.isDefined(found);
    };

    /**
     * Check if this address is owned by a private member
     * @param {Object} address
     * @return {Boolean}
     */
    $scope.privated = (address) => {
        const member = _.find($scope.members, { ID: address.MemberID });

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
                    const promise = domainApi
                        .create({ Name: name })
                        .then(eventManager.call)
                        .then(({ data = {} } = {}) => {
                            notification.success(gettextCatalog.getString('Domain created', null));
                            $scope.domains.push(data.Domain);
                            domainModal.deactivate();
                            // open the next step
                            $scope.verification(data.Domain);
                        });

                    networkActivityTracker.track(promise);
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
        networkActivityTracker.track(
            domainModel.fetch().then((domains) => {
                $scope.domains = domains;
            })
        );
    };

    const verifyDomain = async ({ ID }) => {
        try {
            const { data = {} } = await domainApi.get(ID);
            const { VerifyState } = data.Domain || {};

            if (VerifyState === 0) {
                throw new Error(gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'));
            }

            if (VerifyState === 1) {
                notification.error(
                    gettextCatalog.getString(
                        'Wrong verification code. Please make sure you copied the verification code correctly and try again. It can take up to 24 hours for changes to take effect.',
                        null,
                        'Error'
                    ),
                    { duration: 30000 }
                );
                return { test: false, data };
            }

            if (VerifyState === 2) {
                notification.success(gettextCatalog.getString('Domain verified', null));
                return { test: true, data };
            }
        } catch (e) {
            if (e.message) {
                throw e;
            }
            throw new Error(gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error'));
        }
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
                    const promise = verifyDomain(domain).then(({ test, data }) => {
                        if (test) {
                            $scope.domains[index] = data.Domain;
                            verificationModal.deactivate();
                            // open the next step
                            $scope.addAddresses(data.Domain);
                        }
                    });

                    networkActivityTracker.track(promise);
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
        if ($scope.organization.HasKeys === 1 && $scope.keyStatus > 0 && CONSTANTS.KEY_PHASE > 3) {
            notification.error(gettextCatalog.getString('Administrator privileges must be activated', null, 'Error'));
            $state.go('secured.members');
            return;
        }

        addressesModal.activate({
            params: {
                step: 3,
                domain,
                members: $scope.members,
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
                    const promise = domainApi
                        .get(domain.ID)
                        .then(eventManager.call)
                        .then(({ data = {} } = {}) => {
                            $scope.domains[index] = data.Domain;
                            dmarcModal.deactivate();
                        })
                        .catch(({ data = {} } = {}) => {
                            throw new Error(
                                data.Error || gettextCatalog.getString('Verification did not succeed, please try again in an hour.', null, 'Error')
                            );
                        });

                    networkActivityTracker.track(promise);
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
        const member = _.find($scope.members, { ID: memberId });

        if (angular.isDefined(member)) {
            return member;
        }
    };
}
export default DomainsController;
