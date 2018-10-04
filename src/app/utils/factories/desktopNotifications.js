/* @ngInject */
function desktopNotifications() {
    const status = () => Push.Permission.get();
    const isEnabled = () => status() === Push.Permission.GRANTED;

    const request = (onGranted = angular.noop, onDenied = angular.noop) => {
        try {
            Push.Permission.request(onGranted, onDenied);
        } catch (err) {
            /**
             * Hotfix to fix requesting the permission on non-promisified requests.
             * TypeError: undefined is not an object (evaluating 'this._win.Notification.requestPermission().then')
             * https://github.com/Nickersoft/push.js/issues/117
             */
        }
    };

    const create = (title, params) => {
        isEnabled() && Push.create(title, params);
    };

    return { create, status, isEnabled, request };
}
export default desktopNotifications;
