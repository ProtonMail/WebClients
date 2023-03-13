import { Recipient } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients as getMessageRecipients, getSender } from '@proton/shared/lib/mail/messages';

import { Element } from '../models/element';
import { getRecipients as getConversationRecipients, getSenders } from './conversation';

/**
 * Get an array of Recipients that we use to display the recipients in the message list
 * In most locations, we want to see the Senders at this place, but for some other (e.g. Sent)
 * we will need to display the recipients instead.
 */
export const getElementSenders = (
    element: Element,
    conversationMode: boolean,
    displayRecipients: boolean
): Recipient[] => {
    // For some locations (e.g. Sent folder), if this is a message that the user sent,
    // we don't display the sender but the recipients
    let recipients: Recipient[] = [];
    if (displayRecipients) {
        recipients = conversationMode ? getConversationRecipients(element) : getMessageRecipients(element as Message);
    } else {
        if (conversationMode) {
            recipients = getSenders(element);
        } else {
            const sender = getSender(element as Message);
            recipients = sender ? [sender] : [];
        }
    }

    return recipients;
};
