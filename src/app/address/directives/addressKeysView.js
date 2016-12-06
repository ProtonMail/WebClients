angular.module('proton.address')
    .directive('addressKeysView', ($rootScope, authentication, gettextCatalog, notify, Key, keyPasswordModal, pmcw, networkActivityTracker) => ({
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
                .then(({ data }) => {

                    const params = {
                        salt: _.findWhere(data.KeySalts, { ID: key.ID }).KeySalt,
                        privateKey: key.PrivateKey,
                        submit(decryptedKey) {
                            keyPasswordModal.deactivate();

                            networkActivityTracker.track(pmcw.encryptPrivateKey(decryptedKey, authentication.getPassword())
                            .then((PrivateKey) => Key.reactivate(key.ID, { PrivateKey }))
                            .then(({ data }) => {
                                if (data && data.Code === 1000) {
                                    key.decrypted = true;
                                    notify({ message: gettextCatalog.getString('Preference saved', null), classes: 'notification-success' });
                                } else if (data && data.Error) {
                                    notify({ message: data.Error, classes: 'notification-danger' });
                                } else {
                                    notify({ message: gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'), classes: 'notification-danger' });
                                }
                            }, () => {
                                notify({ message: gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'), classes: 'notification-danger' });
                            }));
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
