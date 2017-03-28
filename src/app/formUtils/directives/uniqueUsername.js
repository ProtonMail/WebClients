angular.module('proton.formUtils')
.directive('uniqueUsername', (User, $stateParams) => {
    const cleanUsername = (username = '') => username.toLowerCase().replace('.', '').replace('_', '').replace('-', '');
    function isUsernameAvailable(username) {
        const usernameCleaned = cleanUsername(username);
        // Temporary hack, remove along with $stateParams dependence once invite system migration complete
        if (usernameCleaned === $stateParams.inviteSelector) {
            return Promise.resolve();
        }

        return User.available(username)
        .then(({ data = {} }) => {
            const { Code, Error, Available } = data;
            if (Code === 1000) {
                if (Available) {
                    return Promise.resolve();
                }
                return Promise.reject('Username already taken');
            } else if (Error) {
                return Promise.reject(Error);
            }
            return Promise.reject();
        });
    }
    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, element, attributes, ngModel) {
            ngModel.$asyncValidators.unique = isUsernameAvailable;
        }
    };
});
