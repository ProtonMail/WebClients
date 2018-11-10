import { MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function messageApi($http, url) {
    const requestURL = url.build('messages');

    /**
     * Send a message
     * @param  {Object} params
     * @param  {Object} config
     * @return {Promise}
     */
    const send = (params = {}, config = {}) => $http.post(requestURL(params.id), params, config);
    const label = (params) => $http.put(requestURL('label'), params);
    const unlabel = (params) => $http.put(requestURL('unlabel'), params);

    /**
     * Create a new draft message
     * @param  {Object} params
     * @return {Promise}
     */
    const createDraft = (params = {}) => $http.post(requestURL(), params);

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
        return $http.put(requestURL(messageID), params);
    };

    /**
     * Mark an array of messages as starred
     * @param {Object}
     * @return {Promise}
     */
    const star = (params = {}) => label({ LabelID: MAILBOX_IDENTIFIERS.starred, ...params });

    /**
     * Mark an array of messages as unstarred
     * @param {Object}
     * @return {Promise}
     */
    const unstar = (params = {}) => unlabel({ LabelID: MAILBOX_IDENTIFIERS.starred, ...params });

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
    const trash = (params = {}) => label({ LabelID: MAILBOX_IDENTIFIERS.trash, ...params });

    /**
     * Move an array of messages to inbox
     * @param {Object}
     * @return {Promise}
     */
    const inbox = (params = {}) => label({ LabelID: MAILBOX_IDENTIFIERS.inbox, ...params });

    /**
     * Move an array of messages to spam
     * @param {Object}
     * @return {Promise}
     */
    const spam = (params = {}) => label({ LabelID: MAILBOX_IDENTIFIERS.spam, ...params });

    /**
     * Move an array of messages to archive
     * @param {Object} params
     * @return {Promise}
     */
    const archive = (params = {}) => label({ LabelID: MAILBOX_IDENTIFIERS.archive, ...params });

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
     * Delete all messages with a label
     * @param {String} LabelID
     * @param {String} AddressID
     * @return {Promise}
     */
    const emptyLabel = (LabelID, AddressID) =>
        $http.delete(requestURL('empty'), {
            params: {
                LabelID,
                AddressID
            }
        });

    /**
     * Delete all messages in the draft folder
     * @return {Promise}
     */
    const emptyDraft = () => emptyLabel(MAILBOX_IDENTIFIERS.drafts);

    /**
     * Delete all messages in the all draft folder
     * @return {Promise}
     */
    const emptyAllDraft = () => emptyLabel(MAILBOX_IDENTIFIERS.allDrafts);

    /**
     * Delete all messages in the spam folder
     * @return {Promise}
     */
    const emptySpam = () => emptyLabel(MAILBOX_IDENTIFIERS.spam);

    /**
     * Delete all messages in the trash folder
     * @return {Promise}
     */
    const emptyTrash = () => emptyLabel(MAILBOX_IDENTIFIERS.trash);

    /**
     * Send read receipt confirmation
     * @param {String} messageID
     * @return {Promise}
     */
    const receipt = (messageID) => $http.post(requestURL(messageID, 'receipt'));

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
        receipt,
        archive,
        delete: destroy,
        undelete,
        label,
        emptyDraft,
        emptyAllDraft,
        emptySpam,
        emptyTrash,
        emptyLabel,
        unlabel
    };
}
export default messageApi;
