angular.module('proton.conversation')
.factory('conversationApi', ($http, url) => {
    const requestURL = url.build('conversations');
    return {
        /**
         * Get a list of conversations
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
        * Get conversation and associated message metadata
        * @param {String} ConversationID
        * @return {Promise}
        */
        get(ConversationID = '') {
            return $http.get(requestURL(ConversationID));
        },
        /**
         * Get grouped conversation count
         * @return {Promise}
         */
        count() {
            return $http.get(requestURL('count'));
        },
        /**
        * Mark an array of conversations as starred
        * @param {Array} IDs
        * @return {Promise}
        */
        star(IDs = []) {
            return $http.put(requestURL('star'), { IDs });
        },
        /**
        * Mark an array of conversations as unstarred
        * @param {Array} IDs
        * @return {Promise}
        */
        unstar(IDs = []) {
            return $http.put(requestURL('unstar'), { IDs });
        },
        /**
        * Mark an array of conversations as read
        * @param {Array} IDs
        * @return {Promise}
        */
        read(IDs = []) {
            return $http.put(requestURL('read'), { IDs });
        },
        /**
        * Mark an array of conversations as unread
        * @param {Array} IDs
        * @return {Promise}
        */
        unread(IDs = []) {
            return $http.put(requestURL('unread'), { IDs });
        },
        /**
         * Move an array of conversations to trash
         * @param {Array} IDs
         * @return {Promise}
         */
        trash(IDs = []) {
            return $http.put(requestURL('trash'), { IDs });
        },
        /**
         * Move an array of conversations to inbox
         * @param {Array} IDs
         * @return {Promise}
         */
        inbox(IDs = []) {
            return $http.put(requestURL('inbox'), { IDs });
        },
        /**
         * Move an array of conversations to spam
         * @param {Array} IDs
         * @return {Promise}
         */
        spam(IDs = []) {
            return $http.put(requestURL('spam'), { IDs });
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         * @return {Promise}
         */
        archive(IDs = []) {
            return $http.put(requestURL('archive'), { IDs });
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         * @return {Promise}
         */
        delete(IDs = []) {
            return $http.put(requestURL('delete'), { IDs });
        },
        /**
         * Label/unlabel an array of conversations
         * @param {String} LabelID
         * @param {Integer} Action
         * @param {Array} ConversationIDs
         * @return {Promise}
         */
        labels(LabelID = '', Action, ConversationIDs = []) {
            return $http.put(requestURL('label'), { LabelID, Action, ConversationIDs });
        }
    };
});
