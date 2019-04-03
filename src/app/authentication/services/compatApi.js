/* @ngInject */
function compatApi($http, url) {
    /**
     * Compatible API function for proton-shared.
     * @param {Object} config
     */
    return ({ url: urlString, ...restConfig }) => {
        const apiBase = url.get();
        const urlWithBase = urlString.startsWith(apiBase) ? urlString : `${apiBase}/${urlString}`;
        return $http({ url: urlWithBase, ...restConfig }).then(({ data }) => data);
    };
}

export default compatApi;
