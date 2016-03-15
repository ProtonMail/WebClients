angular.module("proton.models.label", [])

.factory("Label", function($http, url) {
    var api = {
        /**
         * Get labels
         * @return {Promise}
         */
        query: function() {
            return $http.get(url.get() + '/labels');
        },
        /**
         *  Apply labels
         * @param {String} labelID
         * @param {Array} messageIDs
         * @return {Promise}
         */
        apply: function(labelID, messageIDs) {
            return $http.put(url.get() + '/labels/apply/' + labelID, messageIDs);
        },
        /**
         * Remove label from list of message ids
         * @param {String} labelID
         * @param {Array} messageIDs
         * @return {Promise}
         */
        remove: function(labelID, messageIDs) {
            return $http.put(url.get() + '/labels/remove/' + labelID, messageIDs);
        },
        /**
         * Re-order labels
         * @param {Object} newOrder
         * @return {Promise}
         */
        order: function(newOrder) {
            return $http.put(url.get() + '/labels/order', newOrder);
        },
        /**
         * Update label
         * @param {Object} label
         * @return {Promise}
         */
        update: function(label) {
            return $http.put(url.get() + '/labels/' + label.ID, label);
        },
        /**
         * Create a new label
         * @param {Object} label
         * @return {Promise}
         */
        create: function(label) {
            return $http.post(url.get() + '/labels', label);
        },
        /**
         * Delete label
         * @param {String} labelID
         * @return {Promise}
         */
        delete: function(labelID) {
            return $http.delete(url.get() + '/labels/' + labelID);
        }
    };

    return api;
});
