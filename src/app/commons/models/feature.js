/* @ngInject */
function Feature($http, url) {
    const requestURL = url.build('core/v4/features');

    const get = (featureCode, config) => $http.get(requestURL(featureCode), config).then(({ data } = {}) => data);

    const updateValue = (featureCode, Value, config) => $http.put(requestURL(featureCode, 'value'), { Value }, config);

    return { get, updateValue };
}
export default Feature;
