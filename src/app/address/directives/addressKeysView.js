/* @ngInject */
function addressKeysView(
    $rootScope,
    downloadFile,
    authentication,
    gettextCatalog,
    tools,
    notification,
    oldPasswordModal,
    networkActivityTracker,
    reactivateKeys
) {
    const KEY_FILE_EXTENSION = '.asc';

    const reactivate = (key) => {
        oldPasswordModal.activate({
            params: {
                submit(password) {
                    oldPasswordModal.deactivate();
                    const promise = reactivateKeys([key], password)
                        .then(({ success, failed }) => {
                            success && notification.success(success);
                            failed && notification.error(failed);
                        });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    oldPasswordModal.deactivate();
                }
            }
        });
    };

    return {
        replace: true,
        restrict: 'E',
        scope: {
            displayMode: '@',
            isSubUser: '<',
            addresses: '<'
        },
        templateUrl: require('../../../templates/address/addressKeysView.tpl.html'),
        link(scope) {
            /**
             * Download key
             * @param {String} key
             * @param {String} email
             * @param {String} type - 'public' or 'private'
             */
            scope.download = (key, email, type) => {
                const blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
                const filename = type + 'key.' + email + KEY_FILE_EXTENSION;

                downloadFile(blob, filename);
            };
            /**
             * Reactivate key
             * @param {String} key
             */
            scope.reactivate = reactivate;
        }
    };
}

export default addressKeysView;
