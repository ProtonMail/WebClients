angular.module('proton.ui')
.directive('uniqueUsername', (User, gettextCatalog) => {
    function isUsernameAvailable(username) {
        return User.available(username)
        .then(({ data = {} }) => {
            const { Code, Error, Available } = data;
            if (Code === 1000) {
                if (!Available) {
                    const error = gettextCatalog.getString('Username already taken', null, 'Error');
                    return Promise.reject(error);
                }
                return Promise.resolve();
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
