/* @ngInject */
function loadApi($http, url) {
    const requestUrl = url.build('core/v4/load');

    const handleResult = ({ data = {} } = {}) => data;

    const post = (page) => $http.get(requestUrl(), { params: { page } }).then(handleResult);

    return {
        post
    };
}
export default loadApi;
