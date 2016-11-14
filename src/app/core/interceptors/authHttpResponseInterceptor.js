angular.module('proton.core')
//
// Redirection if not authentified
//
.factory('authHttpResponseInterceptor', ($q, $injector, $rootScope) => {
    let notification = false;
    let upgradeNotification = false;

    return {
        response(response) {
            // Close notification if Internet wake up
            if (notification) {
                notification.close();
                notification = false;
            }

            if (angular.isDefined(response.data) && angular.isDefined(response.data.Code)) {
                // app update needd
                if (response.data.Code === 5003) {
                    if (upgradeNotification) {
                        upgradeNotification.close();
                    }

                    upgradeNotification = $injector.get('notify')({
                        classes: 'notification-info noclose',
                        message: 'A new version of ProtonMail is available. Please refresh this page and then logout and log back in to automatically update.',
                        duration: '0'
                    });
                } else if (response.data.Code === 5004) {
                    $injector.get('notify')({
                        classes: 'notification-danger',
                        message: 'Non-integer API version requested.'
                    });
                } else if (response.data.Code === 5005) {
                    // unsupported api
                    $injector.get('notify')({
                        classes: 'notification-danger',
                        message: 'Unsupported API version.'
                    });
                } else if (response.data.Code === 7001) {
                    // site offline
                    $injector.get('notify')({
                        classes: 'notification-info',
                        message: 'The ProtonMail API is offline: ' + response.data.ErrorDescription
                    });
                }
            }

            return response || $q.when(response);
        },
        responseError(rejection) {
            if (rejection.status === 0 || rejection.status === -1) {
                if (navigator.onLine === true) {
                    notification = $injector.get('notify')({
                        message: 'Could not connect to server.',
                        classes: 'notification-danger'
                    });
                } else {
                    notification = $injector.get('notify')({
                        message: 'No Internet connection found.',
                        classes: 'notification-danger'
                    });
                }
            } else if (rejection.status === 401) {
                if ($rootScope.doRefresh === true) {
                    $rootScope.doRefresh = false;
                    $injector.get('authentication').getRefreshCookie()
                    .then(
                        () => {
                            const $http = $injector.get('$http');

                            _.extend(rejection.config.headers, $http.defaults.headers.common);
                            return $http(rejection.config);
                        },
                        () => {
                            $injector.get('authentication').logout(true, false);
                        }
                    );
                } else {
                    $injector.get('authentication').logout(true, false);
                }
            } else if (rejection.status === 403) {
                const $http = $injector.get('$http');
                const loginPasswordModal = $injector.get('loginPasswordModal');
                const User = $injector.get('User');
                const authentication = $injector.get('authentication');
                const notify = $injector.get('notify');
                const deferred = $q.defer();

                // Open the open to enter login password because this request require lock scope
                loginPasswordModal.activate({
                    params: {
                        hasTwoFactor: authentication.user.TwoFactor,
                        submit(loginPassword, twoFactorCode) {
                            // Send request to unlock the current session for administrator privileges
                            User.unlock({ Password: loginPassword, TwoFactorCode: twoFactorCode })
                            .then(() => {
                                loginPasswordModal.deactivate();
                                // Resend request now
                                deferred.resolve($http(rejection.config));
                            }, (error) => {
                                notify({ message: error.error_description, classes: 'notification-danger' });
                            });
                        },
                        cancel() {
                            loginPasswordModal.deactivate();
                            deferred.reject();
                        }
                    }
                });

                return deferred.promise;
            } else if ([408, 503, 504].indexOf(rejection.status) !== -1) {
                notification = $injector.get('notify')({
                    message: 'ProtonMail cannot be reached right now, please try again later.',
                    classes: 'notification-danger'
                });
            }

            return $q.reject(rejection);
        }
    };
});
