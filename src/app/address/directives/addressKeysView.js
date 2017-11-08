angular.module('proton.address')
    .directive('addressKeysView', ($rootScope, downloadFile, authentication, gettextCatalog, tools, notification, Key, keyPasswordModal, pmcw, networkActivityTracker, eventManager) => {

        const I18N = {
            ERROR: gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'),
            SUCCESS: gettextCatalog.getString('Key reactivated', null, 'Info')
        };
        const KEY_FILE_EXTENSION = '.asc';

        const reactivateProcess = async (decryptedKey, key) => {
            try {
                const PrivateKey = await pmcw.encryptPrivateKey(decryptedKey, authentication.getPassword());
                const { data = {} } = await Key.reactivate(key.ID, { PrivateKey });

                if (data.Code !== 1000) {
                    throw new Error(data.Error || I18N.ERROR);
                }

                key.decrypted = true;
                notification.success(I18N.SUCCESS);
                return eventManager.call();
            } catch (e) {
                throw new Error(I18N.ERROR);
            }
        };

        const reactivate = async (key) => {
            try {
                const { data = {} } = await Key.salts();
                const { KeySalt: salt } = _.findWhere(data.KeySalts, { ID: key.ID }) || {};

                keyPasswordModal.activate({
                    params: {
                        salt,
                        privateKey: key.PrivateKey,
                        submit(decryptedKey) {
                            keyPasswordModal.deactivate();
                            networkActivityTracker.track(reactivateProcess(decryptedKey, key));
                        },
                        cancel() {
                            keyPasswordModal.deactivate();
                        }
                    }
                });
            } catch (e) {
                // Nothing
            }
        };

        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'templates/address/addressKeysView.tpl.html',
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
                            const address = { order: Order, addressID: ID, email: Email, fingerprint, created, bitSize, publicKey: PublicKey, keys: Keys };
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
    });
