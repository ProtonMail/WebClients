angular.module("proton.controllers.Settings")

.controller('DomainsController', function($rootScope, $scope, domainModal, addressModal, spfModal, dkimModal, dmarcModal) {
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
