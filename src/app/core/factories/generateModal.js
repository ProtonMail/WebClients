angular.module('proton.core')
    .factory('generateModal', (pmModal, authentication, networkActivityTracker, Key, pmcw, notification, $q) => {
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/generate.tpl.html',
            /* @ngInject */
            controller: function (params, $scope) {
            // Variables
                const self = this;
                const promises = [];
                const QUEUED = 0;
                const GENERATING = 1;
                const DONE = 2;
                const SAVED = 3;
                const ERROR = 4;

                // Parameters
                self.size = 2048; // To match the [radio] value
                self.process = false;
                self.title = params.title;
                self.addresses = params.addresses;
                self.message = params.message;
                // Kill this for now
                self.askPassword = false; // = params.password.length === 0;
                self.password = params.password;
                _.each(self.addresses, (address) => (address.state = QUEUED));

                // Listeners
                $scope.$on('updateUser', () => {
                    const dirtyAddresses = [];

                    _.each(authentication.user.Addresses, (address) => {
                        if (address.Keys.length === 0 && address.Status === 1 && authentication.user.Private === 1) {
                            dirtyAddresses.push(address);
                        }
                    });

                    if (dirtyAddresses.length === 0) {
                        params.close(false);
                    }
                });

                // Functions
                self.submit = () => {
                    const numBits = self.size;

                    self.process = true;
                    _.each(self.addresses, (address) => {
                        address.state = GENERATING;
                        promises.push(pmcw.generateKey({
                            userIds: [{ name: address.Email, email: address.Email }],
                            passphrase: self.password,
                            numBits
                        })
                            .then((result) => {
                                const privateKeyArmored = result.privateKeyArmored;

                                address.state = DONE;

                                return Key.create({
                                    AddressID: address.ID,
                                    PrivateKey: privateKeyArmored
                                }).then((result) => {
                                    if (result.data && result.data.Code === 1000) {
                                        address.state = SAVED;
                                        address.Keys = address.Keys || [];
                                        address.Keys.push(result.data.Key);
                                        notification.error('Key created');
                                        return $q.resolve();
                                    } else if (result.data && result.data.Error) {
                                        address.state = ERROR;
                                        notification.error(result.data.Error);

                                        return $q.reject();
                                    }
                                    address.state = ERROR;
                                    notification.error('Error during create key request');

                                    return $q.reject();
                                }, () => {
                                    address.state = ERROR;
                                    notification.error('Error during the create key request');

                                    return $q.reject();
                                });
                            }, (error) => {
                                address.state = ERROR;
                                notification.error(error);

                                return $q.reject();
                            }));
                    });

                    $q.all(promises)
                        .finally(() => {
                            params.close(true, self.addresses, self.password);
                        });
                };

                self.cancel = () => {
                    params.close(false);
                };
            }
        });
    });
