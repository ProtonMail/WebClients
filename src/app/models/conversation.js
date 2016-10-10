angular.module('proton.models.conversations', [])

.factory('Conversation', ($http, url) => {
    return {
        /**
         * Get a list of conversations
         * @param {Object} params
         */
        query(params) {
            return $http({
                url: url.get() + '/conversations',
                method: 'GET',
                params
            });
        },
        /**
        * Get conversation and associated message metadata
        * @param {String} ConversationId
        */
        get(ConversationId) {
            return $http.get(url.get() + '/conversations/' + ConversationId);
        },
        count() {
            return $http.get(url.get() + '/conversations/count');
        },
        // PUT
        /**
        * Mark an array of conversations as starred
        * @param {Array} IDs
        */
        star(IDs) {
            return $http.put(url.get() + '/conversations/star', { IDs });
        },
        /**
        * Mark an array of conversations as unstarred
        * @param {Array} IDs
        */
        unstar(IDs) {
            return $http.put(url.get() + '/conversations/unstar', { IDs });
        },
        /**
        * Mark an array of conversations as read
        * @param {Array} IDs
        */
        read(IDs) {
            return $http.put(url.get() + '/conversations/read', { IDs });
        },
        /**
        * Mark an array of conversations as unread
        * @param {Array} IDs
        */
        unread(IDs) {
            return $http.put(url.get() + '/conversations/unread', { IDs });
        },
        /**
         * Move an array of conversations to trash
         * @param {Array} IDs
         */
        trash(IDs) {
            return $http.put(url.get() + '/conversations/trash', { IDs });
        },
        /**
         * Move an array of conversations to inbox
         * @param {Array} IDs
         */
        inbox(IDs) {
            return $http.put(url.get() + '/conversations/inbox', { IDs });
        },
        /**
         * Move an array of conversations to spam
         * @param {Array} IDs
         */
        spam(IDs) {
            return $http.put(url.get() + '/conversations/spam', { IDs });
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         */
        archive(IDs) {
            return $http.put(url.get() + '/conversations/archive', { IDs });
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         */
        delete(IDs) {
            return $http.put(url.get() + '/conversations/delete', { IDs });
        },
        /**
         * Label/unlabel an array of conversations
         * @param {String} LabelID
         * @param {Integer} Action
         * @param {Array} ConversationIDs
         */
        labels(LabelID, Action, ConversationIDs) {
            return $http.put(url.get() + '/conversations/label', { LabelID, Action, ConversationIDs });
        }
    };
});
