import _ from 'lodash';

/* @ngInject */
function handle401($http, authentication) {
    const CACHE = { promises: [] };
    const clearPromise = () => (CACHE.promises.length = 0);
    const logout = () => (clearPromise(), authentication.logout(true, false));
    const recall = ({ config }) => {
        _.extend(config.headers, $http.defaults.headers.common);

        return $http(config);
    };

    return (rejection) => {
        const isRefreshing = CACHE.promises.length;

        if (!isRefreshing) {
            CACHE.promises.push(rejection);

            return authentication
                .getRefreshCookie()
                .then(() => Promise.all(CACHE.promises.map((rejection) => recall(rejection))))
                .then(() => clearPromise())
                .catch(() => logout());
        }

        CACHE.promises.push(rejection);
    };
}
export default handle401;
