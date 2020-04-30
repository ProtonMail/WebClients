import { Message } from '../../models/message';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { isCustomLabelOrFolder } from '../labels';
import { hasLabel } from '../elements';
import { isDraft, isSentAutoReply } from './messages';

// Reference: Angular/src/app/message/services/findExpandableMessage.js

/**
 * Filter the list of message to find the first readable message
 * - iterate backwards
 * - check if the previous item is read
 * - if the previous isRead === 1, break the iteration
 */
const getFirstMessageToRead = (messages: Message[]): Message | undefined => {
    // A conversation can contains only one draft
    if (messages.length === 0) {
        return;
    }

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

    return messages[position];
};

const getLast = (messages: Message[]): Message | undefined => {
    if (messages.length === 0) {
        return;
    }
    return messages[messages.length - 1];
};

/**
 * Find in the message to scroll and expand
 */
export const findMessageToExpand = (labelID = '', messages: Message[] = []): Message | undefined => {
    if (messages.length === 0) {
        return;
    }

    if (labelID === MAILBOX_LABEL_IDS.STARRED || isCustomLabelOrFolder(labelID)) {
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
