import _ from 'lodash';
import { CONVERSATION_REQUEST_SIZE, MAILBOX_IDENTIFIERS } from '../../constants';

/* @ngInject */
function conversationApi($http, chunk, url) {
    const { archive, trash, inbox, spam, starred } = MAILBOX_IDENTIFIERS;
    const requestURL = url.build('conversations');

    /**
     * Chunk conversation requests by IDs
     * @param  {String} url
     * @param  {String} method
     * @param  {Object} data
     * @return {Promise}
     */
    async function chunkRequest(url = '', method = '', data = {}) {
        const promises = _.reduce(
            chunk(data.IDs, CONVERSATION_REQUEST_SIZE),
            (acc, IDs = []) => {
                return acc.concat($http({ url, method, data: _.extend({}, data, { IDs }) }));
            },
            []
        );

        const list = await Promise.all(promises);

        return list.reduce((acc, item) => acc.concat(item), []);
    }

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
        get(ConversationID = '', params) {
            return $http.get(requestURL(ConversationID), { params });
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
            return this.label(starred, IDs);
        },
        /**
         * Mark an array of conversations as unstarred
         * @param {Array} IDs
         * @return {Promise}
         */
        unstar(IDs = []) {
            return this.unlabel(starred, IDs);
        },
        /**
         * Mark an array of conversations as read
         * @param {Array} IDs
         * @return {Promise}
         */
        read(IDs = []) {
            return chunkRequest(requestURL('read'), 'PUT', { IDs });
        },
        /**
         * Mark an array of conversations as unread
         * @param {Array} IDs
         * @param {String} LabelID
         * @return {Promise}
         */
        unread(IDs = [], LabelID) {
            return chunkRequest(requestURL('unread'), 'PUT', { IDs, LabelID });
        },
        /**
         * Move an array of conversations to trash
         * @param {Array} IDs
         * @return {Promise}
         */
        trash(IDs = []) {
            return this.label(trash, IDs);
        },
        /**
         * Move an array of conversations to inbox
         * @param {Array} IDs
         * @return {Promise}
         */
        inbox(IDs = []) {
            return this.label(inbox, IDs);
        },
        /**
         * Move an array of conversations to spam
         * @param {Array} IDs
         * @return {Promise}
         */
        spam(IDs = []) {
            return this.label(spam, IDs);
        },
        /**
         * Move an array of conversations to archive
         * @param {Array} IDs
         * @return {Promise}
         */
        archive(IDs = []) {
            return this.label(archive, IDs);
        },
        /**
         * Move an array of conversations to tr
         * @param {Array} IDs
         * @return {Promise}
         */
        delete(IDs = [], LabelID) {
            return chunkRequest(requestURL('delete'), 'PUT', { IDs, LabelID });
        },
        /**
         * Label an array of conversations
         * @param {String} LabelID
         * @param {Array} IDs
         * @return {Promise}
         */
        label(LabelID = '', IDs = []) {
            return chunkRequest(requestURL('label'), 'PUT', { IDs, LabelID });
        },
        /**
         * Unlabel an array of conversations
         * @param {String} LabelID
         * @param {Array} IDs
         * @return {Promise}
         */
        unlabel(LabelID = '', IDs = []) {
            return chunkRequest(requestURL('unlabel'), 'PUT', { IDs, LabelID });
        }
    };
}
export default conversationApi;
