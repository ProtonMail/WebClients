angular.module("proton.controllers.Settings")

.controller('KeysController', function(
    $log,
    $scope,
    gettextCatalog,
    authentication,
    confirmModal,
    User,
    eventManager,
    reactivateModal,
    Key,
    networkActivityTracker,
    notify,
    generateModal,
    pmcw
) {
    // Detect if the current browser is Safari to disable / hide download action
    $scope.isSafari = jQuery.browser.name === 'safari';
    $scope.isPrivate = authentication.user.Private === 1;
    $scope.isNonPrivate = authentication.user.Private === 0;
    // Original PM addresses
    $scope.PMAddresses = _.where(authentication.user.Addresses, {Type: 1});
    // PM aliases
    $scope.PMAliases = _.where(authentication.user.Addresses, {Type: 2});
    // Custom addresses
    $scope.customAddresses = _.where(authentication.user.Addresses, {Type: 3});

    $scope.$on('updateUser', function(event) {
        $scope.PMAddresses = _.where(authentication.user.Addresses, {Type: 1});
        $scope.PMAliases = _.where(authentication.user.Addresses, {Type: 2});
        $scope.customAddresses = _.where(authentication.user.Addresses, {Type: 3});
    });

    /**
     * Download key
     * @param {String} key
     * @param {String} email
     * @param {String} type - 'public' or 'private'
     */
    $scope.download = function(key, email, type) {
        var blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
        var filename = type + 'key.' + email + '.txt';

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
        var title = gettextCatalog.getString('Delete key');
        var message = gettextCatalog.getString('Confirm delete key');
        var index = address.Keys.indexOf(key);


        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(Key.delete(key.ID).then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            // Delete key in the UI
                            address.Keys.splice(index, 1);
                            // Call event log manager to be sure
                            notify({message: gettextCatalog.getString('Key deleted'), classes: 'notification-success'});
                            // Close the modal
                            confirmModal.deactivate();
                            // Call the event log manager
                            eventManager.call();
                        } else if (result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        }
                    }, function(error) {
                        notify({message: 'ERROR_WHILE_SAVING', classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Mark key as primary (move this one to the top of the list)
     */
    $scope.primary = function(address, key) {
        var order = [];
        var from = address.Keys.indexOf(key);
        var to = 0;

        _.each(address.Keys, function(element, i) { order.push(i + 1); });
        order.splice(to, 0, order.splice(from, 1)[0]);

        networkActivityTracker.track(Key.order({
            AddressID: address.ID,
            Order: order
        }).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                // Call event log manager to be sure
                eventManager.call();
            } else {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: 'ERROR_WHILE_SAVING', classes: 'notification-danger'});
        }));
    };

    /**
     * Open modal to reactivate key pair
     * @param {Object} address
     * @param {Object} key
     */
    $scope.enable = function(address, key) {
        var mailboxPassword = authentication.getPassword();

        reactivateModal.activate({
            params: {
                submit: function(loginPassword, keyPassword) {
                    // Try to decrypt private key with the key password specified
                    pmcw.decryptPrivateKey(key.PrivateKey, keyPassword).then(function(package) {
                        // Encrypt private key with the current mailbox password
                        pmcw.encryptPrivateKey(package, mailboxPassword).then(function(privateKey) {
                            // Update private key
                            networkActivityTracker.track(Key.private({
                                Password: loginPassword,
                                Keys: [{
                                    ID: key.ID,
                                    PrivateKey: privateKey
                                }]
                            }).then(function(result) {
                                if (result.data && result.data.Code === 1000) {
                                    // Close the modal
                                    reactivateModal.deactivate();
                                    // Call event log manager
                                    eventManager.call();
                                } else if (result.data && result.data.Error) {
                                    notify({message: result.data.Error, classes: 'notification-danger'});
                                } else {
                                    notify({message: gettextCatalog.getString('Unable to save your changes, please try again.'), classes: 'notification-danger'});
                                }
                            }, function(error) {
                                notify({message: gettextCatalog.getString('Unable to save your changes, please try again.'), classes: 'notification-danger'});
                            }));
                        }, function(error) {
                            notify({message: gettextCatalog.getString('Error while encrypting'), classes: 'notification-danger'});
                        });
                    }, function(error) {
                        notify({message: gettextCatalog.getString('Invalid key password'), classes: 'notification-danger'});
                    });
                },
                cancel: function() {
                    reactivateModal.deactivate();
                }
            }
        });
    };

    /**
     * Generate an other key pair
     * @param {Object} address
     */
    $scope.generate = function(address) {
        generateModal.activate({
            params: {
                title: gettextCatalog.getString('Generate key pair'),
                message: '', // TODO need text
                addresses: [address],
                cancel: function() {
                    eventManager.call();
                    generateModal.deactivate();
                }
            }
        });
    };
});
