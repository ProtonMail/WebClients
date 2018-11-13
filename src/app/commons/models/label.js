/* @ngInject */
function Label($http, url) {
    const requestUrl = url.build('labels');
    /**
     * Get labels
     * @return {Promise}
     */
    const query = (params) => {
        return $http.get(requestUrl(), { params }).then(({ data = {} } = {}) => data.Labels);
    };

    /**
     * Re-order labels
     * @param {Object} newOrder
     * @return {Promise}
     */
    const order = (newOrder) => {
        return $http.put(requestUrl('order'), newOrder);
    };

    /**
     * Update label
     * @param {Object} label
     * @return {Promise}
     */
    const update = (label) => {
        return $http.put(requestUrl(label.ID), label).then(({ data = {} } = {}) => data.Label);
    };

    /**
     * Create a new label
     * @param {Object} label
     * @return {Promise}
     */
    const create = (label) => {
        return $http.post(requestUrl(), label).then(({ data = {} } = {}) => data.Label);
    };

    /**
     * Delete label
     * @param {String} labelID
     * @return {Promise}
     */
    const remove = (labelID) => {
        return $http.delete(requestUrl(labelID));
    };

    return {
        query,
        order,
        update,
        create,
        remove
    };
}
export default Label;
