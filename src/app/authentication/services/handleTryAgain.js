/* @ngInject */
function handleTryAgain($http, $q, tryAgainModel) {
    return (rejection) => {
        const { url } = rejection.config;

        if (!tryAgainModel.check(url)) {
            tryAgainModel.add(url);

            return $http(rejection.config).then((result) => {
                tryAgainModel.remove(url);
                return result;
            });
        }

        tryAgainModel.remove(url);

        return $q.reject(rejection);
    };
}
export default handleTryAgain;
