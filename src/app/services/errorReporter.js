angular.module("proton.errorReporter", [])
.factory("errorReporter", ($log, $rootScope, $q, notify) => {
    ​
    const newNotification = (msg, error) => msg && notify(msg);
    const clear = notify.closeAll;
    ​
    const catcher = (msg, promise) => () => {
        newNotification(msg, error);
        promise && promise.reject();
    };
    ​
    const resolve = (msg, promise, defaultResult) => {
        const q = $q.defer();
        promise
        .then(
            q.resolve,
            (error) => {
                newNotification(msg, error);
                q.resolve(defaultResult);
            }
        );
        return q.promise;
    };
    ​
    return { clear, catcher, resolve, notify: newNotification };
    ​
})
.run(function($rootScope) {
    $rootScope.errorReporter = {};
});
