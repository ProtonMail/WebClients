/* @ngInject */
function compatApi($http, url) {
    /**
     * Compatible API function for proton-shared.
     * @param {Object} config
     */
    return ({ url: urlString, ...restConfig }) => {
        const urlWithBase = urlString.startsWith('http') ? urlString : `${url.get()}/${urlString}`;
        return $http({ url: urlWithBase, ...restConfig }).then(({ data }) => data);
    };
}

export default compatApi;
