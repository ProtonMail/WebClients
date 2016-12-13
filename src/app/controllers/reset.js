angular.module('proton.controllers.Reset', ['proton.utils'])
.controller('ResetController', (
    $scope,
    $rootScope,
    $state,
    $log,
    gettextCatalog,
    $q,
    $timeout,
    $http,
    CONSTANTS,
    authentication,
    networkActivityTracker,
    User,
    Reset,
    Key,
    passwords,
    pmcw,
    tempStorage,
    tools,
    notify
) => {
    function initialization() {

        $scope.creds = tempStorage.getItem('creds');

        if (!$scope.creds || !$scope.creds.authResponse) {
            $state.go('login');
        }

        // Variables
        $scope.tools = tools;
        $scope.compatibility = tools.isCompatible();
        $scope.resetMailboxToken = undefined;
        $scope.account = [];
        $scope.addresses = [];

        $scope.process = {};
        $scope.process.danger = '';
        $scope.process.generatingKeys = false;
        $scope.process.savingKeys = false;
        $scope.process.redirecting = false;

        $scope.showForm = false;// ($scope.resetMailboxToken!==undefined) ? true : false;

    }

    // ---------------------------------------------------
    // ---------------------------------------------------
    // Reset Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    /**
     * Returns a promise of generated keys from crypto
     * @param email {String}
     * @param mbpw {String}
     * @return {Promise}
     */
    $scope.generateKeys = function (mbpw) {
        const promises = [];
        const keySalt = (CONSTANTS.KEY_PHASE > 1) ? passwords.generateKeySalt() : null;

        $scope.process.genNewKeys = true;

        return passwords.computeKeyPassword(mbpw, keySalt)
            .then((newMailboxPwd) => {
                _.each($scope.addresses, (address) => {
                    const userID = address.Email;
                    promises.push(
                        pmcw.generateKeysRSA(userID, newMailboxPwd).then(
                            (response) => {
                                return {
                                    AddressID: address.ID,
                                    PrivateKey: response.privateKeyArmored
                                };
                            },
                            (err) => {
                                $scope.process.genNewKeys = false;
                                $log.error(err);
                                $scope.error = err;
                                return Promise.reject(err);
                            }
                        )
                    );
                });

                return $q.all(promises).then((keys) => {
                    $scope.process.generatingKeys = true;
                    return { KeySalt: keySalt, PrimaryKey: keys[0].PrivateKey, AddressKeys: keys };
                });
            });
    };

    /**
     * A chain of promises. Displays errors to the user.
     * Else: resets mailbox, logs them in and redirects
     * @param form {Reference to the form submitted}
     */
    $scope.resetMailbox = function () {

        if (
            $scope.resetMailboxToken === undefined
        ) {
            notify({ message: 'Missing reset token', classes: 'notification-danger' });
            return;
        }

        networkActivityTracker.track(
            $scope.generateKeys($scope.account.mailboxPassword)
            .then($scope.newMailbox)
            .then($scope.resetMailboxTokenResponse)
            .then($scope.doLogUserIn)
            .then($scope.doMailboxLogin)
            .catch((err) => {
                // TODO exception handling
                $log.error(err);
                notify({
                    classes: 'notification-danger',
                    message: err.message
                });
            })
        );
    };

    /**
     * Tries to log the user in.
     * @return {Promise}
     */
    $scope.doLogUserIn = function () {
        return authentication.loginWithCredentials({
            Username: $scope.creds.username,
            Password: $scope.creds.password
        });
    };

    /**
     * Logs the user in and sets auth stuff
     * @return {Redirect} redirects user to inbox on success.
     * TODO: error logging
     */
    $scope.doMailboxLogin = ({ data }) => {

        $scope.creds.authResponse = data;

        return authentication
            .unlockWithPassword($scope.account.mailboxPassword, $scope.creds.authResponse)
            .then(() => {
                return authentication
                    .setAuthCookie($scope.creds.authResponse)
                    .then(() => {
                        $scope.process.redirecting = true;
                        $rootScope.isLoggedIn = authentication.isLoggedIn();
                        $rootScope.isLocked = authentication.isLocked();
                        $rootScope.isSecure = authentication.isSecured();
                        $state.go('secured.inbox');
                    }, () => {
                        notify({
                            classes: 'notification-danger',
                            message: 'doMailboxLogin: Unable to set authCookie.'
                        });
                    });
            }, () => {
                notify({
                    classes: 'notification-danger',
                    message: 'doMailboxLogin: Unable to unlock mailbox.'
                });
            });
    };

    /**
     * Verifies the code reset code from the user. Shows a new form on success in the view using flags.
     * TODO: error logging for analytics / rate limiting?
     */
    $scope.verifyResetCode = function () {
        if (
            angular.isUndefined($scope.account.resetMbCode) ||
            $scope.account.resetMbCode.length === 0
        ) {
            notify('Verification Code required');
        } else {
            Reset.validateResetToken({
                Username: $scope.creds.username,
                Token: $scope.account.resetMbCode
            })
            .then(
                (response) => {
                    if (response.data.Code !== 1000) {
                        notify({
                            classes: 'notification-danger',
                            message: 'Invalid Verification Code.'
                        });
                    } else {
                        $scope.addresses = response.data.Addresses;
                        $scope.resetMailboxToken = $scope.account.resetMbCode;
                        $scope.showForm = true;
                        $scope.showEmailMessage = false;
                    }
                },
                (err) => {
                    $log.error(err);
                    notify({
                        classes: 'notification-danger',
                        message: 'Unable to verify Reset Token.'
                    });
                }
            );
        }
    };

    /**
     * Initialized in the view. Setups stuff. Depends on if user has recovery email set.
     */
    $scope.resetMailboxInit = function () {
        if ($scope.process.danger !== 'DANGER') {
            notify({ message: 'Invalid value', classes: 'notification-danger' });
            return false;
        }

        if (angular.isDefined($scope.creds) && angular.isDefined($scope.creds.authResponse)) {
            $http.defaults.headers.common.Authorization = 'Bearer ' + $scope.creds.authResponse.ResetToken;
            $http.defaults.headers.common['x-pm-uid'] = $scope.creds.authResponse.Uid;
        }

        /**
         * Request a reset token. Emailed to user (if Notf email is set) otherwise returns from API directly.
         * @return {Response} $HTTP repsonse.  Response will not return a token if emailed. This is handled in the next chained promise.
         * TODO: error logging
         */
        const getMBToken = function () {
            return Reset.getMailboxResetToken({}); // $http API response
        };

        const tokenResponse = function (response) {
            const deferred = $q.defer();
            if (response.data.Error || response.data.Code !== 1000) {
                notify(response);
                $log.error(response);
                deferred.reject(response.data.Error);
            } else if (response.data.Token) {
                $scope.resetMailboxToken = response.data.Token;
                Reset.validateResetToken({
                    Username: $scope.creds.username,
                    Token: response.data.Token // $scope.account.resetMbCode
                })
                .then(
                    (response) => {
                        if (response.data.Code !== 1000) {
                            notify({
                                classes: 'notification-danger',
                                message: 'Invalid Verification Code.'
                            });
                        } else {
                            $scope.addresses = response.data.Addresses;
                            $scope.showForm = true;
                            $scope.showEmailMessage = false;
                            deferred.resolve(200);
                        }
                    },
                    (err) => {
                        $log.error(err);
                        notify({
                            classes: 'notification-danger',
                            message: 'Unable to verify Reset Token.'
                        });
                    }
                );
            } else {
                $scope.showEmailMessage = true;
                deferred.resolve(200);
            }

            return deferred.promise;
        };

        networkActivityTracker.track(
            getMBToken()
            .then(tokenResponse)
        );
    };

    /**
     * Sends creds back to login.unlock state
     */
    $scope.cancelReset = function () {
        tempStorage.setItem('creds', $scope.creds);
        $state.go('login.unlock');
    };

    /**
     * Saves new keys - overriding old, thus resetting the account.
     * @return {Response} $HTTP repsonse. Handled in next chained promise.
     * TODO: error logging
     */
    $scope.newMailbox = function (params) {
        let resetMBtoken;

        if ($scope.resetMailboxToken !== undefined) {
            resetMBtoken = $scope.resetMailboxToken;
        }

        params.Token = resetMBtoken;

        return Key.reset(params); // Not to be confused with this local function. Its for the Reset model!
    };

     /**
     * Handles $http response for saving new keys.
     * @return {Promise}
     */
    $scope.resetMailboxTokenResponse = function (response) {
        const promise = $q.defer();
        if (!response) {
            promise.reject(new Error('Connection error: Unable to save new keys.'));
        }
        if (response.status !== 200) {
            notify({
                classes: 'notification-danger',
                message: 'Error, try again in a few minutes.'
            });
            $scope.process.savingKeys = false;
            promise.reject(new Error('Status Error: Unable to save new keys.'));
        } else if (response.data.Error) {
            if (response.data.ErrorDescription !== '') {
                notify({
                    classes: 'notification-danger',
                    message: response.data.ErrorDescription
                });
                $log.error(response);
                $scope.process.savingKeys = false;
                promise.reject(new Error(response.data.ErrorDescription));
            } else {
                notify({
                    classes: 'notification-danger',
                    message: response.data.Error
                });
                $log.error(response);
                $scope.process.savingKeys = false;
                promise.reject(new Error(response.data.Error));
            }
        } else {
            $scope.process.savingKeys = true;
            promise.resolve(200);
        }
        return promise;
    };

    initialization();
});
