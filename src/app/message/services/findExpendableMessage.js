import _ from 'lodash';
import { flow, filter, last } from 'lodash/fp';

import { SENT, ENCRYPTED_STATUS, DRAFT } from '../../constants';

/* @ngInject */
function findExpendableMessage(tools, $state, $stateParams) {
    const isSentAutoReply = ({ Type, IsEncrypted, ParsedHeaders = {} }) => {
        if (!(Type & SENT)) {
            return false;
        }

        if (IsEncrypted === ENCRYPTED_STATUS.AUTOREPLY) {
            return true;
        }

        const autoReplyHeaders = ['X-Autoreply', 'X-Autorespond', 'X-Autoreply-From', 'X-Mail-Autoreply'];
        const autoReplyHeaderValues = [
            ['Auto-Submitted', 'auto-replied'],
            ['Precedence', 'auto_reply'],
            ['X-Precedence', 'auto_reply'],
            ['Delivered-To', 'autoresponder']
        ];
        // These headers are not always available. But we should check them to support
        // outlook / mail autoresponses.
        return (
            autoReplyHeaders.some((h) => h in ParsedHeaders) ||
            autoReplyHeaderValues.some(([k, v]) => k in ParsedHeaders && ParsedHeaders[k].toLowerCase() === v)
        );
    };

    /**
     * Filter the list of message to find the first readable message
     * - iterate backwards
     * - check if the previous item is read
     * - if the previous isRead === 1, break the iteration
     * @param {Array} list list of messages
     * @return {Ressoure}
     */
    const getMessage = (list = []) => {
        // Else we open the first message unread beginning to the end list
        let index = list.length;
        let contains = false;

        while (--index > 0) {
            if (list[index - 1].IsRead === 1) {
                // Is read
                contains = true;
                break;
            }
        }

        const position = contains ? index : 0;
        // A conversation can contains only one draft
        return list.length ? list[position] : list[0];
    };

    /**
     * Find in the message to scroll and expand
     * @param  {Array}  list List of message
     * @return {Object}
     */
    function find(messages = []) {
        let thisOne;

        const filterCb = (cb) => flow(filter(cb), last)(messages);

        const currentLocation = tools.currentLocation();

        switch (true) {
            // If we open a conversation in the sent folder
            case tools.typeView() === 'message':
                thisOne = _.last(messages);
                break;

            case !!$stateParams.messageID:
                thisOne = _.find(messages, { ID: $stateParams.messageID });
                break;

            case $state.includes('secured.starred.**'):
            case $state.includes('secured.label.**'):
                thisOne = getMessage(
                    _.filter(messages, (m) => m.LabelIDs.indexOf(currentLocation) > -1 && m.Type !== DRAFT)
                );
                break;

            case $state.includes('secured.allDrafts.**'):
            case $state.includes('secured.drafts.**'):
                thisOne = filterCb(({ Type }) => Type === DRAFT);
                break;

            default: {
                const latest = filterCb((m) => m.Type !== DRAFT && !isSentAutoReply(m));

                if (latest && latest.IsRead === 1) {
                    thisOne = latest;
                    break;
                }

                thisOne = getMessage(_.filter(messages, (m) => m.Type !== DRAFT && !isSentAutoReply(m)));
                break;
            }
        }

        return thisOne || {};
    }
    return { find };
}
export default findExpendableMessage;
