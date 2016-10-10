angular.module('proton.models.label', [])

.factory('Label', ($http, url) => {
    const api = {
        /**
         * Get labels
         * @return {Promise}
         */
        query() {
            return $http.get(url.get() + '/labels');
        },
        /**
         *  Apply labels
         * @param {String} labelID
         * @param {Array} messageIDs
         * @return {Promise}
         */
        apply(labelID, messageIDs) {
            return $http.put(url.get() + '/labels/apply/' + labelID, messageIDs);
        },
        /**
         * Remove label from list of message ids
         * @param {String} labelID
         * @param {Array} messageIDs
         * @return {Promise}
         */
        remove(labelID, messageIDs) {
            return $http.put(url.get() + '/labels/remove/' + labelID, messageIDs);
        },
        /**
         * Re-order labels
         * @param {Object} newOrder
         * @return {Promise}
         */
        order(newOrder) {
            return $http.put(url.get() + '/labels/order', newOrder);
        },
        /**
         * Update label
         * @param {Object} label
         * @return {Promise}
         */
        update(label) {
            return $http.put(url.get() + '/labels/' + label.ID, label);
        },
        /**
         * Create a new label
         * @param {Object} label
         * @return {Promise}
         */
        create(label) {
            return $http.post(url.get() + '/labels', label);
        },
        /**
         * Delete label
         * @param {String} labelID
         * @return {Promise}
         */
        delete(labelID) {
            return $http.delete(url.get() + '/labels/' + labelID);
        }
    };

    return api;
});
