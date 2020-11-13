/* @ngInject */
function Feature($http, url) {
    const requestURL = url.build('core/v4/features');

    const get = (featureCode) => $http.get(requestURL(featureCode)).then(({ data } = {}) => data);

    const updateValue = (featureCode, Value) => $http.put(requestURL(featureCode, 'value'), { Value });

    return { get, updateValue };
}
export default Feature;
