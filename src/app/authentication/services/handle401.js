import _ from 'lodash';

/* @ngInject */
function handle401($http, authentication) {
    let refreshPromise = null;

    const clearPromise = () => (refreshPromise = null);

    const logout = () => {
        clearPromise();
        authentication.logout(true, false);
    };

    const recall = ({ config }) => {
        _.extend(config.headers, $http.defaults.headers.common);

        return $http(config);
    };

    return (rejection) => {
        if (!authentication.existingSession()) {
            logout();
            return Promise.reject(rejection);
        }

        if (!refreshPromise) {
            refreshPromise = authentication
                .getRefreshCookie()
                .then(clearPromise)
                .catch(() => {
                    logout();
                    // If the refresh call fails, hide the "Refresh cookie fail" error and return "Invalid access token" instead
                    return Promise.reject(rejection);
                });
        }

        return refreshPromise.then(() => recall(rejection));
    };
}
export default handle401;
