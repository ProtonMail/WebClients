angular.module("proton.models.conversations", [])

.factory("Conversation", function($http, url) {
    return {
        // GET
        /**
         * Get a list of conversations
         * @param {Object} params
         * @param Location
         * @param Page
         * @param PageSize
         * @param Label
         * @param Limit
         * @param Desc
         * @param Keyword
         * @param To
         * @param From
         * @param Subject
         * @param Attachments
         * @param Starred
         * @param Unread
         */
        query: function(params) {
            return $http({
                url: url.get() + '/conversations',
                method: 'GET',
                params: params
            });
        },
        /**
        * Get conversation and associated message metadata
        * @param {String} ConversationId
        */
        get: function(ConversationId) {
            return $http.get(url.get() + '/conversations/' + ConversationId);
        },
        count: function() {
            return $http.get(url.get() + '/conversations/count');
        },
        // PUT
        /**
        * Mark an array of conversations as starred
        * @param {Array} IDs
        */
        star: function(IDs) {
            return $http.put(url.get() + '/conversations/star', {IDs: IDs});
        },
        /**
        * Mark an array of conversations as unstarred
        * @param {Array} IDs
        */
        unstar: function(IDs) {
            return $http.put(url.get() + '/conversations/unstar', {IDs: IDs});
        },
        /**
        * Mark an array of conversations as read
        * @param {Array} IDs
        */
        read: function(IDs) {
            return $http.put(url.get() + '/conversations/read', {IDs: IDs});
        },
        /**
        * Mark an array of conversations as unread
        * @param {Array} IDs
        */
        unread: function(IDs) {
            return $http.put(url.get() + '/conversations/unread', {IDs: IDs});
        },
        /**
         * Move an array of conversations to trash
         * @param {Array} IDs
         */
        trash: function(IDs) {
            return $http.put(url.get() + '/conversations/trash', {IDs: IDs});
        },
        /**
         * Move an array of conversations to inbox
         * @param {Array} IDs
         */
        inbox: function(IDs) {
            return $http.put(url.get() + '/conversations/inbox', {IDs: IDs});
        },
        /**
         * Move an array of conversations to spam
         * @param {Array} IDs
         */
        spam: function(IDs) {
            return $http.put(url.get() + '/conversations/spam', {IDs: IDs});
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         */
        archive: function(IDs) {
            return $http.put(url.get() + '/conversations/archive', {IDs: IDs});
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         */
        delete: function(IDs) {
            return $http.put(url.get() + '/conversations/delete', {IDs: IDs});
        },
        /**
         * Label/unlabel an array of conversations
         * @param {String} LabelID
         * @param {Integer} Action
         * @param {Array} ConversationIDs
         */
        labels: function(LabelID, Action, ConversationIDs) {
            return $http.put(url.get() + '/conversations/label', {LabelID: LabelID, Action: Action, ConversationIDs: ConversationIDs});
        }
    };
});
