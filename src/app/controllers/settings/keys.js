angular.module("proton.controllers.Settings")

.controller('KeysController', function($log, $scope, authentication, pmcw, generateModal) {
    $scope.isSafari = jQuery.browser.name === 'safari';
    $scope.addresses = authentication.user.Addresses;
    console.log($scope.addresses);

    /**
     * Download key
     * @param {String} key
     * @param {String} type - 'public' or 'private'
     */
    $scope.download = function(key, type) {
        var blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
        var filename = type + 'key.txt';

        try {
            saveAs(blob, filename);
        } catch (error) {
            $log.error(error);
        } finally {
            $log.debug('saveAs');
        }
    };

    /**
     * Generate an other key pair
     * @param {Object} address
     */
    $scope.generate = function(address) {
        generateModal.activate({
            params: {
                submit: function(password) {
                    generateModal.deactivate();
                },
                cancel: function() {
                    generateModal.deactivate();
                }
            }
        });
    };
});
