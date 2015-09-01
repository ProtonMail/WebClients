angular.module("proton.networkActivity", ["proton.errorReporter"])
.factory("networkActivityTracker", function ($log, errorReporter, notify) {
    var promises = [];
    var api = {
        loading: function () {
            return !_.isEmpty(promises);
        },
        track: function (promise) {
            errorReporter.clear();
            promises = _.union(promises, [promise]);
            promise.then(function(result) {

            });
            promise.catch(function(error) {
                if(angular.isString(error)) {
                    notify({message: error, classes: 'notification-danger', duration: 10000}); 
                }
            });
            promise.finally(function () {
                promises = _.without(promises, promise);
            });

            return promise;
        }
    };

    return api;
});
