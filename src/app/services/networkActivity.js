angular.module("proton.networkActivity", ["proton.errorReporter"])
.factory("networkActivityTracker", function ($log, errorReporter, notify) {
    var promises = [];
    var duration = 10000; // 10 seconds
    var api = {
        /**
         * Check if we have some promises currently running
         * User to display the loading state
         */
        loading: function () {
            // $log.error(promises);
            return !_.isEmpty(promises);
        },
        /**
         * Track promise to catch event around
         * @param {object} promise - Promise tracker
         * @return {object} promise - Return the orginal promise to stay in the same context
         */
        track: function (promise) {
            errorReporter.clear();
            promises = _.union(promises, [promise]);

            promise.catch(function(error) {
                if(angular.isString(error)) { // Just a String
                    notify({message: error, classes: 'notification-danger', duration: duration});
                }

                if(angular.isObject(error)) { // Error Object
                    var message;

                    if(angular.isDefined(error.message)) {
                        message = error.message;
                    } else if(angular.isDefined(error.Error)) {
                        message = error.Error;
                    } else {
                        message = 'An error has occurred. Please try again.';
                    }

                    notify({message: message, classes: 'notification-danger', duration: duration});
                }
            });

            promise.finally(function () {
                promises = _.without(promises, promise);
            });

            return promise;
        },
        clear: function() {
            errorReporter.clear();
            promises = [];
            return promises;
        }
    };

    return api;
});
