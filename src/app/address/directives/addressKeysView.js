angular.module('proton.address')
    .directive('addressKeysView', ($rootScope, authentication, gettextCatalog, notify) => ({
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

                scope.keys = [];
                addresses.forEach((address) => {
                    if (address.Keys.length) {
                        const first = address.Keys[0];
                        scope.keys.push({
                            addressID: address.ID,
                            email: address.Email,
                            fingerprint: first.fingerprint,
                            created: first.created,
                            bitSize: first.bitSize,
                            publicKey: first.PublicKey
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
            scope.$on('$destroy', () => {
                unsubscribe();
            });
            populateKeys();
        }
    }));
