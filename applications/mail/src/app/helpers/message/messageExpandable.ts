import { Message } from '../../models/message';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { isCustomLabel } from '../labels';
import { hasLabel } from '../elements';
import { isDraft, isSentAutoReply } from '../message';

// Reference: Angular/src/app/message/services/findExpandableMessage.js

/**
 * Filter the list of message to find the first readable message
 * - iterate backwards
 * - check if the previous item is read
 * - if the previous isRead === 1, break the iteration
 */
const getFirstMessageToRead = (messages: Message[]): Message => {
    // Else we open the first message unread beginning to the end list
    let index = messages.length;
    let contains = false;

    while (--index > 0) {
        if (messages[index - 1].Unread === 0) {
            // Is read
            contains = true;
            break;
        }
    }

    const position = contains ? index : 0;
    // A conversation can contains only one draft
    return messages.length ? messages[position] : messages[0];
};

const getLast = (messages: Message[]): Message => {
    if (messages.length === 0) {
        return {};
    }
    return messages[messages.length - 1];
};

/**
 * Find in the message to scroll and expand
 */
export const findMessageToExpand = (labelID = '', messages: Message[] = []): Message => {
    if (labelID === MAILBOX_LABEL_IDS.STARRED || isCustomLabel(labelID)) {
        return getFirstMessageToRead(messages.filter((message) => hasLabel(message, labelID) && !isDraft(message)));
    }

    if (labelID === MAILBOX_LABEL_IDS.DRAFTS || labelID === MAILBOX_LABEL_IDS.ALL_DRAFTS) {
        return getLast(messages.filter(isDraft));
    }

    const realMessages = messages.filter((message) => !isDraft(message) && !isSentAutoReply(message));
    const latest = getLast(realMessages);

    if (latest && latest.Unread === 0) {
        return latest;
    }

    return getFirstMessageToRead(realMessages);
};
