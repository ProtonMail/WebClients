angular.module('proton.authentication')
.factory('handle9001', ($q, $http, humanVerificationModal) => {
    return (config) => {
        const deferred = $q.defer();

        humanVerificationModal.activate({
            params: {
                close(resend = false) {
                    humanVerificationModal.deactivate();

                    if (resend) {
                        deferred.resolve($http(config));
                    } else {
                        deferred.resolve();
                    }
                }
            }
        });

        return deferred.promise;
    };
});
