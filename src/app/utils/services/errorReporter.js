angular.module('proton.utils')
    .factory('errorReporter', (notify) => {

        const newNotification = (msg) => msg && notify(msg);
        const clear = notify.closeAll;
        const catcher = (msg, promise) => (error) => {
            newNotification(msg, error);
            promise && promise.reject();
        };
        const resolver = (msg, currentPromise, defaultResult) => {
            return new Promise((resolve) => {
                currentPromise
                    .then(resolve, (error) => {
                        newNotification(msg, error);
                        resolve(defaultResult);
                    });
            });
        };

        return {
            clear, catcher,
            resolve: resolver,
            notify: newNotification
        };
    })
    .run(($rootScope) => {
        $rootScope.errorReporter = {};
    });
