import { HTTP_ERROR_CODES } from '../../errors';

/* @ngInject */
function uniqueUsername($stateParams, User) {
    const ERRORS = ['offlineError', 'tooMuch', 'requestError', 'apiError'];

    const clean = (input = '') => input.toLowerCase().replace(/\.|-|_/, '');

    const cleanErrors = (ngModel, scope) => {
        scope.$applyAsync(() => {
            delete scope.apiErrorMessage;
        });
        ERRORS.forEach((errorName) => delete ngModel.$error[errorName]);
    };

    const validator = (ngModel, scope) => async (username) => {
        const usernameCleaned = clean(username);

        // Temporary hack, remove along with $stateParams dependence once invite system migration complete
        if (usernameCleaned === $stateParams.inviteSelector) {
            return true;
        }

        try {
            cleanErrors(ngModel, scope);
            await User.available({ params: { Name: username }, noNotify: true });
            cleanErrors(ngModel, scope);
            return true;
        } catch (e) {
            const { status, data = {} } = e;

            cleanErrors(ngModel, scope);

            if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
                ngModel.$error.tooMuch = true;
                return false;
            }

            if (status === HTTP_ERROR_CODES.TIMEOUT || status === HTTP_ERROR_CODES.ABORTED) {
                ngModel.$error.offlineError = true;
                return false;
            }

            if (data.Error) {
                ngModel.$error.apiError = true;
                scope.$applyAsync(() => {
                    scope.apiErrorMessage = data.Error;
                });
                return false;
            }

            // If there is no error from the API, show a generic "Request failed".
            ngModel.$error.requestError = true;
            return false;
        }
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
