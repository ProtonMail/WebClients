angular.module('proton.formUtils')
.directive('uniqueUsername', ($stateParams, gettextCatalog, User) => {
    const alreadyTaken = gettextCatalog.getString('Username already taken', null, 'Error');
    const requestFailed = gettextCatalog.getString('The request failed', null, 'Error');
    const tooMuch = gettextCatalog.getString('You are doing this too much, please try again later', null, 'Error');
    const cleanUsername = (username = '') => username.toLowerCase().replace('.', '').replace('_', '').replace('-', '');

    return {
        require: 'ngModel',
        restrict: 'A',
        scope: { uniqueError: '=' },
        link(scope, element, attributes, ngModel) {
            function isUsernameAvailable(username) {
                const usernameCleaned = cleanUsername(username);
                // Temporary hack, remove along with $stateParams dependence once invite system migration complete
                if (usernameCleaned === $stateParams.inviteSelector) {
                    return Promise.resolve();
                }

                return User.available(username)
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        if (data.Available) {
                            return Promise.resolve();
                        }
                        scope.uniqueError = alreadyTaken;
                        return Promise.reject(alreadyTaken);
                    }

                    if (data.Error === 429) {
                        scope.uniqueError = tooMuch;
                        return Promise.reject(tooMuch);
                    }

                    if (data.Error) {
                        scope.uniqueError = data.Error;
                        return Promise.reject(data.Error);
                    }

                    scope.uniqueError = requestFailed;

                    return Promise.reject(requestFailed);
                });
            }
            ngModel.$asyncValidators.unique = isUsernameAvailable;
        }
    };
});
