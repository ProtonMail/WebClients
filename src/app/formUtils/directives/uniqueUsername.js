/* @ngInject */
function uniqueUsername($stateParams, UserAvailability) {
    const clean = (input = '') => input.toLowerCase().replace(/\.|-|_/, '');

    const ERRORS = ['offlineError', 'tooMuch', 'requestError', 'apiError'];

    const validator = (ngModel, scope) => (username) => {
        const usernameCleaned = clean(username);

        ERRORS.forEach((errorName) => delete ngModel.$error[errorName]);

        // Temporary hack, remove along with $stateParams dependence once invite system migration complete
        if (usernameCleaned === $stateParams.inviteSelector) {
            return Promise.resolve();
        }

        return UserAvailability.available({ params: { Name: username }, noNotify: true }).catch(
            ({ status, data = {} } = {}) => {
                if (status === 429) {
                    ngModel.$error.tooMuch = true;
                    return Promise.reject(false);
                }

                if (status === 0 || status === -1) {
                    ngModel.$error.offlineError = true;
                    return Promise.reject(false);
                }

                if (data.Error) {
                    ngModel.$error.apiError = true;
                    scope.apiErrorMessage = data.Error;
                    return Promise.reject(false);
                }

                // If there is no error from the API, show a generic "Request failed".
                ngModel.$error.requestError = true;
                return Promise.reject(false);
            }
        );
    };

    return {
        require: 'ngModel',
        restrict: 'A',
        link(scope, el, attr, ngModel) {
            ngModel.$asyncValidators.unique = validator(ngModel, scope);
        }
    };
}
export default uniqueUsername;
