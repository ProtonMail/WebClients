import { API_CUSTOM_ERROR_CODES, USERNAME_STATUS, USERNAME_STATUS_TO_ERROR } from '../../errors';

const {
    USER_EXISTS_USERNAME_ALREADY_USED,
    USER_EXISTS_USERNAME_TOO_LONG,
    USER_EXISTS_USERNAME_SPECIAL_CHAR_END,
    USER_EXISTS_USERNAME_SPECIAL_CHAR_START,
    USER_EXISTS_USERNAME_INVALID_CHARACTERS
} = API_CUSTOM_ERROR_CODES;

const { ALREADY_USED, AVAILABLE } = USERNAME_STATUS;

/* @ngInject */
function UserAvailability($http, url, gettextCatalog) {
    const requestURL = url.build('users');

    /**
     * FOR: https://github.com/ProtonMail/Angular/issues/7572
     * In order to have temporary backwards compatibility with the new and old response.
     *
     * NOTE: They are all functions in order to get the correct translation while waiting for
     * https://github.com/ProtonMail/Angular/pull/7162
     */
    const I18N_USERNAME_AVAILABLE = {
        [USER_EXISTS_USERNAME_ALREADY_USED]: () => gettextCatalog.getString('Username already taken', null, 'Error'),
        [USER_EXISTS_USERNAME_INVALID_CHARACTERS]: () =>
            gettextCatalog.getString('Username contains invalid characters', null, 'Error'),
        [USER_EXISTS_USERNAME_SPECIAL_CHAR_START]: () =>
            gettextCatalog.getString('Username must begin with a letter or digit', null, 'Error'),
        [USER_EXISTS_USERNAME_SPECIAL_CHAR_END]: () =>
            gettextCatalog.getString('Username must end with a letter or digit', null, 'Error'),
        [USER_EXISTS_USERNAME_TOO_LONG]: () => gettextCatalog.getString('Username too long', null, 'Error'),
        [USER_EXISTS_USERNAME_ALREADY_USED]: () => gettextCatalog.getString('Username already used', null, 'Error')
    };

    /**
     * This route currently handles backwards compatibility with the new and old response data.
     * It simulates throwing an error for the old response so it'll automatically be compatible
     * with the new response.
     * @param {Object} params
     * @returns {Promise}
     */
    const available = (params) =>
        $http.get(requestURL('available'), params).then((res = {}) => {
            const { data = {} } = res;

            /**
             * Check for the new way. When the call succeeds, it just returns 200 without a Status.
             * Otherwise, check for the old way. If we did receive a status, check that it equals AVAILABLE (0).
             * These are the success cases.
             */
            if (typeof data.Status === 'undefined' || data.Status === AVAILABLE) {
                return data;
            }

            /**
             * Otherwise we have received a status which is defined and not 0, so we throw an error to have
             * compatibility with the new way. If it's a status code we don't have, it returns ALREADY_USED
             * with no suggestions.
             */
            const errorCode = USERNAME_STATUS_TO_ERROR[data.Status] || USERNAME_STATUS_TO_ERROR[ALREADY_USED];

            // If the status is not 0 (and it's defined), pretend it is a 400 call.
            return Promise.reject({
                ...res,
                status: 400,
                data: {
                    Code: errorCode,
                    Error: I18N_USERNAME_AVAILABLE[errorCode](),
                    Details: {
                        Suggestions: data.Suggestions || []
                    }
                }
            });
        });

    return {
        available
    };
}
export default UserAvailability;
