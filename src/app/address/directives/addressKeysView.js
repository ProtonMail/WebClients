angular.module('proton.address')
    .directive('addressKeysView', ($rootScope, authentication, gettextCatalog, notify, Key, keyPasswordModal, pmcw, networkActivityTracker, eventManager) => ({
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/address/addressKeysView.tpl.html',
        link(scope) {
            const isSafari = jQuery.browser.name === 'safari'; // Download doesn't work with Safari browser
            const unsubscribe = $rootScope.$on('updateUser', () => {
                populateKeys();
            });
            function populateKeys() {
                const addresses = _.sortBy(authentication.user.Addresses, 'Send');

                scope.addresses = [];
                addresses.forEach((address) => {
                    if (address.Keys.length) {
                        const first = address.Keys[0];
                        scope.addresses.push({
                            addressID: address.ID,
                            email: address.Email,
                            fingerprint: first.fingerprint,
                            created: first.created,
                            bitSize: first.bitSize,
                            publicKey: first.PublicKey,
                            keys: address.Keys
                        });
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
                if (isSafari) {
                    const message = gettextCatalog.getString("Safari doesn't support downloading of keys.", null);
                    const classes = 'notification-danger';
                    notify({ message, classes });
                } else {
                    const blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
                    const filename = type + 'key.' + email + '.txt';
                    try {
                        window.saveAs(blob, filename);
                    } catch (error) {
                        console.error(error);
                    }
                }
            };
            /**
             * Reactivate key
             * @param {String} key
             */
            scope.reactivate = (key) => {
                Key.salts()
                .then(({ data = {} }) => {
                    const keySalt = _.findWhere(data.KeySalts, { ID: key.ID }) || {};
                    const salt = keySalt.KeySalt;
                    const privateKey = key.PrivateKey;
                    const params = {
                        salt,
                        privateKey,
                        submit(decryptedKey) {
                            keyPasswordModal.deactivate();
                            const promise = pmcw.encryptPrivateKey(decryptedKey, authentication.getPassword())
                            .then((PrivateKey) => Key.reactivate(key.ID, { PrivateKey }))
                            .then(({ data }) => {
                                if (data.Code === 1000) {
                                    key.decrypted = true;
                                    notify({ message: gettextCatalog.getString('Key reactivated', null), classes: 'notification-success' });
                                    eventManager.call();
                                } else if (data.Error) {
                                    return Promise.reject(data.Error);
                                } else {
                                    return Promise.reject(gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'));
                                }
                            }, () => {
                                return Promise.reject(gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'));
                            });
                            networkActivityTracker.track(promise);
                        },
                        cancel() {
                            keyPasswordModal.deactivate();
                        }
                    };

                    keyPasswordModal.activate({ params });
                }, () => {
                    // Nothing
                });
            };
            scope.$on('$destroy', () => {
                unsubscribe();
            });
            populateKeys();
        }
    }));
