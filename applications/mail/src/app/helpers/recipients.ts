import { isSelfAddress } from '@proton/mail-message/helpers/addresses';
import type { Conversation } from '@proton/mail-message/models/conversation';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { isBlockedIncomingDefaultAddress } from '@proton/shared/lib/helpers/incomingDefaults';
import type { Address, Recipient } from '@proton/shared/lib/interfaces/Address';
import type { IncomingDefault } from '@proton/shared/lib/interfaces/IncomingDefault';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients as getMessageRecipients, getSender, isDraft, isSent } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';
import uniqueBy from '@proton/utils/uniqueBy';

import type { Element } from '../models/element';
import { getRecipients as getConversationRecipients, getSenders } from './conversation';
import { isElementConversation, isElementMessage } from './elementTypeGuards';

/** The locations whose rows are about who the mail went *to*, not who it came from. */
const RECIPIENT_DISPLAY_LABEL_IDS = new Set<MAILBOX_LABEL_IDS>([
    MAILBOX_LABEL_IDS.SENT,
    MAILBOX_LABEL_IDS.ALL_SENT,
    MAILBOX_LABEL_IDS.DRAFTS,
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.SCHEDULED,
]);

/**
 * Whether a row shows recipients instead of senders — true in the sent-style locations, and for anything
 * the user sent or drafted wherever it appears.
 */
export const getDisplayRecipients = (element: Element, labelID: string): boolean =>
    RECIPIENT_DISPLAY_LABEL_IDS.has(labelID as MAILBOX_LABEL_IDS) || isSent(element) || isDraft(element);

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

export const getNumParticipants = (element: Element) => {
    let recipients: Recipient[];

    if (isElementMessage(element)) {
        const { ToList = [], CCList = [], BCCList = [], Sender = {} } = element;
        recipients = [...ToList, ...CCList, ...BCCList, Sender as Recipient];
    } else {
        const { Senders = [], Recipients = [] } = element as Conversation;
        recipients = [...Recipients, ...Senders];
    }

    return unique(recipients.map(({ Address }: Recipient) => canonicalizeInternalEmail(Address))).length;
};

export const getSendersToBlock = (
    elements: Element[],
    incomingDefaultsAddresses: IncomingDefault[],
    addresses: Address[]
) => {
    const allSenders: Recipient[] = [];

    // Get all senders without duplicates
    elements.forEach((element) => {
        if (isElementConversation(element)) {
            element?.Senders?.map((sender) => {
                if (sender && allSenders.every((s) => s.Address !== sender.Address)) {
                    allSenders.push(sender);
                }
            });
        } else {
            const sender = (element as Message).Sender;
            if (sender && allSenders.every((s) => s.Address !== sender.Address)) {
                allSenders.push(element.Sender);
            }
        }
    }, []);

    // Remove self and blocked addresses
    return allSenders
        .filter((sender) => {
            if (sender) {
                const isSenderBlocked = isBlockedIncomingDefaultAddress(incomingDefaultsAddresses, sender.Address);
                const isSenderSelfAddress = isSelfAddress(sender.Address, addresses);

                return !isSenderBlocked && !isSenderSelfAddress;
            }
            return;
        })
        .filter(isTruthy);
};
