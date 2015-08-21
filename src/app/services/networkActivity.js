angular.module("proton.networkActivity", ["proton.errorReporter"])
.factory("networkActivityTracker", function ($log, errorReporter, notify) {
    var promises = [];
    var notifyError = function(result) {

        if(result && (angular.isDefined(result.Error) || angular.isDefined(result.data.Error))) {
            var message = result.Error || result.data.Error;

            notify({
                message: message,
                classes: 'notification-danger'
            });
            $log.error(result);
        }
    };
    var api = {
        loading: function () {
            return !_.isEmpty(promises);
        },
        track: function (promise) {
            errorReporter.clear();
            promises = _.union(promises, [promise]);
            promise.then(function(result) {

            });
            promise.catch(function(result) {

            });
            promise.finally(function () {
                promises = _.without(promises, promise);
            });

            return promise;
        }
    };

    return api;
});
