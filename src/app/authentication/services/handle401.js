import _ from 'lodash';

/* @ngInject */
function handle401($http, authentication) {
    let refreshPromise = null;
    const clearPromise = () => refreshPromise = null;
    const logout = (err) => {
        authentication.logout(true, false);

        return Promise.reject(err);
    };
    const recall = ({ config }) => {
        _.extend(config.headers, $http.defaults.headers.common);

        return $http(config);
    };

    return (rejection) => {

        if (!authentication.existingSession()) {
            return logout(rejection);
        }

        if (!refreshPromise) {
            refreshPromise = authentication
                .getRefreshCookie()
                .then(clearPromise)
                .catch(logout);
        }

        return refreshPromise
            .then(() => recall(rejection))
            .catch(() => Promise.reject(rejection));
    };
}
export default handle401;
