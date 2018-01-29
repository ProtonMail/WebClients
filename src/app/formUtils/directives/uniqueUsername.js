/* @ngInject */
function uniqueUsername($stateParams, gettextCatalog, User) {
    const clean = (input = '') => input.toLowerCase().replace(/\.|-|_/, '');

    const validator = (ngModel) => (username) => {
        const usernameCleaned = clean(username);
        delete ngModel.$error.alreadyTaken;
        delete ngModel.$error.tooMuch;
        delete ngModel.$error.uniqueError;

        // Temporary hack, remove along with $stateParams dependence once invite system migration complete
        if (usernameCleaned === $stateParams.inviteSelector) {
            return Promise.resolve();
        }

        return User.available(username)
            .then(({ data = {} } = {}) => {
                if (data.Available) {
                    return Promise.resolve();
                }

                ngModel.$error.alreadyTaken = true;
            })
            .catch(({ data = {} } = {}) => {
                if (data.Error === 429) {
                    ngModel.$error.tooMuch = true;
                }

                ngModel.$error.uniqueError = true;
                return Promise.reject(false);
            });
    };

    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, attr, ngModel) {
            ngModel.$asyncValidators.unique = validator(ngModel);
        }
    };
}
export default uniqueUsername;
