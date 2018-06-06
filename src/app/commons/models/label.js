/* @ngInject */
function Label($http, url) {
    const requestUrl = url.build('labels');
    const api = {
        /**
         * Get labels
         * @return {Promise}
         */
        query(params) {
            return $http.get(requestUrl(), { params });
        },
        /**
         * Re-order labels
         * @param {Object} newOrder
         * @return {Promise}
         */
        order(newOrder) {
            return $http.put(requestUrl('order'), newOrder);
        },
        /**
         * Update label
         * @param {Object} label
         * @return {Promise}
         */
        update(label) {
            return $http.put(requestUrl(label.ID), label);
        },
        /**
         * Create a new label
         * @param {Object} label
         * @return {Promise}
         */
        create(label) {
            return $http.post(requestUrl(), label);
        },
        /**
         * Delete label
         * @param {String} labelID
         * @return {Promise}
         */
        delete(labelID) {
            return $http.delete(requestUrl(labelID));
        }
    };

    return api;
}
export default Label;
