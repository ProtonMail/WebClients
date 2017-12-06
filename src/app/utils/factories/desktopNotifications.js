/* @ngInject */
function desktopNotifications() {
    const notification = {
        status() {
            return Push.Permission.get();
        },
        request(onGranted = angular.noop, onDenied = angular.noop) {
            Push.Permission.request(onGranted, onDenied);
        },
        create(title, params) {
            Push.create(title, params);
        }
    };

    return notification;
}
export default desktopNotifications;
