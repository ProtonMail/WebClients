import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients as getMessageRecipients, getSender, isDraft, isSent } from '@proton/shared/lib/mail/messages';
import uniqueBy from '@proton/utils/uniqueBy';

import type { Element } from '../models/element';
import { getRecipients as getConversationRecipients, getSenders } from './conversation';

/** The locations whose rows are about who the mail went *to*, not who it came from. */
const RECIPIENT_DISPLAY_LABEL_IDS: MAILBOX_LABEL_IDS[] = [
    MAILBOX_LABEL_IDS.SENT,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.DRAFTS,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.SCHEDULED,
];

/**
 * Whether a row shows recipients instead of senders — true in the sent-style locations, and for anything
 * the user sent or drafted wherever it appears.
 */
export const getDisplayRecipients = (element: Element, labelID: string): boolean =>
    RECIPIENT_DISPLAY_LABEL_IDS.includes(labelID as MAILBOX_LABEL_IDS) || isSent(element) || isDraft(element);

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

/**
 * The people a row actually names: {@link getElementSenders} deduped by canonical address, so a thread
 * with five mails from one person reads as one name. Shared so the row on screen and the row serialised
 * for the Lumo agent can never name a different set.
 */
export const getUniqueElementSenders = (
    element: Element,
    conversationMode: boolean,
    displayRecipients: boolean
): Recipient[] =>
    uniqueBy(getElementSenders(element, conversationMode, displayRecipients), ({ Address }: Recipient) =>
        canonicalizeInternalEmail(Address)
    );
