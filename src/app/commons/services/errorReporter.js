/* @ngInject */
function errorReporter(notification) {
    const newNotification = (msg) => msg && notification.error(msg);
    const catcher = (msg, promise) => (error) => {
        newNotification(msg, error);
        promise && promise.reject();
    };
    const resolver = (msg, currentPromise, defaultResult) => {
        return new Promise((resolve) => {
            currentPromise.then(resolve, (error) => {
                newNotification(msg, error);
                resolve(defaultResult);
            });
        });
    };

    return {
        clear: notification.closeAll,
        catcher,
        resolve: resolver,
        notify: newNotification
    };
}
export default errorReporter;
