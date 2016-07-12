angular.module("proton.errorReporter", [])
    .factory("errorReporter", function($log, $rootScope, $q, notify) {
        var api = {
            catcher: function(msg, promise) {
                var self = this;

                return function(error) {
                    self.notify(msg, error);
                    if (promise) {
                        promise.reject();
                    }
                };
            },
            resolve: function(msg, promise, defaultResult) {
                var q = $q.defer();
                var self = this;

                promise.then(
                    function(result) {
                        q.resolve(result);
                    },
                    function(error) {
                        self.notify(msg, error);
                        q.resolve(defaultResult);
                    }
                );

                return q.promise;
            },
            notify(message, error) {
                if (angular.isDefined(message)) {
                    notify(message);
                }
            },
            clear: function() {
                notify.closeAll();
            }
        };

        return api;
    })
.run(function($rootScope) {
    $rootScope.errorReporter = {};
});
