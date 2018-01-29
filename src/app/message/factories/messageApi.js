/* @ngInject */
function messageApi($http, url) {
    const requestURL = url.build('messages');

    /**
     * Send a message
     * @param  {Object} params
     * @return {Promise}
     */
    const send = (params = {}) => {
        return $http.post(requestURL('send', params.id), params);
    };

    /**
     * Create a new draft message
     * @param  {Object} params
     * @return {Promise}
     */
    const createDraft = (params = {}) => $http.post(requestURL('draft'), params);

    /**
     * Get message
     * @param {String} messageID
     * @return {Promise}
     */
    const get = (messageID = '') => $http.get(requestURL(messageID));

    /**
     * Get a list of message metadata
     * @param {Object} params
     * @return {Promise}
     */
    const query = (params = {}) => $http.get(requestURL(), { params });

    /**
     * Get grouped message count
     * @return {Promise}
     */
    const count = () => $http.get(requestURL('count'));

    /**
     * Update a draft message
     * @param {Objecet} params
     * @return {Promise}
     */
    const updateDraft = (params = {}) => {
        const messageID = params.ID || params.id;
        return $http.put(requestURL('draft', messageID), params);
    };

    /**
     * Mark an array of messages as starred
     * @param {Object}
     * @return {Promise}
     */
    const star = (params = {}) => $http.put(requestURL('star'), params);

    /**
     * Mark an array of messages as unstarred
     * @param {Object}
     * @return {Promise}
     */
    const unstar = (params = {}) => $http.put(requestURL('unstar'), params);

    /**
     * Mark an array of messages as read
     * @param {Object}
     * @return {Promise}
     */
    const read = (params = {}) => $http.put(requestURL('read'), params);

    /**
     * Mark an array of messages as unread
     * @param {Object}
     * @return {Promise}
     */
    const unread = (params = {}) => $http.put(requestURL('unread'), params);

    /**
     * Move an array of messages to trash
     * @param {Object}
     * @return {Promise}
     */
    const trash = (params = {}) => $http.put(requestURL('trash'), params);

    /**
     * Move an array of messages to inbox
     * @param {Object}
     * @return {Promise}
     */
    const inbox = (params = {}) => $http.put(requestURL('inbox'), params);

    /**
     * Move an array of messages to spam
     * @param {Object}
     * @return {Promise}
     */
    const spam = (params = {}) => $http.put(requestURL('spam'), params);

    /**
     * Move an array of messages to archive
     * @param {Object} params
     * @return {Promise}
     */
    const archive = (params = {}) => $http.put(requestURL('archive'), params);

    /**
     * Delete an array of messages
     * @param {Object} params
     * @return {Promise}
     */
    const destroy = (params = {}) => $http.put(requestURL('delete'), params);

    /**
     * Undelete an array of messages
     * @param {Object} params
     * @return {Promise}
     */
    const undelete = (params = {}) => $http.put(requestURL('undelete'), params);

    /**
     * Label/unlabel an array of messages
     * @param {String} LabelID
     * @param {Integer} Action
     * @param {Array} MessageIDs
     * @return {Promise}
     */
    const label = (LabelID, Action, MessageIDs) => $http.put(requestURL('label'), { LabelID, Action, MessageIDs });

    /**
     * Delete all messages in the draft folder
     * @return {Promise}
     */
    const emptyDraft = () => $http.delete(requestURL('draft'));

    /**
     * Delete all messages in the spam folder
     * @return {Promise}
     */
    const emptySpam = () => $http.delete(requestURL('spam'));

    /**
     * Delete all messages in the trash folder
     * @return {Promise}
     */
    const emptyTrash = () => $http.delete(requestURL('trash'));

    /**
     * Delete all messages with a label
     * @param  {String} Label
     * @return {Promise}
     */
    const emptyLabel = (Label) => $http.delete(requestURL('empty'), { params: { Label } });

    return {
        send,
        createDraft,
        get,
        query,
        count,
        updateDraft,
        star,
        unstar,
        read,
        unread,
        trash,
        inbox,
        spam,
        archive,
        delete: destroy,
        undelete,
        label,
        emptyDraft,
        emptySpam,
        emptyTrash,
        emptyLabel
    };
}
export default messageApi;
