import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { Element } from '../../../models/element';

export const conversationIn = (labelID: string, ID = 'ELEMENT_ID_1') => {
    return { ID, Subject: 'Booking', Labels: [{ ID: labelID }] } as Element;
};

/**
 * The store once a later read has reset the list: each conversation survives only in its own slice.
 * Each needs a `Subject`, or the resolver takes it for the placeholder Mail keeps before a load.
 */
export const offListState = (conversations: { ID: string }[], viewLabelID: string = MAILBOX_LABEL_IDS.INBOX) => {
    return {
        elements: { elements: {}, params: { labelID: viewLabelID } },
        conversations: Object.fromEntries(
            conversations.map((conversation) => [conversation.ID, { Conversation: conversation }])
        ),
        messages: {},
    };
};
