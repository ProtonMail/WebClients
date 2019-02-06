/* @ngInject */
function requestFormData($http) {
    /**
     * Perform http request to send FormData content
     * @param  {String} options.method
     * @param  {String} options.url
     * @param  {FormData} options.data
     * @param  {Boolean} options.noOfflineNotify
     * @return {Promise}
     */
    return ({ method = 'POST', url = '', data, noOfflineNotify }) =>
        $http({
            method,
            url,
            noOfflineNotify,
            data,
            transformRequest: angular.identity, // prevents Angular to do anything on our data (like serializing it).
            headers: {
                'Content-Type': undefined // By setting 'Content-Type': undefined, the browser sets the Content-Type to multipart/form-data for us and fills in the correct boundary. Manually setting 'Content-Type': multipart/form-data will fail to fill in the boundary parameter of the request.
            }
        });
}
export default requestFormData;
