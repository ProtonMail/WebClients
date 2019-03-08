/* @ngInject */
function Reset($http, url) {
    const requestUrl = url.build('reset');

    const request = (params = {}) => $http.post(requestUrl(), params);

    const validate = ({ Username, Token }) => $http.get(requestUrl(Username, encodeURIComponent(Token)));

    return { request, validate };
}

export default Reset;
