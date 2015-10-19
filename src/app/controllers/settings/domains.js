angular.module("proton.controllers.Settings")

.controller('DomainsController', function($rootScope, $scope, $translate, domainModal, addressModal, spfModal, dkimModal, dmarcModal, confirmModal) {
    $scope.domains = [
        {id: 1, domain: 'example1.com', status: true, verification: true, spf: true, dkim: true, dmarc: true},
        {id: 2, domain: 'example2.com', status: false, verification: false, spf: false, dkim: false, dmarc: false}
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
    $scope.addAddress = function() {
        addressModal.activate({
            params: {

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
});
