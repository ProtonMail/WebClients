angular.module('proton.ui')
.directive('uniqueUsername', (User) => {
    function isUsernameAvailable(username) {
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
