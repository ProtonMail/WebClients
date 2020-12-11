/* @ngInject */
function Feature($http, url) {
    const requestURL = url.build('core/v4/features');

    const get = (featureCode, config) => $http.get(requestURL(featureCode), config).then(({ data } = {}) => data);

    const updateValue = (featureCode, Value) => $http.put(requestURL(featureCode, 'value'), { Value });

    return { get, updateValue };
}
export default Feature;
