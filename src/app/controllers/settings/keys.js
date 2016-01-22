angular.module("proton.controllers.Settings")

.controller('KeysController', function($log, $scope, $translate, authentication, pmcw, generateModal, confirmModal, Key, notify) {
    $scope.isSafari = jQuery.browser.name === 'safari';
    $scope.addresses = authentication.user.Addresses;
    console.log($scope.addresses);

    /**
     * Download key
     * @param {String} key
     * @param {String} type - 'public' or 'private'
     */
    $scope.download = function(key, type) {
        var blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
        var filename = type + 'key.txt';

        try {
            saveAs(blob, filename);
        } catch (error) {
            $log.error(error);
        } finally {
            $log.debug('saveAs');
        }
    };

    /**
     * Delete key
     */
    $scope.delete = function(address, key) {
        var title = $translate.instant('DELETE_KEY');
        var message = $translate.instant('CONFIRM_DELETE_KEY');
        var index = address.Keys.indexOf(key);

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    Key.delete(key.ID).then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            address.Keys.splice(index, 1);
                            notify({message: $translate.instant('KEY_DELETED'), classes: 'notification-success'});
                            confirmModal.deactivate();
                        } else {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                            confirmModal.deactivate();
                        }
                    }, function(error) {
                        notify({message: error, classes: 'notification-danger'});
                        confirmModal.deactivate();
                    });
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Move up
     */
    $scope.up = function(address, key) {
        var order = [];
        var from = address.Keys.indexOf(key);
        var to = from - 1;

        _.each(address.Keys, function(element, i) { order.push(i + 1); });

        order.splice(to, 0, order.splice(from, 1)[0]);

        Key.order({
            AddressID: address.ID,
            Order: order
        }).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                address.Keys.splice(to, 0, address.Keys.splice(from, 1)[0]);
            } else {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: error, classes: 'notification-danger'});
        });
    };

    /**
     * Move down
     */
    $scope.down = function(address, key) {
        var order = [];
        var from = address.Keys.indexOf(key);
        var to = from + 1;

        _.each(address.Keys, function(element, i) { order.push(i + 1); });

        order.splice(to, 0, order.splice(from, 1)[0]);

        Key.order({
            AddressID: address.ID,
            Order: order
        }).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                address.Keys.splice(to, 0, address.Keys.splice(from, 1)[0]);
            } else {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: error, classes: 'notification-danger'});
        });
    };

    /**
     * Generate an other key pair
     * @param {Object} address
     */
    $scope.generate = function(address) {
        var title = $translate.instant('GENERATE_KEY');
        var message = $translate.instant('CONFIRM_GENERATE_KEY');
        var mailboxPassword = authentication.getPassword();

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    pmcw.generateKeysRSA(address.Email, mailboxPassword).then(function(result) {
                        var publicKeyArmored = result.publicKeyArmored;
                        var privateKeyArmored = result.privateKeyArmored;

                        Key.create({
                            AddressID: address.ID,
                            PrivateKey: privateKeyArmored
                        }).then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                var key = result.data.Key;

                                // Add the new key who become the first key
                                address.Keys.unshift(key);

                                // Decrypt private key with the mailbox password
                                pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword).then(function(package) {  // Decrypt private key with the mailbox password
                                    // Store the package decrypted
                                    authentication.storeKey(address.ID, package);
                                    // Close the confirm modal
                                    confirmModal.deactivate();
                                }, function(error) {
                                    notify({message: error, classes: 'notification-danger'});
                                    confirmModal.deactivate();
                                });
                            } else {
                                notify({message: result.data.Error, classes: 'notification-danger'});
                                confirmModal.deactivate();
                            }
                        }, function(error) {
                            notify({message: error, classes: 'notification-danger'});
                            confirmModal.deactivate();
                        });
                    }, function(error) {
                        notify({message: error, classes: 'notification-danger'});
                        confirmModal.deactivate();
                    });
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };
});
