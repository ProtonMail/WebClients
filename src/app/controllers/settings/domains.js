angular.module("proton.controllers.Settings")

.controller('DomainsController', function(
    $rootScope,
    $scope,
    $translate,
    domainModal,
    addressModal,
    spfModal,
    dkimModal,
    dmarcModal,
    confirmModal,
    verificationModal
) {
    $scope.domains = [
        {
            DomainID: 1, // int unsigned - PK
            DomainName: 'panda.com', // varchar(253) - e.g. protonmail.ch, protonmail.com, ...
            GroupID: 1, // int unsigned - the Group.GroupID owning this domain
            State: true,
            CheckTime: 123123123123, // - last time DNS was checked (need to recheck if more than 1 day old)
            MX: {}, // json
            MXStatus: true, // tinyint unsigned - encodes if PM is set with highest pref
            SPF: {}, // json
            SPFStatus: true, // tinyint unsigned - encodes if PM is included
            DKIM: {}, // json
            DKIMStatus: true, // tinyint unsigned - encodes if the protonmail selector public key is correct
            DMARC: {}, // json
            DMARCStatus: true // tinyint unsigned - encodes if not set, set but do nothing, quarantine, or reject
        },
        {
            DomainID: 2, // int unsigned - PK
            DomainName: 'tigre.com', // varchar(253) - e.g. protonmail.ch, protonmail.com, ...
            GroupID: 1, // int unsigned - the Group.GroupID owning this domain
            State: false,
            CheckTime: 123123123123, // - last time DNS was checked (need to recheck if more than 1 day old)
            MX: {}, // json
            MXStatus: false, // tinyint unsigned - encodes if PM is set with highest pref
            SPF: {}, // json
            SPFStatus: false, // tinyint unsigned - encodes if PM is included
            DKIM: {}, // json
            DKIMStatus: false, // tinyint unsigned - encodes if the protonmail selector public key is correct
            DMARC: {}, // json
            DMARCStatus: false // tinyint unsigned - encodes if not set, set but do nothing, quarantine, or reject
        }
    ];
    $scope.addresses = [
        {
            DomainID: 1, // int unsigned - to enable efficient counting of addresses associated with a given domain
            CleanEmail: 'red'
        },
        {
            DomainID: 2, // int unsigned - to enable efficient counting of addresses associated with a given domain
            CleanEmail: 'blue'
        },
        {
            DomainID: 1, // int unsigned - to enable efficient counting of addresses associated with a given domain
            CleanEmail: 'yellow'
        },
        {
            DomainID: 2, // int unsigned - to enable efficient counting of addresses associated with a given domain
            CleanEmail: 'green'
        }
    ];
    $scope.users = [
        {
            Email: 'qweqwe@qweqwe.fr',
            MemberID: 1, // bigint unsigned - PK
            GroupID: 1, // int unsigned - the group of which a user is a member
            UserID: 1, // int unsigned - the said user
            Role: 1, // tinyint unsigned - encodes user's role in the group, an owner (master account, Role=0) or a member (sub-account, Role=1)
            MaxSpace: 12 // smallint unsigned - maximum storage in MB
        },
        {
            Email: 'qweqwe@qweqwe.fr',
            MemberID: 2, // bigint unsigned - PK
            GroupID: 2, // int unsigned - the group of which a user is a member
            UserID: 2, // int unsigned - the said user
            Role: 2, // tinyint unsigned - encodes user's role in the group, an owner (master account, Role=0) or a member (sub-account, Role=2)
            MaxSpace: 12 // smallint unsigned - maximum storage in MB
        }
    ];
    /**
     * Open modal process to add a domain
     */
    $scope.addDomain = function() {
        domainModal.activate({
            params: {
                submit: function(datas) {

                    domainModal.deactivate();
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

    };

    /**
     * Delete domain
     */
    $scope.deleteDomain = function(domain) {
        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_DOMAIN'),
                message: $translate.instant('Are you sure you want to delete this domain? This action will also delete addresses linked.'),
                confirm: function() {
                    confirmModal.deactivate();
                    // TODO send delete domain request
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
    $scope.initUser = function(address) {
        address.select = $scope.users[0];
    };

    /**
     * Change user model value (select)
     */
    $scope.changeUser = function(address) {

    };
});
