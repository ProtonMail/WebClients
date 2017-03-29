angular.module('proton.message')
.factory('messageApi', ($http, url) => {
    const requestURL = url.build('messages');
    return {
        /**
         * Send a message
         * @param  {Object} params
         * @return {Promise}
         */
        send(params = {}) {
            return $http.post(requestURL('send', params.id), params);
        },
        /**
         * Create a new draft message
         * @param  {Object} params
         * @return {Promise}
         */
        createDraft(params = {}) {
            return $http.post(requestURL('draft'), params);
        },
        /**
         * Get message
         * @param {String} messageID
         * @return {Promise}
         */
        get(messageID = '') {
            return $http.get(requestURL(messageID));
        },
        /**
         * Get a list of message metadata
         * @param {Object} params
         * @return {Promise}
         */
        query(params = {}) {
            return $http({
                url: requestURL(),
                method: 'GET',
                params
            });
        },
        /**
         * Get grouped message count
         * @return {Promise}
         */
        count() {
            return $http.get(requestURL('count'));
        },
        /**
         * Update a draft message
         * @param {Objecet} params
         * @return {Promise}
         */
        updateDraft(params = {}) {
            const messageID = params.ID || params.id;
            return $http.put(requestURL('draft', messageID), params);
        },
        /**
         * Mark an array of messages as starred
         * @param {Object}
         * @return {Promise}
         */
        star(params = {}) {
            return $http.put(requestURL('star'), params);
        },
        /**
         * Mark an array of messages as unstarred
         * @param {Object}
         * @return {Promise}
         */
        unstar(params = {}) {
            return $http.put(requestURL('unstar'), params);
        },
        /**
         * Mark an array of messages as read
         * @param {Object}
         * @return {Promise}
         */
        read(params = {}) {
            return $http.put(requestURL('read'), params);
        },
        /**
         * Mark an array of messages as unread
         * @param {Object}
         * @return {Promise}
         */
        unread(params = {}) {
            return $http.put(requestURL('unread'), params);
        },
        /**
         * Move an array of messages to trash
         * @param {Object}
         * @return {Promise}
         */
        trash(params = {}) {
            return $http.put(requestURL('trash'), params);
        },
        /**
         * Move an array of messages to inbox
         * @param {Object}
         * @return {Promise}
         */
        inbox(params = {}) {
            return $http.put(requestURL('inbox'), params);
        },
        /**
         * Move an array of messages to spam
         * @param {Object}
         * @return {Promise}
         */
        spam(params = {}) {
            return $http.put(requestURL('spam'), params);
        },
        /**
         * Move an array of messages to archive
         * @param {Object} params
         * @return {Promise}
         */
        archive(params = {}) {
            return $http.put(requestURL('archive'), params);
        },
        /**
         * Delete an array of messages
         * @param {Object} params
         * @return {Promise}
         */
        delete(params = {}) {
            return $http.put(requestURL('delete'), params);
        },
        /**
         * Undelete an array of messages
         * @param {Object} params
         * @return {Promise}
         */
        undelete(params = {}) {
            return $http.put(requestURL('undelete'), params);
        },
        /**
         * Label/unlabel an array of messages
         * @param {String} LabelID
         * @param {Integer} Action
         * @param {Array} MessageIDs
         * @return {Promise}
         */
        label(LabelID, Action, MessageIDs) {
            return $http.put(requestURL('label'), { LabelID, Action, MessageIDs });
        },
        /**
         * Delete all messages in the draft folder
         * @return {Promise}
         */
        emptyDraft() {
            return $http.delete(requestURL('draft'));
        },
        /**
         * Delete all messages in the spam folder
         * @return {Promise}
         */
        emptySpam() {
            return $http.delete(requestURL('spam'));
        },
        /**
         * Delete all messages in the trash folder
         * @return {Promise}
         */
        emptyTrash() {
            return $http.delete(requestURL('trash'));
        }
    };
});
