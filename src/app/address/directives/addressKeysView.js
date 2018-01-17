import _ from 'lodash';

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
    const I18N = {
        SUCCESS: gettextCatalog.getString('Key reactivated', null, 'Info')
    };
    const KEY_FILE_EXTENSION = '.asc';

    const reactivate = (key) => {
        oldPasswordModal.activate({
            params: {
                submit(password) {
                    oldPasswordModal.deactivate();
                    const promise = reactivateKeys([key], password).then(() => {
                        notification.success(I18N.SUCCESS);
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
        templateUrl: require('../../../templates/address/addressKeysView.tpl.html'),
        link(scope) {
            const unsubscribe = $rootScope.$on('updateUser', () => {
                populateKeys();
            });
            scope.isSubUser = authentication.user.subuser;
            scope.addresses = [];
            function populateKeys() {
                authentication.user.Addresses.forEach(({ Keys = [], ID = '', Email = '', Order }) => {
                    if (Keys.length) {
                        const { fingerprint, created, bitSize, PublicKey } = Keys[0];
                        const index = _.findIndex(scope.addresses, { addressID: ID });
                        const address = {
                            order: Order,
                            addressID: ID,
                            email: Email,
                            fingerprint,
                            created,
                            bitSize,
                            publicKey: PublicKey,
                            keys: Keys
                        };
                        if (index > -1) {
                            angular.extend(scope.addresses[index], address);
                        } else {
                            scope.addresses.push(address);
                        }
                    }
                });
            }
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
            scope.$on('$destroy', () => {
                unsubscribe();
            });
            populateKeys();
        }
    };
}
export default addressKeysView;
