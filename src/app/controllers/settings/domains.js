angular.module("proton.controllers.Settings")

.controller('DomainsController', function($rootScope, $scope, domainModal) {
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

    $scope.deleteDomain = function(domain) {

    };

    /**
     * Delete address
     */
    $scope.deleteAddress = function(address) {

    };

    $scope.verification = function(domain) {

    };

    $scope.spf = function(domain) {

    };

    $scope.dkim = function(domain) {

    };

    $scope.dmarc = function(domain) {

    };
});
