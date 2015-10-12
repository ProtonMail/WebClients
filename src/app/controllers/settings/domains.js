angular.module("proton.controllers.Settings")

.controller('DomainsController', function($rootScope, $scope, domainModal) {
    $scope.openDomainModal = function() {
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
});
