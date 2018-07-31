/* @ngInject */
function requestFormData($http) {
    /**
     * Perform http request to send FormData content
     * @param  {String} method
     * @param  {String} url
     * @param  {FormData} data
     * @return {Promise}
     */
    return (method = 'POST', url = '', data) =>
        $http({
            method,
            url,
            data,
            transformRequest: angular.identity, // prevents Angular to do anything on our data (like serializing it).
            headers: {
                'Content-Type': undefined // By setting 'Content-Type': undefined, the browser sets the Content-Type to multipart/form-data for us and fills in the correct boundary. Manually setting 'Content-Type': multipart/form-data will fail to fill in the boundary parameter of the request.
            }
        });
}
export default requestFormData;
