import { USERNAME_STATUS } from '../../errors';

/* @ngInject */
function uniqueUsername($stateParams, User) {
    const clean = (input = '') => input.toLowerCase().replace(/\.|-|_/, '');

    const ERRORS = ['alreadyTaken', 'tooMuch', 'requestError', 'tooLong', 'invalidCharacter', 'apiError'];

    const STATUS_TO_ERROR = {
        [USERNAME_STATUS.ALREADY_USED]: 'alreadyTaken',
        [USERNAME_STATUS.TOO_LONG]: 'tooLong',
        [USERNAME_STATUS.START_SPECIAL_CHARACTER]: 'invalidCharacter',
        [USERNAME_STATUS.END_SPECIAL_CHARACTER]: 'invalidCharacter',
        [USERNAME_STATUS.INVALID_CHARACTERS]: 'invalidCharacter'
    };

    /**
     * Convert the status code from the api to an error name that we display.
     * Returns already used by default.
     * @param {Number} status
     * @returns {string}
     */
    const getErrorName = (status) => STATUS_TO_ERROR[status] || STATUS_TO_ERROR[USERNAME_STATUS.ALREADY_USED];

    const validator = (ngModel, scope) => (username) => {
        const usernameCleaned = clean(username);

        ERRORS.forEach((errorName) => delete ngModel.$error[errorName]);

        // Temporary hack, remove along with $stateParams dependence once invite system migration complete
        if (usernameCleaned === $stateParams.inviteSelector) {
            return Promise.resolve();
        }

        return User.available({ params: { Name: username }, noNotify: true })
            .then(({ data = {} } = {}) => {
                if (data.Status === USERNAME_STATUS.AVAILABLE) {
                    return Promise.resolve();
                }

                ngModel.$error[getErrorName(data.Status)] = true;
                return Promise.reject(false);
            })
            .catch(({ status, data = {} } = {}) => {
                if (status === 429) {
                    ngModel.$error.tooMuch = true;
                    return Promise.reject(false);
                }

                if (data.Error) {
                    ngModel.$error.apiError = true;
                    scope.apiErrorMessage = data.Error;
                    return Promise.reject(false);
                }

                ngModel.$error.requestError = true;
                return Promise.reject(false);
            });
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
