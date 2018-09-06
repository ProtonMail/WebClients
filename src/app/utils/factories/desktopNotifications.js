/* @ngInject */
function desktopNotifications() {
    const status = () => Push.Permission.get();
    const isEnabled = () => status() === Push.Permission.GRANTED;

    const request = (onGranted = angular.noop, onDenied = angular.noop) => {
        Push.Permission.request(onGranted, onDenied);
    };

    const create = (title, params) => {
        isEnabled() && Push.create(title, params);
    };

    return { create, status, isEnabled, request };
}
export default desktopNotifications;
