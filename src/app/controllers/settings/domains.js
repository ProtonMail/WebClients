angular.module("proton.controllers.Settings")

.controller('DomainsController', function(
    $rootScope,
    $scope,
    $translate,
    addresses,
    addressModal,
    buyDomainModal,
    confirmModal,
    dkimModal,
    dmarcModal,
    Domain,
    domains,
    domainModal,
    organization,
    members,
    networkActivityTracker,
    notify,
    spfModal,
    verificationModal
) {
    /**
     * Method called at the initialization of this controller
     */
    $scope.initialization = function() {
        if(angular.isDefined(organization.data) && organization.data.Code === 1000) {
            $scope.organization = organization.data.Organization;
        }

        if(angular.isDefined(domains.data) && domains.data.Code === 1000) {
            $scope.domains = domains.data.Domains;
        }

        if(angular.isDefined(members.data) && members.data.Code === 1000) {
            $scope.members = members.data.Members;
        }

        if(angular.isDefined(addresses.data) && addresses.data.Code === 1000) {
            $scope.addresses = addresses.data.Addresses;
        }
    };

    /**
     * Open modal process to add a custom domain.
     * Docs: https://github.com/ProtonMail/Slim-API/blob/develop_domain/api-spec/pm_api_domains.md
     */
    $scope.wizard = function(domain) {
        // go through all steps and show the user the step they need to complete next. allow for back and next options.
        // if domain has a name, we can skip the first step
        if (domain.DomainName) {
            // proceed
            if (domain.VerifyState !== 2) {
                // show verification step
                $scope.verification(domain);
            }
            else {
                // proceeed.
                if (domain.SpfState !== 3) {
                    $scope.spf(domain);
                }
                else {
                    // proceed.
                    alert('?');
                }
            }
        }
        else {
            // show first step
            $scope.addDomain();
        }
    };

    /**
     * Open modal process to add a custom domain
     */
    $scope.addDomain = function(domain) {
        domainModal.activate({
            params: {
                domain: domain,
                submit: function(name) {
                    networkActivityTracker.track(Domain.create({Name: name}).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            notify({message: $translate.instant('DOMAIN_CREATED'), classes: 'notification-success'});
                            $scope.domains.push(result.data.Domain);
                            domainModal.deactivate();
                            // open the next step
                            $scope.verification(result.data.Domain);
                        } else if(angular.isDefined(result.data) && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_CREATION'), classes: 'notification-danger'});
                        }
                    }, function(error) {
                        notify({message: $translate.instant('ERROR_DURING_CREATION'), classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    domainModal.deactivate();
                }
            }
        });
    };

    /**
 * Open modal process to buy a new domain
     */
    $scope.buyDomain = function() {
        buyDomainModal.activate({
            params: {
                submit: function(datas) {
                    console.log(datas);
                    buyDomainModal.deactivate();
                },
                cancel: function() {
                    buyDomainModal.deactivate();
                }
            }
        });
    };

    /**
     * Delete domain
     */
    $scope.deleteDomain = function(domain) {
        var index = $scope.domains.indexOf(domain);

        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_DOMAIN'),
                message: $translate.instant('Are you sure you want to delete this domain? This action will also delete addresses linked.'),
                confirm: function() {
                    networkActivityTracker.track(Domain.delete(domain.ID).then(function(result) {
                        if(result.data && result.data.Code === 1000) {
                            notify({message: $translate.instant('DOMAIN_DELETED'), classes: 'notification-success'});
                            $scope.domains.splice(index, 1); // Remove domain in interface
                            confirmModal.deactivate();
                        } else if(result.data && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_DELETION'), classes: 'notification-danger'});
                        }
                    }, function() {
                        notify({message: $translate.instant('ERROR_DURING_DELETION'), classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to add a new address
     */
    $scope.addAddress = function(domain) {
        addressModal.activate({
            params: {
                domain: domain,
                submit: function() {
                    addressModal.deactivate();
                },
                cancel: function() {
                    addressModal.deactivate();
                }
            }
        });
    };

    /**
     * Delete address
     */
    $scope.deleteAddress = function(address) {
        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_ADDRESS'),
                message: $translate.instant('Are you sure you want to delete this address?'),
                confirm: function() {
                    confirmModal.deactivate();
                    // TODO send delete address request
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open verification modal
     */
    $scope.verification = function(domain) {
        verificationModal.activate({
            params: {
                domain: domain,
                submit: function() {
                    networkActivityTracker.track(Domain.get(domain.ID).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            // check verification code
                            if (result.data.Domain.VerifyState === 1) {
                                notify({message: $translate.instant('DOMAIN_VERIFIED'), classes: 'notification-success'});
                                verificationModal.deactivate();
                            }
                            else if (result.data.Domain.VerifyState === 2) {
                                notify({message: $translate.instant('VERIFICATION_FAILED'), classes: 'notification-danger'});
                            }
                            else if (result.data.Domain.VerifyState === 0) {
                                notify({message: $translate.instant('TXT_RECORD_MISSING'), classes: 'notification-danger'});
                            }
                            // open the next step
                            $scope.verification(result.data.Domain);
                        } else if(angular.isDefined(result.data) && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('VERIFICATION_FAILED'), classes: 'notification-danger'});
                        }
                    }, function(error) {
                        notify({message: $translate.instant('VERIFICATION_FAILED'), classes: 'notification-danger'});
                    }));
                    // do stuff
                },
                close: function() {
                    verificationModal.deactivate();
                }
            }
        });
    };

    /**
     * Open SPF modal
     */
    $scope.spf = function(domain) {
        spfModal.activate({
            params: {
                domain: domain,
                close: function() {
                    spfModal.deactivate();
                }
            }
        });
    };

    /**
     * Open DKIM modal
     */
    $scope.dkim = function(domain) {
        dkimModal.activate({
            params: {
                domain: domain,
                close: function() {
                    dkimModal.deactivate();
                }
            }
        });
    };

    /**
     * Open DMARC modal
     */
    $scope.dmarc = function(domain) {
        dmarcModal.activate({
            params: {
                domain: domain,
                close: function() {
                    dmarcModal.deactivate();
                }
            }
        });
    };

    /**
     * Initialize user model value (select)
     */
    $scope.initMember = function(address) {
        _.each($scope.members, function(member) {
            var found = member.AddressIDs.indexOf(address.AddressID) !== -1;

            if(found === true) {
                address.select = member;
            }
        });
    };

    /**
     * Change user model value (select)
     */
    $scope.changeMember = function(address) {

    };

    // Call initialization
    $scope.initialization();
});
